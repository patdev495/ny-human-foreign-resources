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
            "entry_date": "2026-01-01",
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
    assert "Trả phòng cũ" in res_conflict.json()["detail"]

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


def test_stay_with_expected_end_date(client: TestClient) -> None:
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "LI WEI",
            "gender": "Nam",
            "nationality": "Trung Quoc",
            "entry_date": "2026-05-01",
        },
    )
    emp_id = emp_res.json()["id"]

    stay_payload = {
        "employee_id": emp_id,
        "accommodation_type": "KTX",
        "stay_type": "CO_DINH",
        "has_meals": True,
        "start_date": "2026-05-01",
        "expected_end_date": "2026-10-31",
    }
    res = client.post("/api/hr-foreign/stays", json=stay_payload)
    assert res.status_code == 201
    stay_data = res.json()
    assert stay_data["expected_end_date"] == "2026-10-31"


def test_hotel_stay_invoice_amount_and_checkout(client: TestClient) -> None:
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "ZHANG SAN",
            "gender": "Nam",
            "nationality": "Trung Quoc",
            "entry_date": "2026-07-01",
        },
    )
    emp_id = emp_res.json()["id"]

    hotel_res = client.post(
        "/api/hr-foreign/hotels",
        json={"name": "Khách sạn Mường Thanh", "address": "Bắc Giang"},
    )
    hotel_id = hotel_res.json()["id"]

    # 1. Create Hotel Stay with mandatory start_date and no invoice_amount yet
    stay_payload = {
        "employee_id": emp_id,
        "accommodation_type": "HOTEL",
        "hotel_id": hotel_id,
        "hotel_room_number": "P.302",
        "stay_type": "CONG_TAC",
        "has_meals": False,
        "start_date": "2026-07-01",
    }
    res = client.post("/api/hr-foreign/stays", json=stay_payload)
    assert res.status_code == 201
    stay_id = res.json()["id"]
    assert res.json()["invoice_amount"] is None

    # 2. Checkout Hotel stay and provide invoice_amount (flexible entry)
    update_res = client.put(
        f"/api/hr-foreign/stays/{stay_id}",
        json={
            **stay_payload,
            "end_date": "2026-07-15",
            "invoice_amount": 15000000.0,
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["end_date"] == "2026-07-15"
    assert update_res.json()["invoice_amount"] == 15000000.0


def test_checkout_stay_syncs_travel_record_and_employee_actual_exit(client: TestClient) -> None:
    # 1. Create employee with an open travel record (entry_date set, actual_exit_date None)
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "CHEN SHI PU",
            "gender": "Nam",
            "nationality": "Trung Quoc",
            "entry_date": "2026-05-01",
        },
    )
    emp_id = emp_res.json()["id"]

    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "505"})
    room_id = room_res.json()["id"]

    # 2. Create Stay
    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-05-01",
        },
    )
    stay_id = stay_res.json()["id"]

    # 3. Checkout stay with end_date = 2026-07-31
    checkout_res = client.put(
        f"/api/hr-foreign/stays/{stay_id}",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-05-01",
            "end_date": "2026-07-31",
        },
    )
    assert checkout_res.status_code == 200

    # 4. Record actual exit date on travel record
    hist_res = client.get(f"/api/hr-foreign/employees/{emp_id}/history")
    tr_id = hist_res.json()["travel_records"][0]["id"]
    client.put(
        f"/api/hr-foreign/employees/{emp_id}/travel-records/{tr_id}",
        json={"entry_date": "2026-05-01", "actual_exit_date": "2026-07-31"},
    )
    hist_res2 = client.get(f"/api/hr-foreign/employees/{emp_id}/history")
    assert hist_res2.status_code == 200
    hist_data = hist_res2.json()
    
    assert len(hist_data["travel_records"]) == 1
    assert hist_data["travel_records"][0]["actual_exit_date"] == "2026-07-31"
    assert hist_data["employee"]["actual_exit_date"] == "2026-07-31"

    # 5. Room occupancy board must no longer list this checked-out stay in room 505 today
    occ_res = client.get("/api/hr-foreign/rooms/occupancy")
    assert occ_res.status_code == 200
    room_505 = next((r for r in occ_res.json() if r["room_number"] == "505"), None)
    assert room_505 is not None
    assert len(room_505["active_residents"]) == 0


def test_delete_stay_does_not_affect_travel_record(client: TestClient) -> None:
    # 1. Create employee with open travel record & stay
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "LIU WEI", "gender": "Nam", "entry_date": "2026-04-01"},
    )
    emp_id = emp_res.json()["id"]

    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "808"})
    room_id = room_res.json()["id"]

    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-04-01",
        },
    )
    assert stay_res.status_code == 201
    stay_id = stay_res.json()["id"]

    # Verify 1 travel record & 1 stay exist
    hist1 = client.get(f"/api/hr-foreign/employees/{emp_id}/history").json()
    assert len(hist1["travel_records"]) == 1
    assert len(hist1["stays"]) == 1

    # 2. Delete stay
    del_stay_res = client.delete(f"/api/hr-foreign/stays/{stay_id}")
    assert del_stay_res.status_code == 204

    # 3. Verify stay is deleted, BUT travel record remains intact
    hist2 = client.get(f"/api/hr-foreign/employees/{emp_id}/history").json()
    assert len(hist2["stays"]) == 0
    assert len(hist2["travel_records"]) == 1
    assert hist2["travel_records"][0]["entry_date"] == "2026-04-01"




