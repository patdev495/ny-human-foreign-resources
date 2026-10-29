from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign.models import ForeignEmployee
from features.hr_foreign.meal_reporting import rules
from features.hr_foreign.meal_reporting.schemas import MealReportSubmission, MealReportView, PublicPerson
from features.hr_foreign.meal_reporting.service import list_people, public_person, report_view, submit_report

router = APIRouter(prefix="/api/meal-reporting")


@router.get("/people", response_model=list[PublicPerson])
def get_people(q: str = Query(default=""), db: Session = Depends(get_db)) -> list[PublicPerson]:
    return list_people(db, q)


@router.get("/dates")
def get_dates() -> list[dict[str, str | bool]]:
    now = rules.now_vietnam()
    return [{"date": day.isoformat(), "can_submit": rules.can_submit(day, now)} for day in rules.selectable_dates(now)]


@router.get("/people/{employee_id}/reports/{meal_date}", response_model=MealReportView)
def get_report(employee_id: int, meal_date: dt.date, db: Session = Depends(get_db)) -> MealReportView:
    employee = db.get(ForeignEmployee, employee_id)
    if employee is None or employee.employee_type != "FOREIGN":
        raise HTTPException(status_code=404, detail="Person not found")
    if not public_person(db, employee, rules.now_vietnam().date()).can_report:
        raise HTTPException(status_code=403, detail="Only current dormitory residents can view meal reports")
    return report_view(db, employee_id, meal_date)


@router.post("/reports", response_model=MealReportView)
def post_report(payload: MealReportSubmission, db: Session = Depends(get_db)) -> MealReportView:
    return submit_report(db, payload)
