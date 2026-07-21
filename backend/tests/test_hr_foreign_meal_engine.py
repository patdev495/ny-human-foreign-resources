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
    # 3 normal days * 2 meals/day * 35,000 = 210,000
    # 1 event day * 2 meals/day * 50,000 = 100,000
    # Total cost = 310,000
    assert item["total_cost"] == 310000.0
    assert report["total_expense"] == 310000.0
