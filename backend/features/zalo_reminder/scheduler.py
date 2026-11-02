from __future__ import annotations

import asyncio
import datetime as dt
import logging
from typing import cast

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import CursorResult
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.system_settings import get_time_setting
from features.bot_reminder.config import channel_enabled, snapshot_channel
from features.bot_reminder.message import MESSAGE
from features.zalo_reminder.client import BotClient, BotUnavailable
from features.zalo_reminder.models import ZaloDailyDelivery, ZaloRecipient

VIETNAM_TZ = dt.timezone(dt.timedelta(hours=7))
logger = logging.getLogger(__name__)


def now_vietnam() -> dt.datetime:
    return dt.datetime.now(VIETNAM_TZ)


def daily_results(db: Session, day: dt.date) -> list[dict[str, str]]:
    rows = db.scalars(select(ZaloDailyDelivery).where(
        ZaloDailyDelivery.delivery_date == day,
    ).order_by(ZaloDailyDelivery.display_name, ZaloDailyDelivery.zalo_id)).all()
    return [{
        "id": row.zalo_id, "name": row.display_name, "date": row.delivery_date.isoformat(),
        "status": row.status, "error": row.error,
        "updated_at": row.updated_at.isoformat() + "Z",
    } for row in rows]


def _claim(db: Session, day: dt.date, person: ZaloRecipient) -> bool:
    key = (day, person.zalo_id)
    row = db.get(ZaloDailyDelivery, key)
    if row is None:
        try:
            db.add(ZaloDailyDelivery(
                delivery_date=day, zalo_id=person.zalo_id, display_name=person.display_name,
                status="SENDING", updated_at=dt.datetime.utcnow(),
            ))
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
    claimed = db.execute(update(ZaloDailyDelivery).where(
        ZaloDailyDelivery.delivery_date == day,
        ZaloDailyDelivery.zalo_id == person.zalo_id,
        ZaloDailyDelivery.status == "FAILED",
    ).values(status="SENDING", error="", updated_at=dt.datetime.utcnow()))
    db.commit()
    return cast(CursorResult[tuple[()]], claimed).rowcount == 1


def _result(db: Session, day: dt.date, person: ZaloRecipient, status: str, error: str = "") -> None:
    row = db.get(ZaloDailyDelivery, (day, person.zalo_id))
    if row is None:
        row = ZaloDailyDelivery(delivery_date=day, zalo_id=person.zalo_id, display_name=person.display_name,
                                status=status, error=error)
        db.add(row)
    else:
        row.status = status
        row.error = error
        row.updated_at = dt.datetime.utcnow()
    db.commit()


def _expire(db: Session, day: dt.date, person: ZaloRecipient) -> None:
    row = db.get(ZaloDailyDelivery, (day, person.zalo_id))
    if row is None or row.status == "FAILED":
        _result(db, day, person, "MISSED", "Hết thời gian gửi bù")
    elif row.status == "SENDING":
        _result(db, day, person, "UNKNOWN", "Kết quả gửi chưa rõ sau khi tiến trình gián đoạn")


def run_due(db: Session, bot: BotClient) -> dict[str, str | bool]:
    now = now_vietnam()
    cutoff = get_time_setting(db, "meal_cutoff_time", "17:00")
    start = dt.datetime.combine(now.date(), cutoff, tzinfo=VIETNAM_TZ)
    result: dict[str, str | bool] = {"date": now.date().isoformat(), "due": now >= start}
    previous_day = now.date() - dt.timedelta(days=1)
    previous_start = dt.datetime.combine(previous_day, cutoff, tzinfo=VIETNAM_TZ)
    previous_start_utc = previous_start.astimezone(dt.timezone.utc).replace(tzinfo=None)
    if channel_enabled(db, "zalo", previous_day):
        for person in db.scalars(select(ZaloRecipient).where(
            ZaloRecipient.selected_at <= previous_start_utc,
        )).all():
            try:
                _expire(db, previous_day, person)
            except Exception:
                db.rollback()
                logger.exception("Could not record yesterday's missed Zalo reminder")
    if now < start:
        return result
    if not snapshot_channel(db, "zalo", now.date()):
        return result
    end = start + dt.timedelta(minutes=30)
    people = db.scalars(select(ZaloRecipient).order_by(ZaloRecipient.zalo_id)).all()
    for person in people:
        try:
            if now >= end:
                _expire(db, now.date(), person)
                continue
            row = db.get(ZaloDailyDelivery, (now.date(), person.zalo_id))
            if row is not None and row.status == "SENDING":
                _result(db, now.date(), person, "UNKNOWN", "Kết quả gửi chưa rõ sau khi tiến trình gián đoạn")
                continue
            if row is not None and row.status in {"SENT", "UNKNOWN", "MISSED"}:
                continue
            try:
                available = bot.status()["connected"]
            except BotUnavailable:
                available = False
            if not available:
                _result(db, now.date(), person, "FAILED", "Bot Zalo chưa kết nối")
                continue
            if not _claim(db, now.date(), person):
                continue
            try:
                bot.send(person.zalo_id, MESSAGE)
            except BotUnavailable:
                _result(db, now.date(), person, "UNKNOWN", "Kết quả gửi chưa rõ; cần kiểm tra Zalo")
            else:
                _result(db, now.date(), person, "SENT")
        except Exception:
            db.rollback()
            logger.exception("Daily Zalo reminder failed for one recipient")
    return result


def _tick() -> None:
    with SessionLocal() as db:
        run_due(db, BotClient())


async def run_scheduler_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(_tick)
        except Exception:
            logger.exception("Daily Zalo reminder scheduler failed")
        await asyncio.sleep(15)
