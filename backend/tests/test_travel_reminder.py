from __future__ import annotations

import datetime as dt
from typing import cast
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.dialects.mssql import dialect
from sqlalchemy.orm import Session

from core.notifications import NotificationTarget
from core.system_settings import SystemSetting
from features.bot_reminder import travel
from features.bot_reminder.config import VIETNAM_TZ
from features.bot_reminder.models import TravelReminderDelivery
from features.bot_reminder.schemas import TravelReminderConfig
from features.hr_foreign.models import ForeignEmployee, TravelRecord
from features.hr_foreign.services.travel_reminder import reminder_message


def test_message_includes_boundary_dates_and_stops_completed_events() -> None:
    today = dt.date(2026, 11, 12)
    employee = ForeignEmployee(id=1, name_latin="Lan", employee_code="NY01")
    rows = [
        (TravelRecord(id=1, expected_entry_date=today), employee),
        (TravelRecord(id=2, expected_entry_date=today + dt.timedelta(days=3)), employee),
        (TravelRecord(id=3, expected_entry_date=today + dt.timedelta(days=4)), employee),
        (TravelRecord(id=4, expected_entry_date=today - dt.timedelta(days=1)), employee),
        (TravelRecord(id=5, expected_entry_date=today, entry_date=today), employee),
        (TravelRecord(id=6, expected_exit_date=today, actual_exit_date=today), employee),
        (TravelRecord(id=7, entry_date=today, expected_exit_date=today + dt.timedelta(days=2)), employee),
    ]
    db = Mock(spec=Session)
    db.execute.return_value.all.return_value = rows
    message = reminder_message(cast(Session, db), today, 3)
    assert message is not None
    assert "Lan (NY01)" in message
    assert "hôm nay" in message and "còn 3 ngày" in message
    assert "Rời Việt Nam" in message
    for included in (1, 2, 7):
        assert f"đợt #{included}" in message
    for excluded in (3, 4, 5, 6):
        assert f"đợt #{excluded}" not in message
    query = db.execute.call_args.args[0]
    sql = str(query.compile(dialect=dialect(), compile_kwargs={"literal_binds": True}))
    assert "actual_exit_date IS NULL" in sql
    assert "employee_type = N'FOREIGN'" in sql
    assert "status = N'WORKING'" in sql


def test_no_events_produces_no_message() -> None:
    db = Mock(spec=Session)
    db.execute.return_value.all.return_value = []
    assert reminder_message(cast(Session, db), dt.date(2026, 11, 12), 3) is None


@pytest.mark.parametrize("values", [
    {"days_before": -1}, {"days_before": 366}, {"days_before": 1.5},
    {"time": "24:00"}, {"time": "8:00"},
])
def test_invalid_settings_are_rejected(values: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        TravelReminderConfig.model_validate(values)


def test_schedule_channels_once_per_day_and_restart(monkeypatch: pytest.MonkeyPatch) -> None:
    config = TravelReminderConfig()
    monkeypatch.setattr(travel, "get_config", lambda db: config)
    monkeypatch.setattr(travel, "channel_enabled", lambda db, channel, day: channel == "telegram")
    ledger: dict[tuple[str, dt.date, str], TravelReminderDelivery] = {}
    db = Mock(spec=Session)
    db.get.side_effect = lambda model, key: ledger.get(key)

    def add(row: TravelReminderDelivery) -> None:
        ledger[(row.channel, row.delivery_date, row.recipient_id)] = row

    db.add.side_effect = add
    sent: list[str] = []
    target = NotificationTarget("telegram", "hr", "HR", sent.append)
    telegram = Mock(return_value=[target])
    zalo = Mock(return_value=[])
    message = Mock(return_value="Nhắc lịch")
    providers = {"telegram": telegram, "zalo": zalo}
    before = dt.datetime(2026, 11, 12, 7, 59, tzinfo=VIETNAM_TZ)
    assert travel.run_due(cast(Session, db), before, message, providers) is False
    assert travel.run_due(cast(Session, db), before + dt.timedelta(minutes=1), message, providers)
    assert travel.run_due(cast(Session, db), before + dt.timedelta(hours=5), message, providers)
    assert sent == ["Nhắc lịch"]
    zalo.assert_not_called()
    assert next(iter(ledger.values())).status == "SENT"
    # A new process/session still reads the same persisted daily ledger.
    restarted_db = Mock(spec=Session)
    restarted_db.get.side_effect = lambda model, key: ledger.get(key)
    travel.run_due(cast(Session, restarted_db), before + dt.timedelta(hours=6), message, providers)
    assert sent == ["Nhắc lịch"]
    travel.run_due(cast(Session, db), before + dt.timedelta(days=1, minutes=1), message, providers)
    assert sent == ["Nhắc lịch", "Nhắc lịch"]
    config.enabled = False
    assert travel.run_due(cast(Session, db), before + dt.timedelta(days=2), message, providers) is False


def test_unknown_send_is_not_retried_and_empty_digest_is_skipped(monkeypatch: pytest.MonkeyPatch) -> None:
    db = Mock(spec=Session)
    db.get.return_value = None
    send = Mock(side_effect=TimeoutError())
    target = NotificationTarget("telegram", "hr", "HR", send)
    travel._deliver(cast(Session, db), dt.date(2026, 11, 12), target, "content")
    row = db.add.call_args.args[0]
    assert row.status == "UNKNOWN"
    db.get.return_value = row
    travel._deliver(cast(Session, db), dt.date(2026, 11, 12), target, "content")
    assert send.call_count == 1
    monkeypatch.setattr(travel, "get_config", lambda db: TravelReminderConfig())
    monkeypatch.setattr(travel, "channel_enabled", lambda db, channel, day: True)
    provider = Mock()
    assert travel.run_due(cast(Session, db), dt.datetime(2026, 11, 12, 10, tzinfo=VIETNAM_TZ),
                          lambda db, day, days: None, {"telegram": provider}) is False
    provider.assert_not_called()


def test_config_is_persisted_and_fits_system_setting_column() -> None:
    db = Mock(spec=Session)
    db.get.return_value = None
    assert travel.get_config(cast(Session, db)) == TravelReminderConfig()
    config = TravelReminderConfig(enabled=False, days_before=10, time="09:30")
    travel.save_config(cast(Session, db), config)
    row = db.add.call_args.args[0]
    assert isinstance(row, SystemSetting) and len(row.value) <= 100
    db.get.return_value = row
    assert travel.get_config(cast(Session, db)) == config


@pytest.mark.auth_real
def test_settings_endpoints_require_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from main import create_app

    app = create_app()
    with TestClient(app) as client:
        assert client.get("/api/bot-reminder/travel").status_code == 401
        assert client.put("/api/bot-reminder/travel", json={}).status_code == 401
        app.dependency_overrides[require_user] = lambda: User(
            id=1, username="hr", display_name="HR", is_admin=False, is_active=True,
        )
        assert client.get("/api/bot-reminder/travel").status_code == 403
        assert client.put("/api/bot-reminder/travel", json={}).status_code == 403
