from __future__ import annotations

import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from features.hr_foreign.models import ForeignEmployee, JanitorAttendanceRecord
from features.hr_foreign.schemas.janitor_schemas import (
    JanitorAttendanceCreate,
    JanitorAttendanceItem,
    JanitorAttendanceRangeCreate,
    JanitorDailyAttendanceSheet,
)


def get_daily_janitor_sheet(db: Session, target_date: datetime.date) -> JanitorDailyAttendanceSheet:
    janitors = (
        db.query(ForeignEmployee)
        .filter(
            or_(
                ForeignEmployee.employee_type == "JANITORIAL",
                ForeignEmployee.role.ilike("%tạp vụ%"),
            ),
            or_(
                ForeignEmployee.status != "RESIGNED",
                ForeignEmployee.resignation_date.is_(None),
                ForeignEmployee.resignation_date > target_date,
            ),
        )
        .order_by(ForeignEmployee.id)
        .all()
    )

    records = (
        db.query(JanitorAttendanceRecord)
        .filter(JanitorAttendanceRecord.attendance_date == target_date)
        .all()
    )
    absence_map = {r.employee_id: r for r in records}

    items: list[JanitorAttendanceItem] = []
    present_cnt = 0
    full_day_cnt = 0
    half_day_cnt = 0

    for j in janitors:
        rec = absence_map.get(j.id)
        if rec:
            status = "ABSENT"
            absence_type = rec.absence_type
            reason = rec.reason
            if absence_type == "FULL_DAY":
                full_day_cnt += 1
            else:
                half_day_cnt += 1
        else:
            status = "PRESENT"
            absence_type = None
            reason = None
            present_cnt += 1

        items.append(
            JanitorAttendanceItem(
                employee_id=j.id,
                employee_code=j.employee_code,
                name_latin=j.name_latin,
                name_chinese=j.name_chinese,
                workplace_location=j.workplace_location or "DORMITORY",
                status=status,
                absence_type=absence_type,
                reason=reason,
            )
        )

    return JanitorDailyAttendanceSheet(
        date=target_date,
        total_count=len(janitors),
        present_count=present_cnt,
        full_day_absence_count=full_day_cnt,
        half_day_absence_count=half_day_cnt,
        items=items,
    )


def upsert_janitor_absence(db: Session, payload: JanitorAttendanceCreate) -> JanitorAttendanceRecord:
    rec = (
        db.query(JanitorAttendanceRecord)
        .filter(
            JanitorAttendanceRecord.employee_id == payload.employee_id,
            JanitorAttendanceRecord.attendance_date == payload.attendance_date,
        )
        .first()
    )
    if rec:
        rec.absence_type = payload.absence_type
        rec.reason = payload.reason
    else:
        rec = JanitorAttendanceRecord(
            employee_id=payload.employee_id,
            attendance_date=payload.attendance_date,
            absence_type=payload.absence_type,
            reason=payload.reason,
        )
        db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def delete_janitor_absence(db: Session, employee_id: int, target_date: datetime.date) -> bool:
    rec = (
        db.query(JanitorAttendanceRecord)
        .filter(
            JanitorAttendanceRecord.employee_id == employee_id,
            JanitorAttendanceRecord.attendance_date == target_date,
        )
        .first()
    )
    if rec:
        db.delete(rec)
        db.commit()
        return True
    return False


def bulk_create_janitor_range_absence(
    db: Session, payload: JanitorAttendanceRangeCreate
) -> list[JanitorAttendanceRecord]:
    created_records: list[JanitorAttendanceRecord] = []
    curr = payload.start_date
    while curr <= payload.end_date:
        # Skip Sundays (weekday 6)
        if curr.weekday() != 6:
            item_payload = JanitorAttendanceCreate(
                employee_id=payload.employee_id,
                attendance_date=curr,
                absence_type=payload.absence_type,
                reason=payload.reason,
            )
            rec = upsert_janitor_absence(db, item_payload)
            created_records.append(rec)
        curr += datetime.timedelta(days=1)
    return created_records
