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
def public_client(monkeypatch: pytest.MonkeyPatch) -> Generator[tuple[TestClient, sessionmaker[Session]], None, None]:
    monkeypatch.setenv("TESTING", "1")
    from features.hr_foreign.meal_reporting.main import create_app

    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client, session_factory
    engine.dispose()


def test_public_directory_shows_only_identity_and_lodging_status(
    public_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = public_client
    today = dt.date.today()
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        db.add(room)
        db.flush()
        resident = ForeignEmployee(
            name_latin="LIN WEI", name_chinese="林伟", gender="Nam",
            employee_code="SECRET", passport_number="SECRET", phone="SECRET", salary=500,
        )
        hotel_guest = ForeignEmployee(name_latin="LI MING", gender="Nam")
        db.add_all([resident, hotel_guest])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=resident.id, entry_date=today - dt.timedelta(days=5)),
            TravelRecord(employee_id=hotel_guest.id, entry_date=today - dt.timedelta(days=5)),
            Stay(employee_id=resident.id, room_id=room.id, accommodation_type="KTX", start_date=today - dt.timedelta(days=5)),
            Stay(employee_id=hotel_guest.id, accommodation_type="HOTEL", start_date=today - dt.timedelta(days=5)),
        ])

    response = client.get("/api/meal-reporting/people?q=li")
    assert response.status_code == 200
    people = response.json()
    assert len(people) == 2
    resident_data = next(person for person in people if person["name_latin"] == "LIN WEI")
    assert resident_data["name_chinese"] == "林伟"
    assert resident_data["room_number"] == "1601"
    assert resident_data["can_report"] is True
    assert set(resident_data) == {"id", "name_latin", "name_chinese", "room_number", "status", "can_report"}
    assert next(person for person in people if person["name_latin"] == "LI MING")["can_report"] is False
    assert client.get(f"/api/meal-reporting/people/{hotel_guest.id}/reports/{today.isoformat()}").status_code == 403
    assert client.get("/api/hr-foreign/employees").status_code == 404
    assert client.get("/health").json() == {"status": "ok"}


def test_resident_can_submit_zero_meals_and_read_saved_report(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules

    monday = dt.datetime(2026, 11, 2, 16, 59, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    monkeypatch.setattr(rules, "now_vietnam", lambda: monday)
    client, session_factory = public_client
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add(TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)))
        db.add(Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)))
        employee_id = employee.id

    path = f"/api/meal-reporting/people/{employee_id}/reports/2026-11-03"
    assert client.get(path).json()["current"] is None
    response = client.post("/api/meal-reporting/reports", json={
        "employee_id": employee_id, "meal_date": "2026-11-03", "breakfast": False, "dinner": False,
    })
    assert response.status_code == 200, response.text
    assert response.json()["current"] == {"breakfast": False, "dinner": False}
    assert client.get(path).json()["current"] == {"breakfast": False, "dinner": False}


def test_amendment_keeps_history_for_hr_and_closes_at_deadline(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules
    from features.hr_foreign.meal_reporting.main import create_app as create_public_app
    from main import create_app as create_hr_app

    tz = dt.timezone(dt.timedelta(hours=7))
    clock = [dt.datetime(2026, 11, 2, 16, 59, tzinfo=tz)]
    monkeypatch.setattr(rules, "now_vietnam", lambda: clock[0])
    monkeypatch.setenv("TESTING", "1")
    client, session_factory = public_client
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)),
        ])
        employee_id = employee.id

    payload = {"employee_id": employee_id, "meal_date": "2026-11-03", "breakfast": False, "dinner": False}
    assert client.post("/api/meal-reporting/reports", json=payload).status_code == 200
    payload["breakfast"] = True
    assert client.post("/api/meal-reporting/reports", json=payload).status_code == 200

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    second_app = create_public_app()
    second_app.dependency_overrides[get_db] = override_get_db
    payload["dinner"] = True
    with TestClient(second_app) as second_client:
        assert second_client.post("/api/meal-reporting/reports", json=payload).status_code == 200

    hr_app = create_hr_app()
    hr_app.dependency_overrides[get_db] = override_get_db
    with TestClient(hr_app) as hr_client:
        history = hr_client.get(f"/api/hr-foreign/meals/reports/{employee_id}/2026-11-03")
    assert history.status_code == 200, history.text
    assert [(item["breakfast"], item["dinner"]) for item in history.json()["history"]] == [(False, False), (True, False), (True, True)]
    assert history.json()["current"] == {"breakfast": True, "dinner": True}

    clock[0] = dt.datetime(2026, 11, 2, 17, 0, tzinfo=tz)
    payload["dinner"] = False
    assert client.post("/api/meal-reporting/reports", json=payload).status_code == 422


def test_hr_forecast_uses_current_reports_and_distinguishes_missing(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules
    from main import create_app as create_hr_app

    monkeypatch.setattr(rules, "now_vietnam", lambda: dt.datetime(2026, 11, 2, 16, 0, tzinfo=dt.timezone(dt.timedelta(hours=7))))
    monkeypatch.setenv("TESTING", "1")
    client, session_factory = public_client
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        db.add(room)
        db.flush()
        ids: list[int] = []
        for name in ("LIN WEI", "LI MING", "ZHANG SAN"):
            employee = ForeignEmployee(name_latin=name, gender="Nam")
            db.add(employee)
            db.flush()
            ids.append(employee.id)
            db.add(TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)))
            db.add(Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)))

    for employee_id, breakfast, dinner in ((ids[0], True, False), (ids[1], False, False)):
        response = client.post("/api/meal-reporting/reports", json={
            "employee_id": employee_id, "meal_date": "2026-11-03", "breakfast": breakfast, "dinner": dinner,
        })
        assert response.status_code == 200, response.text

    hr_app = create_hr_app()

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    hr_app.dependency_overrides[get_db] = override_get_db
    with TestClient(hr_app) as hr_client:
        result = hr_client.get("/api/hr-foreign/meals/forecast?date=2026-11-03")
    assert result.status_code == 200, result.text
    forecast = result.json()
    assert forecast["breakfast"]["calculated_meal_count"] == 1
    assert forecast["dinner"]["calculated_meal_count"] == 0
    assert {item["name_latin"]: item["breakfast_report_status"] for item in forecast["employees"]} == {
        "LIN WEI": "EATING", "LI MING": "NOT_EATING", "ZHANG SAN": "NOT_REPORTED",
    }

    with session_factory.begin() as db:
        stay = db.query(Stay).filter(Stay.employee_id == ids[0]).one()
        stay.accommodation_type = "HOTEL"
        stay.room_id = None
    with TestClient(hr_app) as hr_client:
        changed = hr_client.get("/api/hr-foreign/meals/forecast?date=2026-11-03").json()
        history = hr_client.get(f"/api/hr-foreign/meals/reports/{ids[0]}/2026-11-03").json()
    assert changed["breakfast"]["calculated_meal_count"] == 0
    assert next(item for item in changed["employees"] if item["employee_id"] == ids[0])["breakfast_report_status"] == "INELIGIBLE"
    assert history["current"] == {"breakfast": True, "dinner": False}
    assert client.post("/api/meal-reporting/reports", json={
        "employee_id": ids[0], "meal_date": "2026-11-03", "breakfast": True, "dinner": True,
    }).status_code == 403

    with session_factory.begin() as db:
        db.query(Stay).filter(Stay.employee_id == ids[0]).one().end_date = dt.date(2026, 11, 2)
        db.query(TravelRecord).filter(TravelRecord.employee_id == ids[0]).one().actual_exit_date = dt.date(2026, 11, 2)
    with TestClient(hr_app) as hr_client:
        exited = hr_client.get("/api/hr-foreign/meals/forecast?date=2026-11-03").json()
    assert exited["breakfast"]["calculated_meal_count"] == 0
    assert next(item for item in exited["employees"] if item["employee_id"] == ids[0])["breakfast_report_status"] == "INELIGIBLE"


@pytest.mark.parametrize(
    ("hour", "minute", "can_submit"), [(16, 59, True), (17, 0, False), (17, 1, False)]
)
def test_dates_use_vietnam_cutoff(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
    hour: int, minute: int, can_submit: bool,
) -> None:
    from features.hr_foreign.meal_reporting import rules

    monkeypatch.setattr(rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 2, hour, minute, tzinfo=dt.timezone(dt.timedelta(hours=7))
    ))
    dates = public_client[0].get("/api/meal-reporting/dates").json()
    assert dates[0] == {"date": "2026-11-02", "can_submit": False}
    assert dates[1] == {"date": "2026-11-03", "can_submit": can_submit}
    assert dates[-1] == {"date": "2026-11-08", "can_submit": False}


def test_sunday_opens_next_week_but_never_accepts_sunday(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules

    monkeypatch.setattr(rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 1, 10, 0, tzinfo=dt.timezone(dt.timedelta(hours=7))
    ))
    dates = public_client[0].get("/api/meal-reporting/dates").json()
    assert dates[0] == {"date": "2026-11-01", "can_submit": False}
    assert dates[1] == {"date": "2026-11-02", "can_submit": True}
    assert dates[-1] == {"date": "2026-11-08", "can_submit": False}


def test_failed_database_commit_never_confirms_report(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules

    monkeypatch.setattr(rules, "now_vietnam", lambda: dt.datetime(
        2026, 11, 2, 16, 0, tzinfo=dt.timezone(dt.timedelta(hours=7))
    ))
    client, session_factory = public_client
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)),
        ])
        employee_id = employee.id

    def fail_commit(_session: Session) -> None:
        raise RuntimeError("Database unavailable")

    with monkeypatch.context() as patch:
        patch.setattr(Session, "commit", fail_commit)
        response = client.post("/api/meal-reporting/reports", json={
            "employee_id": employee_id, "meal_date": "2026-11-03", "breakfast": True, "dinner": False,
        })
    assert response.status_code == 500
    assert client.get(f"/api/meal-reporting/people/{employee_id}/reports/2026-11-03").json()["current"] is None


def test_hr_lock_opens_at_17h_and_relock_preserves_history(
    public_client: tuple[TestClient, sessionmaker[Session]], monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.hr_foreign.meal_reporting import rules
    from main import create_app as create_hr_app

    vietnam_tz = dt.timezone(dt.timedelta(hours=7))
    clock = [dt.datetime(2026, 11, 2, 16, 59, tzinfo=vietnam_tz)]
    monkeypatch.setattr(rules, "now_vietnam", lambda: clock[0])
    portal, session_factory = public_client
    with session_factory.begin() as db:
        room = Room(room_number="1601")
        employee = ForeignEmployee(name_latin="LIN WEI", gender="Nam")
        db.add_all([room, employee])
        db.flush()
        db.add_all([
            TravelRecord(employee_id=employee.id, entry_date=dt.date(2026, 10, 1)),
            Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=dt.date(2026, 10, 1)),
        ])
        employee_id = employee.id

    assert portal.post("/api/meal-reporting/reports", json={
        "employee_id": employee_id, "meal_date": "2026-11-03", "breakfast": True, "dinner": False,
    }).status_code == 200

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    hr_app = create_hr_app()
    hr_app.dependency_overrides[get_db] = override_get_db
    payload = {
        "lock_date": "2026-11-03", "meal_session": "BREAKFAST",
        "calculated_meal_count": 1, "final_meal_count": 1,
        "locked_price_per_meal": 30000,
    }
    with TestClient(hr_app) as hr:
        assert hr.post("/api/hr-foreign/meals/lock", json=payload).status_code == 422
        clock[0] = dt.datetime(2026, 11, 2, 17, 0, tzinfo=vietnam_tz)
        assert hr.post("/api/hr-foreign/meals/lock", json=payload).status_code == 201
        clock[0] = dt.datetime(2026, 11, 2, 17, 1, tzinfo=vietnam_tz)
        assert hr.post("/api/hr-foreign/meals/lock", json={**payload, "final_meal_count": 2}).status_code == 422
        assert hr.post("/api/hr-foreign/meals/lock", json={**payload, "final_meal_count": 0, "notes": "  "}).status_code == 422
        assert hr.post("/api/hr-foreign/meals/lock", json={**payload, "notes": "  "}).status_code == 422
        changed = hr.post("/api/hr-foreign/meals/lock", json={**payload, "final_meal_count": 2, "notes": "Khách ăn thêm"})
        assert changed.status_code == 201, changed.text
        forecast = hr.get("/api/hr-foreign/meals/forecast?date=2026-11-03").json()
        history = hr.get("/api/hr-foreign/meals/locks/2026-11-03/BREAKFAST/history")

    assert forecast["breakfast"]["final_meal_count"] == 2
    assert forecast["lunch"]["is_locked"] is False
    assert history.status_code == 200, history.text
    assert [item["final_meal_count"] for item in history.json()] == [1, 2]
    assert history.json()[0]["locked_at"] != history.json()[1]["locked_at"]
