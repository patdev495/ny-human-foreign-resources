from __future__ import annotations

import datetime as dt
import logging
from collections.abc import Callable

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.notifications import NotificationTarget
from core.system_settings import SystemSetting
from features.bot_reminder.config import VIETNAM_TZ, channel_enabled
from features.bot_reminder.models import TravelReminderDelivery
from features.bot_reminder.schemas import TravelReminderConfig

logger = logging.getLogger(__name__)
MessageProvider = Callable[[Session, dt.date, int], str | None]
TargetProvider = Callable[[Session], list[NotificationTarget]]


def get_config(db: Session) -> TravelReminderConfig:
    row = db.get(SystemSetting, "travel_reminder")
    return TravelReminderConfig.model_validate_json(row.value) if row else TravelReminderConfig()


def save_config(db: Session, config: TravelReminderConfig) -> TravelReminderConfig:
    row = db.get(SystemSetting, "travel_reminder")
    if row is None:
        db.add(SystemSetting(key="travel_reminder", value=config.model_dump_json()))
    else:
        row.value = config.model_dump_json()
    db.commit()
    return config


def _deliver(db: Session, day: dt.date, target: NotificationTarget, message: str) -> None:
    key = (target.channel, day, target.recipient_id)
    # The persisted primary key prevents duplicate sends across workers/restarts.
    if db.get(TravelReminderDelivery, key) is not None:
        return
    row = TravelReminderDelivery(channel=target.channel, delivery_date=day,
                                 recipient_id=target.recipient_id, display_name=target.name,
                                 status="SENDING")
    try:
        db.add(row)
        db.commit()
    except IntegrityError:
        db.rollback()
        return
    sent_parts = 0
    try:
        # Both channels accept these small chunks, even for a large daily list.
        remaining = message
        while remaining:
            boundary = remaining.rfind("\n", 0, 3000) if len(remaining) > 3000 else len(remaining)
            if boundary <= 0:
                boundary = 3000
            target.send(remaining[:boundary])
            sent_parts += 1
            remaining = remaining[boundary:].lstrip("\n")
    except target.rejected:
        row.status = "UNKNOWN" if sent_parts else "FAILED"
        row.error = "Kênh từ chối tin nhắn; không tự gửi lại trong ngày để tránh nhắc trùng."
    except Exception:
        row.status = "UNKNOWN"
        row.error = "Chưa xác định kết quả gửi; kiểm tra kênh trước khi gửi lại."
        logger.exception("Travel reminder delivery failed on %s", target.channel)
    else:
        row.status = "SENT"
    row.updated_at = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    db.commit()


def run_due(db: Session, now: dt.datetime, message_provider: MessageProvider,
            providers: dict[str, TargetProvider]) -> bool:
    local = now.astimezone(VIETNAM_TZ)
    config = get_config(db)
    if not config.enabled or local.time() < dt.time.fromisoformat(config.time):
        return False
    enabled = [channel for channel in providers if channel_enabled(db, channel, local.date())]
    if not enabled:
        return False
    message = message_provider(db, local.date(), config.days_before)
    if not message:
        return False
    for channel in enabled:
        try:
            targets = providers[channel](db)
        except Exception:
            db.rollback()
            logger.exception("Could not load %s travel reminder recipients", channel)
            continue
        for target in targets:
            try:
                _deliver(db, local.date(), target, message)
            except Exception:
                db.rollback()
                logger.exception("Could not persist travel reminder result")
    return True
