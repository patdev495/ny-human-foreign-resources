from __future__ import annotations

import datetime as dt
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base, get_db
from features.hr_foreign.models import ForeignEmployee, Room, Stay, TravelRecord


@pytest.fixture
def clients(monkeypatch: pytest.MonkeyPatch) -> Generator[tuple[TestClient, TestClient, sessionmaker[Session]], None, None]:
    monkeypatch.setenv("TESTING", "1")
    from features.hr_foreign.meal_reporting.main import create_app as create_public_app
    from main import create_app as create_hr_app

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override_db() -> Generator[Session, None, None]:
        with factory() as session:
            yield session

    public_app = create_public_app()
    hr_app = create_hr_app()
    public_app.dependency_overrides[get_db] = override_db
    hr_app.dependency_overrides[get_db] = override_db
    with TestClient(public_app, raise_server_exceptions=False) as public, TestClient(hr_app, raise_server_exceptions=False) as hr:
        yield public, hr, factory
    engine.dispose()


def test_end_shift_dates_include_sunday_and_close_at_1700(
    clients: tuple[TestClient, TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules as meal_rules

    public, _, _ = clients
    tz = dt.timezone(dt.timedelta(hours=7))
    clock = [dt.datetime(2026, 11, 1, 16, 59, tzinfo=tz)]
    monkeypatch.setattr(meal_rules, "now_vietnam", lambda: clock[0])

    dates = public.get("/api/end-shift-reporting/dates")
    assert dates.status_code == 200, dates.text
    assert dates.json()[0] == {"date": "2026-11-01", "can_submit": True}
    assert dates.json()[-1] == {"date": "2026-11-08", "can_submit": True}

    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=tz)
    assert public.get("/api/end-shift-reporting/dates").json()[0]["can_submit"] is False


def test_resident_can_submit_and_read_end_shift_report(
    clients: tuple[TestClient, TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules as meal_rules

    monkeypatch.setattr(meal_rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 2, 16, 59, tzinfo=dt.timezone(dt.timedelta(hours=7)),
    ))
    public, _, factory = clients
    with factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)),
        ])
        employee_id = employee.id

    path = f"/api/end-shift-reporting/people/{employee_id}/reports/2026-11-02"
    assert public.get(path).json()["current"] is None
    response = public.post("/api/end-shift-reporting/reports", json={
        "employee_id": employee_id, "report_date": "2026-11-02", "shift_choice": "17:30", "pickup_location": "CN09",
    })
    assert response.status_code == 200, response.text
    assert response.json()["current"] == {"shift_choice": "17:30", "pickup_location": "CN09", "destination": "KTX"}
    assert public.get(path).json()["current"] == response.json()["current"]


def test_end_shift_update_to_self_travel_and_deadline(
    clients: tuple[TestClient, TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules as meal_rules

    tz = dt.timezone(dt.timedelta(hours=7))
    clock = [dt.datetime(2026, 11, 1, 16, 59, tzinfo=tz)]
    monkeypatch.setattr(meal_rules, "now_vietnam", lambda: clock[0])
    public, _, factory = clients
    with factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)),
        ])
        employee_id = employee.id

    payload: dict[str, str | int | None] = {
        "employee_id": employee_id, "report_date": "2026-11-01", "shift_choice": "20:00", "pickup_location": "CN15",
    }
    endpoint = "/api/end-shift-reporting/reports"
    assert public.post(endpoint, json=payload).status_code == 200
    payload.update({"shift_choice": "SELF_TRAVEL", "pickup_location": None})
    revised = public.post(endpoint, json=payload)
    assert revised.status_code == 200, revised.text
    assert revised.json()["current"] == {"shift_choice": "SELF_TRAVEL", "pickup_location": None, "destination": "KTX"}
    assert public.post(endpoint, json={**payload, "shift_choice": "17:30"}).status_code == 422
    assert public.post(endpoint, json={**payload, "pickup_location": "CN09"}).status_code == 422
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=tz)
    assert public.post(endpoint, json=payload).status_code == 422
    assert public.get(f"/api/end-shift-reporting/people/{employee_id}/reports/2026-11-01").json()["current"]["shift_choice"] == "SELF_TRAVEL"


def test_hr_sees_six_end_shift_groups_including_unreported(
    clients: tuple[TestClient, TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules as meal_rules

    monkeypatch.setattr(meal_rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 1, 16, 30, tzinfo=dt.timezone(dt.timedelta(hours=7)),
    ))
    public, hr, factory = clients
    with factory.begin() as db:
        room = Room(room_number="1601")
        db.add(room)
        db.flush()
        ids: dict[str, int] = {}
        for name in ("LIN WEI", "LI MING", "ZHANG SAN", "HOTEL GUEST"):
            employee = ForeignEmployee(name_latin=name, gender="Nam")
            db.add(employee)
            db.flush()
            ids[name] = employee.id
            db.add(TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)))
            db.add(Stay(
                employee_id=employee.id, room_id=room.id if name != "HOTEL GUEST" else None,
                accommodation_type="HOTEL" if name == "HOTEL GUEST" else "KTX",
                start_date=dt.date(2026, 10, 1),
            ))

    endpoint = "/api/end-shift-reporting/reports"
    assert public.post(endpoint, json={"employee_id": ids["LIN WEI"], "report_date": "2026-11-01", "shift_choice": "17:30", "pickup_location": "CN09"}).status_code == 200
    assert public.post(endpoint, json={"employee_id": ids["LI MING"], "report_date": "2026-11-01", "shift_choice": "SELF_TRAVEL"}).status_code == 200

    result = hr.get("/api/hr-foreign/end-shift/demand?date=2026-11-01")
    assert result.status_code == 200, result.text
    groups = {group["key"]: group for group in result.json()["groups"]}
    assert set(groups) == {"CN09_1730", "CN09_2000", "CN15_1730", "CN15_2000", "SELF_TRAVEL", "NOT_REPORTED"}
    assert groups["CN09_1730"]["count"] == 1
    assert [person["name_latin"] for person in groups["CN09_1730"]["people"]] == ["LIN WEI"]
    assert [person["name_latin"] for person in groups["SELF_TRAVEL"]["people"]] == ["LI MING"]
    assert [person["name_latin"] for person in groups["NOT_REPORTED"]["people"]] == ["ZHANG SAN"]
    assert public.post(endpoint, json={"employee_id": ids["HOTEL GUEST"], "report_date": "2026-11-01", "shift_choice": "20:00", "pickup_location": "CN15"}).status_code == 403

    assert public.post(endpoint, json={"employee_id": ids["LIN WEI"], "report_date": "2026-11-01", "shift_choice": "20:00", "pickup_location": "CN15"}).status_code == 200
    revised = hr.get("/api/hr-foreign/end-shift/demand?date=2026-11-01").json()
    revised_groups = {group["key"]: group for group in revised["groups"]}
    assert revised_groups["CN09_1730"]["count"] == 0
    assert [person["name_latin"] for person in revised_groups["CN15_2000"]["people"]] == ["LIN WEI"]
