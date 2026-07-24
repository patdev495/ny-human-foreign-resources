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


def test_meal_calculation_engine(client: TestClient) -> None:
    # 1. Create 3 employees
    # Emp 1: KTX, has_meals = True (eligible)
    emp1 = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "KIM MIN SOO",
            "gender": "Nam",
            "nationality": "Han Quoc",
            "passport_number": "M1111111",
        },
    ).json()

    # Emp 2: KTX, has_meals = False (excluded)
    emp2 = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "PARK JI SUNG",
            "gender": "Nam",
            "nationality": "Han Quoc",
            "passport_number": "M2222222",
        },
    ).json()

    # Emp 3: HOTEL, has_meals = True (excluded)
    emp3 = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "LEE MIN HO",
            "gender": "Nam",
            "nationality": "Han Quoc",
            "passport_number": "M3333333",
        },
    ).json()

    room1 = client.post("/api/hr-foreign/rooms", json={"room_number": "401"}).json()
    room2 = client.post("/api/hr-foreign/rooms", json={"room_number": "402"}).json()

    # Stays from 2026-01-01 to 2026-01-05 (5 days)
    stay1 = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp1["id"],
            "accommodation_type": "KTX",
            "room_id": room1["id"],
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-01-01",
        },
    ).json()

    stay2 = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp2["id"],
            "accommodation_type": "KTX",
            "room_id": room2["id"],
            "stay_type": "CO_DINH",
            "has_meals": False,
            "start_date": "2026-01-01",
        },
    ).json()

    stay3 = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp3["id"],
            "accommodation_type": "HOTEL",
            "stay_type": "CONG_TAC",
            "has_meals": True,
            "start_date": "2026-01-01",
        },
    ).json()

    # 2. Add Event Day on 2026-01-03 (Chủ tịch sang)
    client.post(
        "/api/hr-foreign/event-days",
        json={"event_date": "2026-01-03", "event_type": "PRESIDENT_VISIT"},
    )

    # 3. Add Meal Absence for Emp 1 stay on 2026-01-04
    client.post(
        f"/api/hr-foreign/stays/{stay1['id']}/meal-absences",
        json={"absence_date": "2026-01-04", "reason": "Di Ha Noi"},
    )

    # 4. Request Meal Expense Report for date range 2026-01-01 to 2026-01-05 (5 days)
    report_res = client.get(
        "/api/hr-foreign/reports/meal-expenses?start_date=2026-01-01&end_date=2026-01-05"
    )
    assert report_res.status_code == 200, report_res.json()
    report = report_res.json()

    assert report["total_employees"] == 1  # Only emp1 is eligible (KTX + has_meals)
    assert len(report["items"]) == 1

    item = report["items"][0]
    assert item["employee_name"] == "KIM MIN SOO"
    assert item["room_number"] == "401"
    assert item["stay_days"] == 5
    assert item["absent_days"] == 1
    assert item["meal_days"] == 4
    assert item["normal_days"] == 3  # Jan 1, Jan 2, Jan 5 (Jan 4 is absent)
    assert item["event_days"] == 1  # Jan 3 (President Visit)
    assert item["meal_count"] == 8  # 4 meal days * 2 meals/day

    # Calculation:
    # 3 normal days (30k breakfast + 40k dinner = 70k): 3 * 70,000 = 210,000
    # 1 event day (50k breakfast + 70k dinner = 120k): 120,000
    # Total cost = 330,000
    assert item["total_cost"] == 330000.0
    assert report["total_expense"] == 330000.0


def test_daily_meal_forecast_and_lock(client: TestClient) -> None:
    # Create 2 employees: 1 KTX, 1 Hotel
    emp_ktx = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "WANG WEI", "gender": "Nam"},
    ).json()
    emp_hotel = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "ZHANG SAN", "gender": "Nam"},
    ).json()

    room = client.post("/api/hr-foreign/rooms", json={"room_number": "505"}).json()
    hotel = client.post("/api/hr-foreign/hotels", json={"name": "Muong Thanh"}).json()

    stay_ktx = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_ktx["id"],
            "accommodation_type": "KTX",
            "room_id": room["id"],
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-07-01",
        },
    ).json()

    client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_hotel["id"],
            "accommodation_type": "HOTEL",
            "hotel_id": hotel["id"],
            "stay_type": "CONG_TAC",
            "has_meals": False,
            "start_date": "2026-07-01",
        },
    )

    # Absence for KTX emp for Breakfast on 2026-07-25
    client.post(
        f"/api/hr-foreign/stays/{stay_ktx['id']}/meal-absences",
        json={"absence_date": "2026-07-25", "meal_type": "BREAKFAST", "reason": "Bong sang"},
    )

    # 1. Get daily meal forecast on 2026-07-25
    res = client.get("/api/hr-foreign/meals/forecast?date=2026-07-25")
    assert res.status_code == 200, res.json()
    forecast = res.json()

    assert forecast["date"] == "2026-07-25"
    assert forecast["breakfast"]["calculated_meal_count"] == 0  # 1 KTX - 1 Breakfast absence = 0
    assert forecast["breakfast"]["is_locked"] is False
    assert forecast["dinner"]["calculated_meal_count"] == 1    # 1 KTX - 0 Dinner absence = 1
    assert forecast["dinner"]["is_locked"] is False

    # 2. Lock Breakfast for 2026-07-25 with custom +1 count (due to Hotel guest eating)
    lock_res = client.post(
        "/api/hr-foreign/meals/lock",
        json={
            "lock_date": "2026-07-25",
            "meal_session": "BREAKFAST",
            "calculated_meal_count": 0,
            "final_meal_count": 1,
            "locked_price_per_meal": 30000.0,
            "notes": "+1 suất cho ZHANG SAN ở Khách sạn ăn đột xuất",
        },
    )
    assert lock_res.status_code == 201, lock_res.json()
    locked = lock_res.json()
    assert locked["meal_session"] == "BREAKFAST"
    assert locked["final_meal_count"] == 1
    assert locked["locked_price_per_meal"] == 30000.0

    # 3. Re-locking Breakfast for 2026-07-25 should update existing lock record successfully
    lock_dup = client.post(
        "/api/hr-foreign/meals/lock",
        json={
            "lock_date": "2026-07-25",
            "meal_session": "BREAKFAST",
            "calculated_meal_count": 0,
            "final_meal_count": 2,
            "locked_price_per_meal": 35000.0,
            "notes": "Cập nhật lại 2 suất",
        },
    )
    assert lock_dup.status_code == 201
    assert lock_dup.json()["final_meal_count"] == 2
    assert lock_dup.json()["locked_price_per_meal"] == 35000.0

    # 4. Verify forecast now shows updated locked breakfast
    f2 = client.get("/api/hr-foreign/meals/forecast?date=2026-07-25").json()
    assert f2["breakfast"]["is_locked"] is True
    assert f2["breakfast"]["final_meal_count"] == 2
    assert f2["breakfast"]["locked_price_per_meal"] == 35000.0
    assert f2["dinner"]["is_locked"] is False


def test_monthly_meal_report_with_locked_snapshots(client: TestClient) -> None:
    emp = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "ZHAO LEI", "gender": "Nam"},
    ).json()

    room = client.post("/api/hr-foreign/rooms", json={"room_number": "606"}).json()

    client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp["id"],
            "accommodation_type": "KTX",
            "room_id": room["id"],
            "stay_type": "CO_DINH",
            "has_meals": True,
            "start_date": "2026-08-01",
            "end_date": "2026-08-05",
        },
    )

    # Lock Breakfast on 2026-08-02 with custom count = 5 (e.g. guest meals added)
    client.post(
        "/api/hr-foreign/meals/lock",
        json={
            "lock_date": "2026-08-02",
            "meal_session": "BREAKFAST",
            "calculated_meal_count": 1,
            "final_meal_count": 5,
            "locked_price_per_meal": 30000.0,
            "notes": "Add 4 guest meals",
        },
    )

    rep = client.get(
        "/api/hr-foreign/reports/meal-expenses?start_date=2026-08-01&end_date=2026-08-05"
    ).json()

    # 1 locked breakfast session (5 meals * 30k = 150k)
    # 4 unlocked breakfasts (4 meals * 30k = 120k)
    # 5 unlocked dinners (5 meals * 40k = 200k)
    # Total meals = 14, Total expense = 470,000
    assert rep["total_meals"] == 14
    assert rep["total_expense"] == 470000.0


def test_meal_expense_report_with_janitor_locks(client: TestClient) -> None:
    # Lock LUNCH on 2026-08-02 with 10 janitor meals @ 25000
    client.post(
        "/api/hr-foreign/meals/lock",
        json={
            "lock_date": "2026-08-02",
            "meal_session": "LUNCH",
            "calculated_meal_count": 10,
            "final_meal_count": 10,
            "locked_price_per_meal": 25000.0,
            "notes": "Chốt cơm trưa lao công 10 suất",
        },
    )

    rep = client.get(
        "/api/hr-foreign/reports/meal-expenses?start_date=2026-08-01&end_date=2026-08-05"
    ).json()

    assert "janitor_items" in rep
    assert len(rep["janitor_items"]) == 1
    assert rep["janitor_items"][0]["date"] == "2026-08-02"
    assert rep["janitor_items"][0]["meal_count"] == 10
    assert rep["janitor_items"][0]["price_per_meal"] == 25000.0
    assert rep["janitor_items"][0]["total_cost"] == 250000.0
    assert rep["total_janitor_meals"] == 10
    assert rep["total_janitor_expense"] == 250000.0

