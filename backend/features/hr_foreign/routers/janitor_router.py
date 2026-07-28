from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign.schemas.janitor_schemas import (
    JanitorAttendanceCreate,
    JanitorAttendanceRangeCreate,
    JanitorDailyAttendanceSheet,
)
from features.hr_foreign.services.janitor_service import (
    bulk_create_janitor_range_absence,
    delete_janitor_absence,
    get_daily_janitor_sheet,
    upsert_janitor_absence,
)

router = APIRouter(prefix="/janitors", tags=["hr_foreign_janitors"])


@router.get("/attendance", response_model=JanitorDailyAttendanceSheet)
def get_daily_attendance_sheet(
    target_date: datetime.date = Query(default_factory=datetime.date.today),
    db: Session = Depends(get_db),
):
    return get_daily_janitor_sheet(db, target_date)


@router.post("/attendance")
def create_or_update_janitor_absence(
    payload: JanitorAttendanceCreate,
    db: Session = Depends(get_db),
):
    rec = upsert_janitor_absence(db, payload)
    return {
        "id": rec.id,
        "employee_id": rec.employee_id,
        "attendance_date": rec.attendance_date.isoformat(),
        "absence_type": rec.absence_type,
        "reason": rec.reason,
    }


@router.post("/attendance/range")
def bulk_register_janitor_range_absence(
    payload: JanitorAttendanceRangeCreate,
    db: Session = Depends(get_db),
):
    records = bulk_create_janitor_range_absence(db, payload)
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "attendance_date": r.attendance_date.isoformat(),
            "absence_type": r.absence_type,
            "reason": r.reason,
        }
        for r in records
    ]


@router.delete("/attendance/{employee_id}")
def reset_janitor_attendance_status(
    employee_id: int,
    target_date: datetime.date = Query(...),
    db: Session = Depends(get_db),
):
    success = delete_janitor_absence(db, employee_id, target_date)
    return {"success": success}
