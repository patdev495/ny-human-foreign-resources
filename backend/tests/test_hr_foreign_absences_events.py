from __future__ import annotations

import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_absences_events_price_configs(client: TestClient) -> None:
    # Setup employee and stay
    emp = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "CHEN MIN",
            "gender": "Nam",
            "nationality": "Trung Quoc",
            "passport_number": "C55443322",
        },
    ).json()

    room = client.post("/api/hr-foreign/rooms", json={"room_number": "303"}).json()

    stay = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp["id"],
            "accommodation_type": "KTX",
            "room_id": room["id"],
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-01-01",
        },
    ).json()

    stay_id = stay["id"]

    # 1. Meal Absences CRUD
    abs_res = client.post(
        f"/api/hr-foreign/stays/{stay_id}/meal-absences",
        json={"absence_date": "2026-01-15", "reason": "Ve nuoc an tet"},
    )
    assert abs_res.status_code == 201, abs_res.json()
    absence_id = abs_res.json()["id"]

    get_abs = client.get(f"/api/hr-foreign/stays/{stay_id}/meal-absences")
    assert len(get_abs.json()) == 1

    del_abs = client.delete(f"/api/hr-foreign/meal-absences/{absence_id}")
    assert del_abs.status_code == 204

    # 2. Event Days CRUD
    ev_res = client.post(
        "/api/hr-foreign/event-days",
        json={
            "event_date": "2026-02-14",
            "event_type": "PRESIDENT_VISIT",
            "notes": "Chu tich sang tham va lam viec",
        },
    )
    assert ev_res.status_code == 201, ev_res.json()
    ev_id = ev_res.json()["id"]

    # Duplicate date error
    ev_dup = client.post(
        "/api/hr-foreign/event-days",
        json={"event_date": "2026-02-14", "event_type": "PRESIDENT_VISIT"},
    )
    assert ev_dup.status_code == 400

    get_evs = client.get("/api/hr-foreign/event-days")
    assert len(get_evs.json()) == 1

    # 3. Meal Price Configs CRUD
    p_res1 = client.post(
        "/api/hr-foreign/meal-price-configs",
        json={
            "day_type": "NORMAL",
            "price_per_meal": 40000,
            "effective_from": "2026-03-01",
        },
    )
    assert p_res1.status_code == 201

    p_list = client.get("/api/hr-foreign/meal-price-configs")
    assert len(p_list.json()) >= 1


def test_meal_absence_with_session_type(client: TestClient) -> None:
    emp = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "LI WEI", "gender": "Nam"},
    ).json()

    stay = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp["id"],
            "accommodation_type": "KTX",
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-01-01",
        },
    ).json()

    # Create breakfast-only absence
    abs1 = client.post(
        f"/api/hr-foreign/stays/{stay['id']}/meal-absences",
        json={"absence_date": "2026-01-10", "meal_type": "BREAKFAST", "reason": "Di Hop Sang"},
    )
    assert abs1.status_code == 201, abs1.json()
    assert abs1.json()["meal_type"] == "BREAKFAST"

    # Create default absence (ALL_DAY)
    abs2 = client.post(
        f"/api/hr-foreign/stays/{stay['id']}/meal-absences",
        json={"absence_date": "2026-01-11", "reason": "Vang Ca Ngay"},
    )
    assert abs2.status_code == 201, abs2.json()
    assert abs2.json()["meal_type"] == "ALL_DAY"


def test_event_batch_assignment_and_day_types(client: TestClient) -> None:
    # 1. Create a custom Day Type: TET
    res_type = client.post(
        "/api/hr-foreign/meal-price-configs",
        json={
            "day_type": "TET",
            "day_type_name": "Tết Nguyên Đán",
            "price_per_meal": 60000.0,
            "effective_from": "2026-01-01",
        },
    )
    assert res_type.status_code == 201, res_type.json()
    assert res_type.json()["day_type"] == "TET"
    assert res_type.json()["day_type_name"] == "Tết Nguyên Đán"

    # 2. Batch register Event Days over a Date Range (Feb 15 to Feb 17)
    res_batch = client.post(
        "/api/hr-foreign/event-days/batch",
        json={
            "start_date": "2026-02-15",
            "end_date": "2026-02-17",
            "event_type": "TET",
            "notes": "Nghỉ Tết Nguyên Đán",
        },
    )
    assert res_batch.status_code == 201, res_batch.json()
    created_events = res_batch.json()
    assert len(created_events) == 3
    dates = [e["event_date"] for e in created_events]
    assert dates == ["2026-02-15", "2026-02-16", "2026-02-17"]

    # 3. Single Day Event registration (only start_date provided)
    res_single = client.post(
        "/api/hr-foreign/event-days/batch",
        json={
            "start_date": "2026-03-08",
            "event_type": "TET",
            "notes": "Ngày Quốc tế Phụ nữ",
        },
    )
    assert res_single.status_code == 201, res_single.json()
    assert len(res_single.json()) == 1
    assert res_single.json()[0]["event_date"] == "2026-03-08"


def test_event_day_and_meal_price_config_update_delete(client: TestClient) -> None:
    # 1. Test EventDay PUT & DELETE
    ev_create = client.post(
        "/api/hr-foreign/event-days",
        json={
            "event_date": "2026-05-01",
            "event_type": "HOLIDAY",
            "notes": "Quoc te lao dong",
        },
    ).json()
    ev_id = ev_create["id"]

    ev_update = client.put(
        f"/api/hr-foreign/event-days/{ev_id}",
        json={"notes": "Quoc te lao dong - Nghi bu"},
    )
    assert ev_update.status_code == 200
    assert ev_update.json()["notes"] == "Quoc te lao dong - Nghi bu"

    ev_del = client.delete(f"/api/hr-foreign/event-days/{ev_id}")
    assert ev_del.status_code == 204

    # 2. Test MealPriceConfig PUT & DELETE
    cfg_create = client.post(
        "/api/hr-foreign/meal-price-configs",
        json={
            "day_type": "HOLIDAY",
            "day_type_name": "Ngày lễ",
            "price_per_meal": 50000,
            "effective_from": "2026-01-01",
        },
    ).json()
    cfg_id = cfg_create["id"]

    cfg_update = client.put(
        f"/api/hr-foreign/meal-price-configs/{cfg_id}",
        json={"price_per_meal": 55000, "day_type_name": "Ngày lễ tết"},
    )
    assert cfg_update.status_code == 200
    assert cfg_update.json()["price_per_meal"] == 55000
    assert cfg_update.json()["day_type_name"] == "Ngày lễ tết"

    cfg_del = client.delete(f"/api/hr-foreign/meal-price-configs/{cfg_id}")
    assert cfg_del.status_code == 204
