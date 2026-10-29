from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from features.hr_foreign.models import ForeignEmployee, Room, Stay, TravelRecord
from tests.test_meal_reporting_public import public_client


def test_portal_recognizes_ktx_resident_with_legacy_stay_without_start_date(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules

    monkeypatch.setattr(rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 2, 16, 0, tzinfo=rules.VIETNAM_TZ
    ))
    portal, sessions = public_client
    with sessions.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LEGACY RESIDENT", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=None),
        ])
        employee_id = employee.id

    directory = portal.get("/api/meal-reporting/people?q=legacy")
    assert directory.status_code == 200
    assert directory.json()[0]["status"] == "KTX"
    assert directory.json()[0]["room_number"] == "1601"
    assert directory.json()[0]["can_report"] is True

    submitted = portal.post("/api/meal-reporting/reports", json={
        "employee_id": employee_id, "meal_date": "2026-11-03",
        "breakfast": True, "dinner": False,
    })
    assert submitted.status_code == 200, submitted.text
