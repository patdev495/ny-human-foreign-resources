from __future__ import annotations

import datetime as dt

from fastapi import HTTPException

VIETNAM_TZ = dt.timezone(dt.timedelta(hours=7))


def now_vietnam() -> dt.datetime:
    return dt.datetime.now(VIETNAM_TZ)


def selectable_dates(now: dt.datetime) -> list[dt.date]:
    today = now.date()
    monday = today - dt.timedelta(days=today.weekday())
    sunday = monday + dt.timedelta(days=6)
    end = sunday + (dt.timedelta(days=7) if today.weekday() == 6 else dt.timedelta())
    return [today + dt.timedelta(days=offset) for offset in range((end - today).days + 1)]


def can_submit(meal_date: dt.date, now: dt.datetime) -> bool:
    if meal_date not in selectable_dates(now) or meal_date.weekday() == 6 or meal_date <= now.date():
        return False
    deadline = dt.datetime.combine(meal_date - dt.timedelta(days=1), dt.time(17), tzinfo=VIETNAM_TZ)
    return now < deadline


def require_submission_window(meal_date: dt.date, now: dt.datetime) -> None:
    if not can_submit(meal_date, now):
        raise HTTPException(status_code=422, detail="Reporting closed for this date. Contact HR.")
