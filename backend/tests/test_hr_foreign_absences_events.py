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
