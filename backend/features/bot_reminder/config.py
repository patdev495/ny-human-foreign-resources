from __future__ import annotations

import datetime as dt

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.system_settings import SystemSetting, get_time_setting
from features.bot_reminder.models import ChannelChange, ChannelDay

VIETNAM_TZ = dt.timezone(dt.timedelta(hours=7))


def cutoff_at(db: Session, day: dt.date) -> dt.datetime:
    return dt.datetime.combine(day, get_time_setting(db, "meal_cutoff_time", "17:00"), VIETNAM_TZ)


def channel_enabled(db: Session, channel: str, day: dt.date) -> bool:
    snapshot = db.get(ChannelDay, (channel, day))
    if snapshot is not None:
        return snapshot.enabled
    change = db.scalar(select(ChannelChange).where(
        ChannelChange.channel == channel, ChannelChange.effective_date <= day,
    ).order_by(ChannelChange.effective_date.desc()).limit(1))
    return change is not None and change.enabled


def pending_enabled(db: Session, channel: str, day: dt.date) -> bool | None:
    next_change = db.get(ChannelChange, (channel, day + dt.timedelta(days=1)))
    if next_change is None:
        return None
    current = channel_enabled(db, channel, day)
    return next_change.enabled if next_change.enabled != current else None


def snapshot_channel(db: Session, channel: str, day: dt.date, commit: bool = True) -> bool:
    snapshot = db.get(ChannelDay, (channel, day))
    if snapshot is None:
        enabled = channel_enabled(db, channel, day)
        db.add(ChannelDay(channel=channel, delivery_date=day, enabled=enabled))
        if commit:
            db.commit()
        return enabled
    return snapshot.enabled


def set_channel_enabled(db: Session, channel: str, enabled: bool, now: dt.datetime,
                        commit: bool = True) -> dt.date:
    day = now.date()
    if now >= cutoff_at(db, day):
        snapshot_channel(db, channel, day, commit=False)
        effective_date = day + dt.timedelta(days=1)
    else:
        effective_date = day
        snapshot = db.get(ChannelDay, (channel, day))
        if snapshot is not None:
            snapshot.enabled = enabled
    setting = db.get(SystemSetting, f"bot_{channel}_enabled")
    if setting is None:
        db.add(SystemSetting(key=f"bot_{channel}_enabled", value="1" if enabled else "0"))
    else:
        setting.value = "1" if enabled else "0"
    change = db.get(ChannelChange, (channel, effective_date))
    if change is None:
        db.add(ChannelChange(channel=channel, effective_date=effective_date, enabled=enabled))
    else:
        change.enabled = enabled
    if commit:
        db.commit()
    return effective_date
