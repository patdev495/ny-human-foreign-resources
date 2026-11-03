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
    assert client.get("/api/bot-reminder/cutoff").json() == {"time": "17:00"}
    assert client.get("/api/zalo-reminder/enabled").json()["enabled"] is False
    assert client.put("/api/zalo-reminder/enabled", json={"enabled": True}).status_code == 200
    assert client.put("/api/zalo-reminder/cutoff", json={"time": "16:30"}).status_code == 200
    assert client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1", "hr-2"]}).status_code == 200
    assert client.post("/api/zalo-reminder/run-due").json() == {"date": "2026-11-01", "due": False}
    clock[0] = dt.datetime(2026, 11, 1, 16, 30, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    assert client.post("/api/zalo-reminder/run-due").status_code == 200
    assert client.post("/api/zalo-reminder/run-due").status_code == 200
    assert sent == ["hr-1", "hr-2"]
    assert client.post("/api/zalo-reminder/test-send", json={"id": "hr-1"}).status_code == 200
    assert sent == ["hr-1", "hr-2", "hr-1", "hr-1"]
    daily = client.get("/api/zalo-reminder/daily?date=2026-11-01").json()
    assert [(row["id"], row["status"]) for row in daily] == [("hr-1", "SENT"), ("hr-2", "SENT")]


def test_zalo_test_send_still_sends_cutoff_when_pre_reminder_fails(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    from features.zalo_reminder.client import BotUnavailable, get_bot_client

    client, _clock, _sent, _state = schedule_app
    assert client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]}).status_code == 200
    attempts: list[str] = []

    class FirstSendFails:
        def send(self, id: str, message: str) -> None:
            attempts.append(message)
            if len(attempts) == 1:
                raise BotUnavailable("First message failed")

    client.app.dependency_overrides[get_bot_client] = lambda: FirstSendFails()
    response = client.post("/api/zalo-reminder/test-send", json={"id": "hr-1"})
    assert response.status_code == 200
    assert [(row["message_type"], row["status"]) for row in response.json()["results"]] == [
        ("PRE", "FAILED"), ("CUTOFF", "SENT"),
    ]
    assert len(attempts) == 2
    assert "Nhắc HR trước giờ chốt" in attempts[0]
    assert "Đã đến giờ chốt báo cơm" in attempts[1]
    assert {(row["message_type"], row["status"]) for row in client.get("/api/zalo-reminder/deliveries").json()} == {
        ("PRE", "FAILED"), ("CUTOFF", "SENT"),
    }


def test_unavailable_bot_retries_before_deadline_and_never_sends_after_it(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, state = schedule_app
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
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
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
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
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
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
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]})
    clock[0] = dt.datetime(2027, 1, 2, 8, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/zalo-reminder/run-due")
    assert sent == []
    assert [(row["id"], row["status"]) for row in client.get(
        "/api/zalo-reminder/daily?date=2027-01-01").json()] == [("hr-1", "MISSED")]


def test_telegram_connection_requires_valid_token_and_never_reads_it_back(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, _clock, _sent, _state = schedule_app
    response = client.post("/api/telegram-reminder/bot", json={"token": "bad-token"})
    assert response.status_code == 422
    assert client.get("/api/telegram-reminder/bot").json()["connected"] is False


def test_telegram_start_selection_test_send_and_bot_replacement(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    from features.telegram_reminder.client import get_telegram_client

    client, _clock, _sent, _state = schedule_app
    messages: list[tuple[str, str]] = []
    secrets_seen: list[str] = []
    fail_send = [False]

    class FakeTelegram:
        def verify(self, token: str) -> dict[str, str]:
            if token.endswith("invalid"):
                from features.telegram_reminder.client import TelegramUnavailable
                raise TelegramUnavailable("Token invalid")
            return {"id": "2" if token.endswith("second") else "1", "name": "HR Bot", "username": "hr_bot"}

        def set_webhook(self, token: str, url: str, secret: str) -> None:
            secrets_seen.append(secret)

        def send(self, token: str, chat_id: str, message: str) -> None:
            if fail_send[0]:
                from features.telegram_reminder.client import TelegramUnavailable
                raise TelegramUnavailable("No confirmation")
            messages.append((chat_id, message))

    client.app.dependency_overrides[get_telegram_client] = lambda: FakeTelegram()
    first = client.post("/api/telegram-reminder/bot", json={"token": "12345678:firstbot"})
    assert first.status_code == 200
    assert "token" not in first.json()
    assert "token" not in client.get("/api/telegram-reminder/bot").json()
    assert client.post("/api/telegram-reminder/bot/check").json()["connected"] is True
    start = {"message": {"text": "/start", "chat": {"id": 70, "type": "private"},
                         "from": {"id": 70, "first_name": "Lan", "username": "lan_hr"}}}
    assert client.post("/api/telegram-reminder/webhook", json=start,
                       headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"}).status_code == 403
    assert client.post("/api/telegram-reminder/webhook", json=start,
                       headers={"X-Telegram-Bot-Api-Secret-Token": secrets_seen[-1]}).status_code == 200
    assert "chờ admin" in messages[-1][1]
    assert client.get("/api/telegram-reminder/recipients").json()[0]["selected"] is False
    assert client.post("/api/telegram-reminder/test-send", json={"id": "70"}).status_code == 404
    assert client.put("/api/telegram-reminder/recipients", json={"ids": ["71"]}).status_code == 422
    assert client.put("/api/telegram-reminder/recipients", json={"ids": ["70"]}).status_code == 200
    assert client.post("/api/telegram-reminder/test-send", json={"id": "70"}).status_code == 200
    assert {row["message_type"] for row in client.get("/api/telegram-reminder/deliveries").json()} == {"PRE", "CUTOFF"}
    fail_send[0] = True
    failed = client.post("/api/telegram-reminder/test-send", json={"id": "70"})
    assert failed.json()["status"] == "FAILED"
    assert [(row["message_type"], row["status"]) for row in failed.json()["results"]] == [
        ("PRE", "FAILED"), ("CUTOFF", "FAILED"),
    ]
    assert client.get("/api/telegram-reminder/deliveries").json()[0]["status"] == "FAILED"
    fail_send[0] = False
    assert client.post("/api/telegram-reminder/bot", json={"token": "12345678:samebot2"}).status_code == 200
    assert client.get("/api/telegram-reminder/recipients").json()[0]["selected"] is True
    assert client.post("/api/telegram-reminder/bot", json={"token": "12345678:badinvalid"}).status_code == 422
    assert client.get("/api/telegram-reminder/recipients").json()[0]["selected"] is True
    assert client.post("/api/telegram-reminder/bot", json={"token": "12345678:newsecond"}).status_code == 200
    assert client.get("/api/telegram-reminder/recipients").json() == []
    assert len(client.get("/api/telegram-reminder/deliveries").json()) == 4


def test_telegram_and_zalo_send_independently_at_shared_cutoff(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.telegram_reminder import router as telegram_router, scheduler as telegram_scheduler
    from features.telegram_reminder.client import get_telegram_client

    client, clock, zalo_sent, _state = schedule_app
    telegram_sent: list[tuple[str, str]] = []
    secrets_seen: list[str] = []
    monkeypatch.setattr(telegram_scheduler, "now_vietnam", lambda: clock[0])
    monkeypatch.setattr(telegram_router, "now_vietnam", lambda: clock[0])

    class FakeTelegram:
        def verify(self, token: str) -> dict[str, str]:
            return {"id": "1", "name": "HR Bot", "username": "hr_bot"}

        def set_webhook(self, token: str, url: str, secret: str) -> None:
            secrets_seen.append(secret)

        def send(self, token: str, chat_id: str, message: str) -> None:
            telegram_sent.append((chat_id, message))

    client.app.dependency_overrides[get_telegram_client] = lambda: FakeTelegram()
    client.post("/api/telegram-reminder/bot", json={"token": "12345678:firstbot"})
    client.post("/api/telegram-reminder/webhook", headers={"X-Telegram-Bot-Api-Secret-Token": secrets_seen[-1]},
                json={"message": {"text": "/start", "chat": {"id": 70, "type": "private"},
                                  "from": {"id": 70, "first_name": "Lan"}}})
    telegram_sent.clear()
    client.put("/api/telegram-reminder/recipients", json={"ids": ["70"]})
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]})
    client.put("/api/telegram-reminder/enabled", json={"enabled": True})
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/telegram-reminder/run-due")
    client.post("/api/zalo-reminder/run-due")
    client.post("/api/telegram-reminder/run-due")
    assert zalo_sent == ["hr-1"]
    assert telegram_sent == [("70", "Đã đến giờ chốt báo cơm cho ngày mai và sắp xếp xe tan làm hôm nay. Vui lòng truy cập https://ns.nienyi.vn để thực hiện.")]
    assert client.get("/api/telegram-reminder/daily?date=2026-11-01").json()[0]["status"] == "SENT"
    from main import create_app
    restarted = create_app()
    restarted.dependency_overrides.update(client.app.dependency_overrides)
    with TestClient(restarted) as after_restart:
        after_restart.post("/api/telegram-reminder/run-due")
        assert after_restart.get("/api/telegram-reminder/daily?date=2026-11-01").json()[0]["status"] == "SENT"
        assert after_restart.get("/api/telegram-reminder/recipients").json()[0]["selected"] is True
    assert len(telegram_sent) == 1
    assert client.put("/api/telegram-reminder/enabled", json={"enabled": False}).json()["effective_date"] == "2026-11-02"
    clock[0] = dt.datetime(2026, 11, 2, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/telegram-reminder/run-due")
    client.post("/api/zalo-reminder/run-due")
    assert zalo_sent == ["hr-1", "hr-1"]
    assert len(telegram_sent) == 1
    assert client.get("/api/telegram-reminder/recipients").json()[0]["selected"] is True


def test_zalo_switch_after_cutoff_keeps_today_and_applies_tomorrow(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
) -> None:
    client, clock, sent, _state = schedule_app
    client.put("/api/zalo-reminder/recipients", json={"ids": ["hr-1"]})
    client.put("/api/zalo-reminder/enabled", json={"enabled": True})
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    changed = client.put("/api/zalo-reminder/enabled", json={"enabled": False})
    assert changed.json()["effective_date"] == "2026-11-02"
    assert client.get("/api/zalo-reminder/enabled").json()["enabled"] is True
    assert client.get("/api/zalo-reminder/enabled").json()["pending_enabled"] is False
    client.post("/api/zalo-reminder/run-due")
    assert sent == ["hr-1"]
    clock[0] = dt.datetime(2026, 11, 2, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/zalo-reminder/run-due")
    assert sent == ["hr-1"]
    assert client.get("/api/zalo-reminder/daily?date=2026-11-02").json() == []
    assert client.get("/api/zalo-reminder/recipients").json() == [{"id": "hr-1", "name": "HR Lan"}]
    assert client.post("/api/zalo-reminder/test-send", json={"id": "hr-1"}).status_code == 200
    assert sent == ["hr-1", "hr-1", "hr-1"]


def test_telegram_definite_failure_retries_until_thirty_minute_boundary(
    schedule_app: tuple[TestClient, list[dt.datetime], list[str], dict[str, object]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from features.telegram_reminder import router as telegram_router, scheduler as telegram_scheduler
    from features.telegram_reminder.client import TelegramRejected, TelegramUnavailable, get_telegram_client

    client, clock, _sent, _state = schedule_app
    secret = [""]
    sending = ["reject"]
    sent: list[str] = []
    monkeypatch.setattr(telegram_scheduler, "now_vietnam", lambda: clock[0])
    monkeypatch.setattr(telegram_router, "now_vietnam", lambda: clock[0])

    class FakeTelegram:
        def verify(self, token: str) -> dict[str, str]:
            return {"id": "1", "name": "Bot", "username": "hr_bot"}

        def set_webhook(self, token: str, url: str, value: str) -> None:
            secret[0] = value

        def send(self, token: str, chat_id: str, message: str) -> None:
            if sending[0] == "reject":
                raise TelegramRejected("Rejected")
            if sending[0] == "unknown":
                raise TelegramUnavailable("No confirmation")
            sent.append(chat_id)

    client.app.dependency_overrides[get_telegram_client] = lambda: FakeTelegram()
    client.post("/api/telegram-reminder/bot", json={"token": "12345678:firstbot"})
    client.post("/api/telegram-reminder/webhook", headers={"X-Telegram-Bot-Api-Secret-Token": secret[0]},
                json={"message": {"text": "/start", "chat": {"id": 70, "type": "private"},
                                  "from": {"id": 70, "first_name": "Lan"}}})
    client.put("/api/telegram-reminder/recipients", json={"ids": ["70"]})
    client.put("/api/telegram-reminder/enabled", json={"enabled": True})
    clock[0] = dt.datetime(2026, 11, 1, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/telegram-reminder/run-due")
    assert client.get("/api/telegram-reminder/daily?date=2026-11-01").json()[0]["status"] == "FAILED"
    clock[0] = dt.datetime(2026, 11, 1, 17, 29, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    sending[0] = "succeed"
    client.post("/api/telegram-reminder/run-due")
    assert sent == ["70"]
    clock[0] = dt.datetime(2026, 11, 2, 17, 30, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    client.post("/api/telegram-reminder/run-due")
    assert sent == ["70"]
    assert client.get("/api/telegram-reminder/daily?date=2026-11-02").json()[0]["status"] == "MISSED"
    clock[0] = dt.datetime(2026, 11, 3, 17, 0, tzinfo=dt.timezone(dt.timedelta(hours=7)))
    sending[0] = "unknown"
    client.post("/api/telegram-reminder/run-due")
    sending[0] = "succeed"
    client.post("/api/telegram-reminder/run-due")
    assert sent == ["70"]
    assert client.get("/api/telegram-reminder/daily?date=2026-11-03").json()[0]["status"] == "UNKNOWN"
