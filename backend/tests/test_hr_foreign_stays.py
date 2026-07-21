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


def test_stay_crud_and_single_active_constraint(client: TestClient) -> None:
    # Create Employee and Room
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "WANG FANG",
            "gender": "Nữ",
            "nationality": "Trung Quoc",
            "passport_number": "W11223344",
        },
    )
    emp_id = emp_res.json()["id"]

    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "202"})
    room_id = room_res.json()["id"]

    # 1. Create Active Stay
    stay_payload = {
        "employee_id": emp_id,
        "accommodation_type": "KTX",
        "room_id": room_id,
        "stay_type": "CO_DINH",
        "has_meals": True,
        "start_date": "2026-01-01",
        "end_date": None,
        "notes": "Dot 1",
    }
    res = client.post("/api/hr-foreign/stays", json=stay_payload)
    assert res.status_code == 201, res.json()
    stay_id = res.json()["id"]

    # 2. Attempt creating 2nd active stay for same employee -> Expect 400 Bad Request
    res_conflict = client.post("/api/hr-foreign/stays", json=stay_payload)
    assert res_conflict.status_code == 400
    assert "Đã có đợt lưu trú đang hoạt động" in res_conflict.json()["detail"]

    # 3. Get Room Occupancy -> Room 202 should show WANG FANG
    occ_res = client.get("/api/hr-foreign/rooms/occupancy")
    assert occ_res.status_code == 200
    occ_data = occ_res.json()
    room_202 = next((r for r in occ_data if r["room_number"] == "202"), None)
    assert room_202 is not None
    assert len(room_202["active_residents"]) == 1
    assert room_202["active_residents"][0]["name_latin"] == "WANG FANG"

    # 4. Checkout stay (set end_date)
    update_res = client.put(
        f"/api/hr-foreign/stays/{stay_id}",
        json={**stay_payload, "end_date": "2026-06-30"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["end_date"] == "2026-06-30"

    # 5. Now creating new stay works after previous stay ended
    stay_payload_2 = {
        **stay_payload,
        "start_date": "2026-07-01",
    }
    res_new = client.post("/api/hr-foreign/stays", json=stay_payload_2)
    assert res_new.status_code == 201
