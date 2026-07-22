from __future__ import annotations

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


def test_hotel_crud(client: TestClient) -> None:
    # 1. Create Hotel
    payload = {
        "name": "Khách sạn Mường Thanh",
        "address": "123 Đường Lê Lợi, Bắc Ninh",
        "phone": "0241-3888888",
        "notes": "Đối tác khách sạn 4 sao",
    }
    res = client.post("/api/hr-foreign/hotels", json=payload)
    assert res.status_code == 201, res.json()
    hotel_data = res.json()
    hotel_id = hotel_data["id"]
    assert hotel_data["name"] == "Khách sạn Mường Thanh"

    # 2. Get Hotels list
    res = client.get("/api/hr-foreign/hotels")
    assert res.status_code == 200
    hotels = res.json()
    assert len(hotels) == 1
    assert hotels[0]["id"] == hotel_id

    # 3. Update Hotel
    update_payload = {
        "name": "Khách sạn Mường Thanh Lux",
        "address": "123 Đường Lê Lợi, Bắc Ninh",
        "phone": "0241-3999999",
        "notes": "Đã đổi tên thương hiệu",
    }
    res = client.put(f"/api/hr-foreign/hotels/{hotel_id}", json=update_payload)
    assert res.status_code == 200
    assert res.json()["name"] == "Khách sạn Mường Thanh Lux"
    assert res.json()["phone"] == "0241-3999999"

    # 4. Delete Hotel
    res = client.delete(f"/api/hr-foreign/hotels/{hotel_id}")
    assert res.status_code == 204

    # Verify deleted
    res = client.get("/api/hr-foreign/hotels")
    assert res.status_code == 200
    assert len(res.json()) == 0


def test_stay_collision_and_checkout(client: TestClient) -> None:
    # Create employee
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "WANG WEI",
            "gender": "Nam",
            "passport_number": "P12345678",
        },
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    # Create room & hotel
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1601"})
    assert room_res.status_code == 201
    room_id = room_res.json()["id"]

    hotel_res = client.post("/api/hr-foreign/hotels", json={"name": "Khách sạn Mường Thanh"})
    assert hotel_res.status_code == 201
    hotel_id = hotel_res.json()["id"]

    # 1. Check-in to Hotel (Active stay)
    stay1_payload = {
        "employee_id": emp_id,
        "accommodation_type": "HOTEL",
        "hotel_id": hotel_id,
        "hotel_room_number": "P302",
        "stay_type": "CONG_TAC",
        "has_meals": False,
        "start_date": "2026-07-01",
    }
    stay1_res = client.post("/api/hr-foreign/stays", json=stay1_payload)
    assert stay1_res.status_code == 201, stay1_res.json()
    stay1_id = stay1_res.json()["id"]

    # 2. Try to Check-in to KTX 1601 while active -> MUST FAIL with collision warning HTTP 400
    stay2_payload = {
        "employee_id": emp_id,
        "accommodation_type": "KTX",
        "room_id": room_id,
        "stay_type": "CO_DINH",
        "has_meals": True,
        "start_date": "2026-07-15",
    }
    stay2_res = client.post("/api/hr-foreign/stays", json=stay2_payload)
    assert stay2_res.status_code == 400, stay2_res.json()
    assert "đang có lượt ở" in stay2_res.json()["detail"] or "collision" in stay2_res.json()["detail"].lower() or "trả phòng" in stay2_res.json()["detail"].lower()

    # 3. Check-out from Hotel
    checkout_res = client.post(
        f"/api/hr-foreign/stays/{stay1_id}/checkout",
        json={"end_date": "2026-07-14"},
    )
    assert checkout_res.status_code == 200, checkout_res.json()
    assert checkout_res.json()["end_date"] == "2026-07-14"

    # 4. Now Check-in to KTX 1601 -> SUCCESS
    stay2_ok_res = client.post("/api/hr-foreign/stays", json=stay2_payload)
    assert stay2_ok_res.status_code == 201, stay2_ok_res.json()

    # 5. Check Room Occupancy Board
    occ_res = client.get("/api/hr-foreign/room-occupancy")
    assert occ_res.status_code == 200
    occupancy = occ_res.json()
    # Occupancy list should contain both KTX rooms and Hotels
    assert len(occupancy) >= 2

