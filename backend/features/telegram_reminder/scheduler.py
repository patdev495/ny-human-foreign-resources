from __future__ import annotations

import datetime as dt
import logging
from typing import cast

from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import SessionLocal
from features.bot_reminder.config import VIETNAM_TZ, channel_enabled, cutoff_at, snapshot_channel
from features.telegram_reminder.client import TelegramClient, TelegramRejected, TelegramUnavailable
from features.telegram_reminder.models import TelegramBot, TelegramDailyDelivery, TelegramRecipient, selected_recipients_query
from features.bot_reminder.message import MESSAGE

logger = logging.getLogger(__name__)


def now_vietnam() -> dt.datetime:
    return dt.datetime.now(VIETNAM_TZ)


def daily_results(db: Session, day: dt.date) -> list[dict[str, str]]:
    rows = db.scalars(select(TelegramDailyDelivery).where(TelegramDailyDelivery.delivery_date == day)
                      .order_by(TelegramDailyDelivery.name, TelegramDailyDelivery.user_id)).all()
    return [{"id": row.user_id, "bot_id": row.bot_id, "name": row.name,
             "date": row.delivery_date.isoformat(), "status": row.status, "error": row.error,
             "updated_at": row.updated_at.isoformat() + "Z"} for row in rows]


def _result(db: Session, day: dt.date, bot: TelegramBot, person: TelegramRecipient,
            status: str, error: str = "") -> None:
    key = (day, bot.bot_id, person.user_id)
    row = db.get(TelegramDailyDelivery, key)
    if row is None:
        db.add(TelegramDailyDelivery(delivery_date=day, bot_id=bot.bot_id, user_id=person.user_id,
                                     chat_id=person.chat_id, name=person.name, status=status, error=error))
    else:
        row.status, row.error, row.updated_at = status, error, dt.datetime.utcnow()
    db.commit()


def _claim(db: Session, day: dt.date, bot: TelegramBot, person: TelegramRecipient) -> bool:
    key = (day, bot.bot_id, person.user_id)
    if db.get(TelegramDailyDelivery, key) is None:
        try:
            _result(db, day, bot, person, "SENDING")
            return True
        except IntegrityError:
            db.rollback()
    claimed = db.execute(update(TelegramDailyDelivery).where(
        TelegramDailyDelivery.delivery_date == day, TelegramDailyDelivery.bot_id == bot.bot_id,
        TelegramDailyDelivery.user_id == person.user_id, TelegramDailyDelivery.status == "FAILED",
    ).values(status="SENDING", error="", updated_at=dt.datetime.utcnow()))
    db.commit()
    return cast(CursorResult[tuple[()]], claimed).rowcount == 1


def _expire(db: Session, day: dt.date, bot: TelegramBot, person: TelegramRecipient) -> None:
    row = db.get(TelegramDailyDelivery, (day, bot.bot_id, person.user_id))
    if row is None or row.status == "FAILED":
        _result(db, day, bot, person, "MISSED", "Hết thời gian gửi bù")
    elif row.status == "SENDING":
        _result(db, day, bot, person, "UNKNOWN", "Kết quả gửi chưa rõ sau khi tiến trình gián đoạn")


def run_due(db: Session, client: TelegramClient) -> dict[str, str | bool]:
    now = now_vietnam()
    day = now.date()
    start = cutoff_at(db, day)
    result: dict[str, str | bool] = {"date": day.isoformat(), "due": now >= start}
    bot = db.get(TelegramBot, "current")
    if bot is None:
        return result
    yesterday = day - dt.timedelta(days=1)
    if channel_enabled(db, "telegram", yesterday):
        previous_cutoff = cutoff_at(db, yesterday).astimezone(dt.timezone.utc).replace(tzinfo=None)
        for person in db.scalars(selected_recipients_query().where(
            TelegramRecipient.selected_at <= previous_cutoff,
        )).all():
            try:
                _expire(db, yesterday, bot, person)
            except Exception:
                db.rollback()
                logger.exception("Could not expire Telegram reminder")
    if now < start or not snapshot_channel(db, "telegram", day):
        return result
    end = start + dt.timedelta(minutes=30)
    people = db.scalars(selected_recipients_query().order_by(TelegramRecipient.user_id)).all()
    for person in people:
        try:
            if now >= end:
                _expire(db, day, bot, person)
                continue
            row = db.get(TelegramDailyDelivery, (day, bot.bot_id, person.user_id))
            if row is not None and row.status == "SENDING":
                _result(db, day, bot, person, "UNKNOWN", "Kết quả gửi chưa rõ sau khi tiến trình gián đoạn")
                continue
            if row is not None and row.status in {"SENT", "UNKNOWN", "MISSED"}:
                continue
            if not _claim(db, day, bot, person):
                continue
            try:
                client.send(bot.token, person.chat_id, MESSAGE)
            except TelegramRejected:
                _result(db, day, bot, person, "FAILED", "Telegram từ chối tin nhắn")
            except TelegramUnavailable:
                _result(db, day, bot, person, "UNKNOWN", "Kết quả gửi chưa rõ; cần kiểm tra Telegram")
            else:
                _result(db, day, bot, person, "SENT")
        except Exception:
            db.rollback()
            logger.exception("Daily Telegram reminder failed for one recipient")
    return result


def tick() -> None:
    with SessionLocal() as db:
        run_due(db, TelegramClient())
