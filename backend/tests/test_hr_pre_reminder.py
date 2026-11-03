from __future__ import annotations

import datetime as dt
from typing import cast

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from core.database import Base
from features.bot_reminder.models import ChannelChange, PreReminderDelivery
from features.bot_reminder import pre_reminder
from features.hr_foreign.end_shift_reporting.models import EndShiftReport
from features.hr_foreign.meal_reporting.models import MealReport
from features.hr_foreign.models import ForeignEmployee, Room, Stay, TravelRecord
from features.telegram_reminder.client import TelegramClient, TelegramRejected
from features.telegram_reminder.models import TelegramBot, TelegramRecipient
from features.zalo_reminder.client import BotClient
from features.zalo_reminder.models import ZaloRecipient


def test_pre_reminder_sends_counts_once_and_retries_definite_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    day = dt.date(2026, 11, 3)
    timezone = dt.timezone(dt.timedelta(hours=7))
    sent: list[tuple[str, str]] = []
    rejected = [True]

    class Zalo:
        def status(self) -> dict[str, bool]:
            return {"connected": True}

        def send(self, recipient_id: str, message: str) -> None:
            sent.append((recipient_id, message))

    class Telegram:
        def send(self, token: str, chat_id: str, message: str) -> None:
            if rejected[0]:
                rejected[0] = False
                raise TelegramRejected("rejected")
            sent.append((chat_id, message))

    monkeypatch.setattr(pre_reminder, "pending_counts", lambda db, date: (3, 2))
    with Session(engine) as db:
        db.add_all([
            ChannelChange(channel="zalo", effective_date=day, enabled=True),
            ChannelChange(channel="telegram", effective_date=day, enabled=True),
            ZaloRecipient(zalo_id="zalo-hr", display_name="HR Zalo"),
            TelegramBot(key="current", bot_id="bot-1", name="Bot", username="bot", token="token", webhook_secret="secret"),
            TelegramRecipient(user_id="tg-hr", chat_id="chat-hr", name="HR Telegram", selected=True),
        ])
        db.commit()
        zalo = cast(BotClient, Zalo())
        telegram = cast(TelegramClient, Telegram())
        assert pre_reminder.run_due(db, dt.datetime(2026, 11, 3, 15, 59, tzinfo=timezone), zalo, telegram) is False
        assert pre_reminder.run_due(db, dt.datetime(2026, 11, 3, 16, 0, tzinfo=timezone), zalo, telegram) is True
        assert len(sent) == 1
        assert "04/11/2026: còn 3 người" in sent[0][1]
        assert "03/11/2026: còn 2 người" in sent[0][1]
        assert pre_reminder.run_due(db, dt.datetime(2026, 11, 3, 16, 1, tzinfo=timezone), zalo, telegram) is True
        assert [recipient for recipient, _ in sent] == ["zalo-hr", "chat-hr"]
        assert pre_reminder.run_due(db, dt.datetime(2026, 11, 3, 16, 2, tzinfo=timezone), zalo, telegram) is True
        assert len(sent) == 2
        assert pre_reminder.run_due(db, dt.datetime(2026, 11, 3, 16, 30, tzinfo=timezone), zalo, telegram) is False
        rows = db.scalars(select(PreReminderDelivery).order_by(PreReminderDelivery.channel)).all()
        assert [(row.channel, row.status) for row in rows] == [("telegram", "SENT"), ("zalo", "SENT")]
    engine.dispose()


def test_pending_counts_use_tomorrow_for_meals_and_today_for_shifts() -> None:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    today = dt.date(2026, 11, 3)
    tomorrow = today + dt.timedelta(days=1)
    with Session(engine) as db:
        room = Room(room_number="101")
        db.add(room)
        db.flush()
        for index in range(3):
            employee = ForeignEmployee(name_latin=f"Person {index}", gender="M", employee_type="FOREIGN")
            db.add(employee)
            db.flush()
            db.add(TravelRecord(employee_id=employee.id, entry_date=today))
            db.add(Stay(employee_id=employee.id, room_id=room.id, accommodation_type="KTX", start_date=today))
            if index == 0:
                db.add(MealReport(employee_id=employee.id, meal_date=tomorrow, breakfast=True, dinner=True))
            if index == 1:
                db.add(EndShiftReport(employee_id=employee.id, report_date=today,
                                      shift_choice="SELF_TRAVEL", destination="KTX"))
        db.commit()
        assert pre_reminder.pending_counts(db, today) == (2, 2)
        assert pre_reminder.pending_counts(db, dt.date(2026, 11, 7)) == (0, 3)
    engine.dispose()
