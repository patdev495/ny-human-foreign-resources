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


def test_employee_crud(client: TestClient) -> None:
    # 1. Create Employee
    payload = {
        "name_latin": "LI WEI",
        "name_chinese": "李伟",
        "gender": "Nam",
        "nationality": "Trung Quoc",
        "date_of_birth": "1988-05-20",
        "passport_number": "EA9876543",
        "passport_expiry": "2032-05-20",
        "phone": "0912345678",
        "department": "Ky Thuat",
        "role": "Ky su truong",
        "notes": "Nhân sự mới sang",
    }
    res = client.post("/api/hr-foreign/employees", json=payload)
    assert res.status_code == 201, res.json()
    emp_data = res.json()
    emp_id = emp_data["id"]
    assert emp_data["name_latin"] == "LI WEI"
    assert emp_data["passport_number"] == "EA9876543"

    # 2. Get Employee Detail
    res = client.get(f"/api/hr-foreign/employees/{emp_id}")
    assert res.status_code == 200
    assert res.json()["name_chinese"] == "李伟"

    # 3. Search Employees
    res = client.get("/api/hr-foreign/employees?q=EA987")
    assert res.status_code == 200
    assert len(res.json()) == 1

    res = client.get("/api/hr-foreign/employees?q=Ky Thuat")
    assert res.status_code == 200
    assert len(res.json()) == 1

    res = client.get("/api/hr-foreign/employees?q=NonExistent")
    assert res.status_code == 200
    assert len(res.json()) == 0

    # 4. Get Employee 360 History
    hist_res = client.get(f"/api/hr-foreign/employees/{emp_id}/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["employee"]["name_latin"] == "LI WEI"
    assert isinstance(hist["stays"], list)
    assert isinstance(hist["visas"], list)
    assert isinstance(hist["tam_trus"], list)

    # 5. Update Employee
    update_payload = {**payload, "phone": "0988888888", "notes": "Da cap nhat SĐT"}
    res = client.put(f"/api/hr-foreign/employees/{emp_id}", json=update_payload)
    assert res.status_code == 200
    assert res.json()["phone"] == "0988888888"

    # 6. Delete Employee
    res = client.delete(f"/api/hr-foreign/employees/{emp_id}")
    assert res.status_code == 204

    # Verify deleted
    res = client.get(f"/api/hr-foreign/employees/{emp_id}")
    assert res.status_code == 404


def test_employee_travel_date_validation(client: TestClient) -> None:
    # 1. Reject if actual_exit_date < entry_date
    bad_dates_payload = {
        "name_latin": "ZANG SAN",
        "gender": "Nam",
        "entry_date": "2026-05-10",
        "actual_exit_date": "2026-05-01",  # Before entry date
    }
    res = client.post("/api/hr-foreign/employees", json=bad_dates_payload)
    assert res.status_code == 400
    assert "không thể nhỏ hơn ngày đến" in res.json()["detail"]

    # 2. Create valid employee in VN
    valid_payload = {
        "name_latin": "ZANG SAN",
        "gender": "Nam",
        "entry_date": "2026-05-10",
        "expected_exit_date": "2026-08-10",
        "actual_exit_date": None,
    }
    res = client.post("/api/hr-foreign/employees", json=valid_payload)
    assert res.status_code == 201
    emp_id = res.json()["id"]

    # 3. Reject creating a new entry date while old trip is still open (no actual_exit_date)
    new_trip_payload = {
        **valid_payload,
        "entry_date": "2026-06-01",       # New trip attempt
        "expected_exit_date": "2026-11-01",  # Also updated so Rule 1 doesn't fire
    }
    res = client.put(f"/api/hr-foreign/employees/{emp_id}", json=new_trip_payload)
    assert res.status_code == 400
    assert "chưa có Ngày về thực tế" in res.json()["detail"]


def test_room_crud(client: TestClient) -> None:
    res = client.post("/api/hr-foreign/rooms", json={"room_number": "A101", "notes": "Phong VIP"})
    assert res.status_code == 201, res.json()
    room_id = res.json()["id"]

    res_dup = client.post("/api/hr-foreign/rooms", json={"room_number": "A101", "notes": "Phong trung"})
    assert res_dup.status_code == 400

    res = client.get("/api/hr-foreign/rooms")
    assert res.status_code == 200
    assert len(res.json()) == 1

    res = client.put(f"/api/hr-foreign/rooms/{room_id}", json={"room_number": "A101-NEW", "notes": "Da sua"})
    assert res.status_code == 200
    assert res.json()["room_number"] == "A101-NEW"

    res = client.delete(f"/api/hr-foreign/rooms/{room_id}")
    assert res.status_code == 204
