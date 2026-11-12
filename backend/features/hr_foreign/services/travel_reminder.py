from __future__ import annotations

import datetime as dt

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from features.hr_foreign.models import ForeignEmployee, TravelRecord


def reminder_message(db: Session, today: dt.date, days_before: int) -> str | None:
    end = today + dt.timedelta(days=days_before)
    records = db.execute(select(TravelRecord, ForeignEmployee).join(
        ForeignEmployee, ForeignEmployee.id == TravelRecord.employee_id,
    ).where(
        ForeignEmployee.employee_type == "FOREIGN",
        ForeignEmployee.status == "WORKING",
        TravelRecord.actual_exit_date.is_(None),
        or_(TravelRecord.expected_entry_date.between(today, end),
            TravelRecord.expected_exit_date.between(today, end)),
    )).all()
    events: list[tuple[dt.date, int, str]] = []
    for record, employee in records:
        label = employee.name_latin
        if employee.employee_code:
            label += f" ({employee.employee_code})"
        for kind, expected, completed in (
            ("Đến Việt Nam", record.expected_entry_date, record.entry_date),
            ("Rời Việt Nam", record.expected_exit_date, record.actual_exit_date),
        ):
            if expected is not None and completed is None and today <= expected <= end:
                remaining = (expected - today).days
                when = "hôm nay" if remaining == 0 else f"còn {remaining} ngày"
                events.append((expected, record.id,
                               f"• {label} — {kind}: {expected:%d/%m/%Y} ({when}), đợt #{record.id}"))
    if not events:
        return None
    lines = "\n".join(line for _, _, line in sorted(events))
    return (f"Nhắc lịch xuất nhập cảnh ngày {today:%d/%m/%Y}:\n{lines}\n"
            "Vui lòng kiểm tra lịch và sắp xếp đón/tiễn tại https://ns.nienyi.vn.")
