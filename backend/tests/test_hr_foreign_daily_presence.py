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


def test_daily_presence_report(client: TestClient) -> None:
    # 1. Create 2 employees
    emp1 = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "ZANG WEI", "gender": "Nam", "department": "Kỹ thuật"},
    ).json()

    emp2 = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "CHEN MIN", "gender": "Nữ", "department": "Phiên dịch"},
    ).json()

    # 2. Create Room & Hotel
    room = client.post("/api/hr-foreign/rooms", json={"room_number": "P.1601"}).json()
    hotel = client.post("/api/hr-foreign/hotels", json={"name": "KS Mường Thanh"}).json()

    # 3. Create Stay for emp1 (KTX)
    stay1 = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp1["id"],
            "accommodation_type": "KTX",
            "room_id": room["id"],
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-05-01",
            "expected_end_date": "2026-12-31",
        },
    ).json()

    # 4. Create Stay for emp2 (HOTEL)
    stay2 = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp2["id"],
            "accommodation_type": "HOTEL",
            "hotel_id": hotel["id"],
            "hotel_room_number": "P.302",
            "stay_type": "CONG_TAC",
            "has_meals": False,
            "start_date": "2026-06-01",
        },
    ).json()

    # 5. Add a MealAbsence for emp1 on 2026-07-22 (Vắng mặt)
    client.post(
        f"/api/hr-foreign/stays/{stay1['id']}/meal-absences",
        json={"absence_date": "2026-07-22", "reason": "Về nước nghỉ phép ngắn hạn"},
    )

    # 6. Fetch daily presence report for 2026-07-22
    res = client.get("/api/hr-foreign/reports/daily-presence?target_date=2026-07-22")
    assert res.status_code == 200, res.json()
    report = res.json()

    assert report["target_date"] == "2026-07-22"
    assert report["summary"]["total_in_vn"] == 1
    assert report["summary"]["ktx_count"] == 0
    assert report["summary"]["hotel_count"] == 1

    # Fetch daily presence report for 2026-07-23 (emp1 is present again)
    res2 = client.get("/api/hr-foreign/reports/daily-presence?target_date=2026-07-23")
    assert res2.status_code == 200
    report2 = res2.json()
    assert report2["summary"]["total_in_vn"] == 2
    assert report2["summary"]["ktx_count"] == 1
    assert report2["summary"]["hotel_count"] == 1


def test_daily_presence_report_with_exited_employees(client: TestClient) -> None:
    # Create an employee who has exited Vietnam
    emp = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "LIU QIANG", "gender": "Nam", "department": "Quản lý"},
    ).json()

    # Record exit for emp
    client.post(
        f"/api/hr-foreign/employees/{emp['id']}/record-exit",
        json={
            "actual_exit_date": "2026-07-20",
            "action_type": "CHECK_OUT",
            "expected_entry_date": "2026-09-01",
        },
    )

    res = client.get("/api/hr-foreign/reports/daily-presence?target_date=2026-07-22")
    assert res.status_code == 200, res.json()
    data = res.json()

    assert data["summary"]["exited_count"] == 1
    assert len(data["exited_items"]) == 1
    assert data["exited_items"][0]["employee_id"] == emp["id"]
    assert data["exited_items"][0]["actual_exit_date"] == "2026-07-20"
    assert data["exited_items"][0]["expected_entry_date"] == "2026-09-01"

