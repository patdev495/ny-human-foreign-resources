from __future__ import annotations

import datetime as dt

from features.hr_foreign.meal_reporting import rules as meal_rules


def can_submit(report_date: dt.date, now: dt.datetime) -> bool:
    if report_date not in meal_rules.selectable_dates(now):
        return False
    deadline = dt.datetime.combine(report_date, dt.time(17), tzinfo=meal_rules.VIETNAM_TZ)
    return now < deadline
