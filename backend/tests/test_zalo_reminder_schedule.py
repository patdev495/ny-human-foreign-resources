from __future__ import annotations

import datetime as dt
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base, get_db


@pytest.fixture
def schedule_app(monkeypatch: pytest.MonkeyPatch) -> Generator[tuple[TestClient, list[dt.datetime], list[str], dict[str, object]], None, None]:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from features.zalo_reminder import scheduler
    from main import create_app

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    clock = [dt.datetime(2026, 11, 1, 16, 29, tzinfo=dt.timezone(dt.timedelta(hours=7)))]
    sent: list[str] = []
    bot_state: dict[str, object] = {"connected": True, "uncertain_ids": set()}
    monkeypatch.setattr(scheduler, "now_vietnam", lambda: clock[0])

    class FakeBot:
        def status(self) -> dict[str, bool]:
            return {"connected": bot_state["connected"] is True, "qr_available": False}

        def friends(self) -> list[dict[str, str]]:
            return [{"id": "hr-1", "name": "HR Lan"}, {"id": "hr-2", "name": "HR Minh"}]

        def send(self, id: str, message: str) -> None:
            from features.zalo_reminder.client import BotUnavailable

            assert "https://ns.nienyi.vn" in message
            uncertain = bot_state["uncertain_ids"]
            if isinstance(uncertain, set) and id in uncertain:
                raise BotUnavailable("No confirmation")
            sent.append(id)

    def database() -> Generator[Session, None, None]:
        with factory() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = database
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused", is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FakeBot()
    with TestClient(app) as client:
        yield client, clock, sent, bot_state
    engine.dispose()


def test_sunday_cutoff_sends_once_per_hr_and_test_send_stays_separate(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, _state = schedule_app
    assert client.put("/api/zalo-reminder/cutoff", json={"time": "16:30"}).status_code == 200
    assert client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1", "hr-2"]}).status_code == 200
    assert client.post("/api/zalo-reminder/run-due").json() == {"date": "2026-11-01", "due": False}
    clock[0] = dt.datetime(2026, 11, 1, 16, 30, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    assert client.post("/api/zalo-reminder/run-due").status_code == 200
    assert client.post("/api/zalo-reminder/run-due").status_code == 200
    assert sent == ["hr-1", "hr-2"]
    assert client.post("/api/zalo-reminder/test-send", json={"id": "hr-1"}).status_code == 200
    assert sent == ["hr-1", "hr-2", "hr-1"]
    daily = client.get("/api/zalo-reminder/daily?date=2026-11-01").json()
    assert [(row["id"], row["status"]) for row in daily] == [("hr-1", "SENT"), ("hr-2", "SENT")]


def test_unavailable_bot_retries_before_deadline_and_never_sends_after_it(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, state = schedule_app
    assert client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1", "hr-2"]}).status_code == 200
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    state["connected"] = False
    client.post("/api/zalo-reminder/run-due")
    assert [row["status"] for row in client.get("/api/zalo-reminder/daily?date=2026-11-01").json()] == ["FAILED", "FAILED"]
    state["connected"] = True
    clock[0] = dt.datetime(2026, 11, 1, 17, 29, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/zalo-reminder/run-due")
    assert sent == ["hr-1", "hr-2"]
    clock[0] = dt.datetime(2026, 11, 2, 17, 30, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    state["connected"] = False
    client.post("/api/zalo-reminder/run-due")
    assert sent == ["hr-1", "hr-2"]
    assert [row["status"] for row in client.get("/api/zalo-reminder/daily?date=2026-11-02").json()] == ["MISSED", "MISSED"]


def test_uncertain_send_is_not_repeated_and_other_hr_still_receives(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, state = schedule_app
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1", "hr-2"]})
    state["uncertain_ids"] = {"hr-1"}
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/zalo-reminder/run-due")
    state["uncertain_ids"] = set()
    client.post("/api/zalo-reminder/run-due")
    assert sent == ["hr-2"]
    assert [(row["id"], row["status"]) for row in client.get(
        "/api/zalo-reminder/daily?date=2026-11-01").json()] == [("hr-1", "UNKNOWN"), ("hr-2", "SENT")]


def test_restarted_hr_process_sends_pending_holiday_reminder_once(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    from main import create_app

    client, clock, sent, state = schedule_app
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]})
    clock[0] = dt.datetime(2027, 1, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    state["connected"] = False
    client.post("/api/zalo-reminder/run-due")
    restarted = create_app()
    original = client.app
    assert isinstance(original, FastAPI)
    restarted.dependency_overrides.update(original.dependency_overrides)
    state["connected"] = True
    clock[0] = dt.datetime(2027, 1, 1, 17, 20, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    with TestClient(restarted) as after_restart:
        after_restart.post("/api/zalo-reminder/run-due")
        after_restart.post("/api/zalo-reminder/run-due")
        results = after_restart.get("/api/zalo-reminder/daily?date=2027-01-01").json()
    assert sent == ["hr-1"]
    assert [(row["id"], row["status"]) for row in results] == [("hr-1", "SENT")]


def test_restart_next_morning_marks_yesterday_missed_without_sending_old_message(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, _state = schedule_app
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]})
    clock[0] = dt.datetime(2027, 1, 2, 8, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/zalo-reminder/run-due")
    assert sent == []
    assert [(row["id"], row["status"]) for row in client.get(
        "/api/zalo-reminder/daily?date=2027-01-01").json()] == [("hr-1", "MISSED")]
