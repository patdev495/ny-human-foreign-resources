from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign.end_shift_reporting import rules
from features.hr_foreign.end_shift_reporting.schemas import EndShiftReportView, EndShiftSubmission
from features.hr_foreign.end_shift_reporting.service import is_eligible, report_view, submit_report
from features.hr_foreign.meal_reporting import rules as meal_rules
from features.hr_foreign.models import ForeignEmployee

router = APIRouter(prefix="/api/end-shift-reporting")


@router.get("/dates")
def get_dates() -> list[dict[str, str | bool]]:
    now = meal_rules.now_vietnam()
    return [
        {"date": day.isoformat(), "can_submit": rules.can_submit(day, now)}
        for day in meal_rules.selectable_dates(now)
    ]


@router.get("/people/{employee_id}/reports/{report_date}", response_model=EndShiftReportView)
def get_report(employee_id: int, report_date: dt.date, db: Session = Depends(get_db)) -> EndShiftReportView:
    employee = db.get(ForeignEmployee, employee_id)
    if employee is None or employee.employee_type != "FOREIGN":
        raise HTTPException(status_code=404, detail="Person not found")
    if not is_eligible(db, employee_id, meal_rules.now_vietnam().date()):
        raise HTTPException(status_code=403, detail="Only current dormitory residents can view end of shift reports")
    return report_view(db, employee_id, report_date)


@router.post("/reports", response_model=EndShiftReportView)
def post_report(payload: EndShiftSubmission, db: Session = Depends(get_db)) -> EndShiftReportView:
    return submit_report(db, payload)
