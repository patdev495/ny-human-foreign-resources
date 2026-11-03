from __future__ import annotations

import datetime as dt
import logging
from collections.abc import Callable
from typing import cast

from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.system_settings import get_time_setting
from features.bot_reminder.config import VIETNAM_TZ, channel_enabled
from features.bot_reminder.models import PreReminderDelivery
from features.hr_foreign.end_shift_reporting.service import demand_view, is_eligible
from features.hr_foreign.meal_reporting.models import MealReport
from features.hr_foreign.models import ForeignEmployee
from features.telegram_reminder.client import TelegramClient, TelegramRejected, TelegramUnavailable
from features.telegram_reminder.models import TelegramBot, selected_recipients_query
from features.zalo_reminder.client import BotClient, BotUnavailable
from features.zalo_reminder.models import ZaloRecipient

logger = logging.getLogger(__name__)


def pending_counts(db: Session, today: dt.date) -> tuple[int, int]:
    tomorrow = today + dt.timedelta(days=1)
    reported_meals = set(db.scalars(select(MealReport.employee_id).where(MealReport.meal_date == tomorrow)).all())
    employees = db.scalars(select(ForeignEmployee).where(ForeignEmployee.employee_type == "FOREIGN")).all()
    meals = 0 if tomorrow.weekday() == 6 else sum(
        is_eligible(db, employee.id, tomorrow) and employee.id not in reported_meals
        for employee in employees
    )
    shifts = next(group.count for group in demand_view(db, today).groups if group.key == "NOT_REPORTED")
    return meals, shifts


def message_for(db: Session, today: dt.date) -> str:
    meals, shifts = pending_counts(db, today)
    tomorrow = today + dt.timedelta(days=1)
    meal_line = (f"Báo cơm ngày {tomorrow:%d/%m/%Y}: còn {meals} người chưa báo."
                 if tomorrow.weekday() != 6 else f"Ngày {tomorrow:%d/%m/%Y} là Chủ nhật, không mở báo cơm.")
    return (f"Nhắc HR trước giờ chốt:\n{meal_line}\n"
            f"Điều xe tan làm ngày {today:%d/%m/%Y}: còn {shifts} người chưa báo.\n"
            "Vui lòng nhắc nhân viên hoàn tất tại https://ns.nienyi.vn.")


def _claim(db: Session, channel: str, day: dt.date, recipient_id: str, name: str) -> bool:
    key = (channel, day, recipient_id)
    if db.get(PreReminderDelivery, key) is None:
        try:
            db.add(PreReminderDelivery(channel=channel, delivery_date=day, recipient_id=recipient_id,
                                       display_name=name, status="SENDING"))
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
    claimed = db.execute(update(PreReminderDelivery).where(
        PreReminderDelivery.channel == channel, PreReminderDelivery.delivery_date == day,
        PreReminderDelivery.recipient_id == recipient_id, PreReminderDelivery.status == "FAILED",
    ).values(status="SENDING", error="", updated_at=dt.datetime.utcnow()))
    db.commit()
    return cast(CursorResult[tuple[()]], claimed).rowcount == 1


def _result(db: Session, channel: str, day: dt.date, recipient_id: str, status: str, error: str = "") -> None:
    row = db.get(PreReminderDelivery, (channel, day, recipient_id))
    if row is None:
        return
    row.status, row.error, row.updated_at = status, error, dt.datetime.utcnow()
    db.commit()


def _deliver(db: Session, channel: str, day: dt.date, recipient_id: str, name: str,
             message: str, send: Callable[[str], None], rejected: tuple[type[Exception], ...]) -> None:
    row = db.get(PreReminderDelivery, (channel, day, recipient_id))
    if row is not None and row.status == "SENDING":
        _result(db, channel, day, recipient_id, "UNKNOWN", "Kết quả gửi chưa rõ; cần kiểm tra kênh")
        return
    if row is not None and row.status in {"SENT", "UNKNOWN", "MISSED"}:
        return
    if not _claim(db, channel, day, recipient_id, name):
        return
    try:
        send(message)
    except rejected:
        _result(db, channel, day, recipient_id, "FAILED", "Kênh từ chối tin nhắn")
    except (BotUnavailable, TelegramUnavailable):
        _result(db, channel, day, recipient_id, "UNKNOWN", "Kết quả gửi chưa rõ; cần kiểm tra kênh")
    else:
        _result(db, channel, day, recipient_id, "SENT")


def run_due(db: Session, now: dt.datetime, zalo: BotClient, telegram: TelegramClient) -> bool:
    day = now.astimezone(VIETNAM_TZ).date()
    pre = get_time_setting(db, "hr_pre_reminder_time", "16:00")
    cutoff = get_time_setting(db, "meal_cutoff_time", "17:00")
    if pre >= min(cutoff, dt.time(17)):
        return False
    start = dt.datetime.combine(day, pre, VIETNAM_TZ)
    end = min(start + dt.timedelta(minutes=30),
              dt.datetime.combine(day, cutoff, VIETNAM_TZ),
              dt.datetime.combine(day, dt.time(17), VIETNAM_TZ))
    if now < start or now >= end:
        return False
    channels = {channel: channel_enabled(db, channel, day) for channel in ("zalo", "telegram")}
    if not any(channels.values()):
        return True
    message = message_for(db, day)
    if channels["zalo"]:
        try:
            zalo_connected = zalo.status()["connected"]
        except BotUnavailable:
            zalo_connected = False
        for person in db.scalars(select(ZaloRecipient).order_by(ZaloRecipient.zalo_id)).all() if zalo_connected else []:
            try:
                _deliver(db, "zalo", day, person.zalo_id, person.display_name, message,
                         lambda content, recipient=person: zalo.send(recipient.zalo_id, content), ())
            except Exception:
                db.rollback()
                logger.exception("Pre-reminder Zalo delivery failed")
    bot = db.get(TelegramBot, "current")
    if channels["telegram"] and bot is not None:
        for person in db.scalars(selected_recipients_query()).all():
            try:
                _deliver(db, "telegram", day, person.user_id, person.name, message,
                         lambda content, recipient=person: telegram.send(bot.token, recipient.chat_id, content),
                         (TelegramRejected,))
            except Exception:
                db.rollback()
                logger.exception("Pre-reminder Telegram delivery failed")
    return True


def tick() -> None:
    with SessionLocal() as db:
        run_due(db, dt.datetime.now(VIETNAM_TZ), BotClient(), TelegramClient())
