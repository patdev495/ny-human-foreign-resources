from __future__ import annotations

import datetime as dt

from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException

from features.hr_foreign.models import ForeignEmployee, Stay, TravelRecord
from features.hr_foreign.meal_reporting.models import MealReport, MealReportRevision
from features.hr_foreign.meal_reporting import rules
from features.hr_foreign.meal_reporting.schemas import HrMealReportView, MealReportRevisionView, MealReportSubmission, MealReportView, MealSelection, PublicPerson


def active_travel(db: Session, employee_id: int, on_date: dt.date) -> TravelRecord | None:
    record = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == employee_id, TravelRecord.entry_date <= on_date)
        .order_by(TravelRecord.entry_date.desc(), TravelRecord.id.desc())
        .first()
    )
    if record is None or (record.actual_exit_date is not None and record.actual_exit_date <= on_date):
        return None
    return record


def active_stay(db: Session, employee_id: int, on_date: dt.date) -> Stay | None:
    return (
        db.query(Stay)
        .filter(
            Stay.employee_id == employee_id,
            Stay.start_date <= on_date,
            (Stay.end_date.is_(None) | (Stay.end_date >= on_date)),
        )
        .order_by(Stay.start_date.desc(), Stay.id.desc())
        .first()
    )


def public_person(db: Session, employee: ForeignEmployee, on_date: dt.date) -> PublicPerson:
    travel = active_travel(db, employee.id, on_date)
    stay = active_stay(db, employee.id, on_date) if travel else None
    room_number = stay.room.room_number if stay and stay.accommodation_type == "KTX" and stay.room else None
    status = "KTX" if room_number else "HOTEL" if stay and stay.accommodation_type == "HOTEL" else "ABROAD" if not travel else "UNASSIGNED"
    return PublicPerson(
        id=employee.id,
        name_latin=employee.name_latin,
        name_chinese=employee.name_chinese,
        room_number=room_number,
        status=status,
        can_report=status == "KTX",
    )


def list_people(db: Session, query: str) -> list[PublicPerson]:
    employees = db.query(ForeignEmployee).filter(ForeignEmployee.employee_type == "FOREIGN").order_by(ForeignEmployee.name_latin).all()
    term = query.casefold().strip()
    today = dt.date.today()
    return [
        public_person(db, employee, today)
        for employee in employees
        if not term or term in employee.name_latin.casefold() or term in (employee.name_chinese or "").casefold()
    ]


def report_view(db: Session, employee_id: int, meal_date: dt.date) -> MealReportView:
    report = db.query(MealReport).filter(MealReport.employee_id == employee_id, MealReport.meal_date == meal_date).first()
    selection = MealSelection(breakfast=report.breakfast, dinner=report.dinner) if report else None
    return MealReportView(employee_id=employee_id, meal_date=meal_date, current=selection)


def hr_report_view(db: Session, employee_id: int, meal_date: dt.date) -> HrMealReportView:
    current = report_view(db, employee_id, meal_date)
    report = db.query(MealReport).filter(MealReport.employee_id == employee_id, MealReport.meal_date == meal_date).first()
    revisions = (
        db.query(MealReportRevision).filter(MealReportRevision.report_id == report.id)
        .order_by(MealReportRevision.id).all()
        if report else []
    )
    return HrMealReportView(
        employee_id=employee_id, meal_date=meal_date, current=current.current,
        history=[MealReportRevisionView(breakfast=item.breakfast, dinner=item.dinner, submitted_at=item.submitted_at) for item in revisions],
    )


def submit_report(db: Session, submission: MealReportSubmission) -> MealReportView:
    now = rules.now_vietnam()
    rules.require_submission_window(submission.meal_date, now)
    employee = db.get(ForeignEmployee, submission.employee_id)
    if employee is None or employee.employee_type != "FOREIGN":
        raise HTTPException(status_code=404, detail="Person not found")
    if not active_travel(db, employee.id, submission.meal_date) or not (
        (stay := active_stay(db, employee.id, submission.meal_date))
        and stay.accommodation_type == "KTX" and stay.room_id is not None
    ):
        raise HTTPException(status_code=403, detail="Only current dormitory residents can report meals")
    if db.bind is not None and db.bind.dialect.name == "mssql":
        db.execute(text(
            "DECLARE @result int; EXEC @result = sp_getapplock "
            "@Resource=:resource, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; "
            "IF @result < 0 RAISERROR('Meal report is busy', 16, 1);"
        ), {"resource": f"meal-report:{employee.id}:{submission.meal_date.isoformat()}"})
    report = db.query(MealReport).filter(MealReport.employee_id == employee.id, MealReport.meal_date == submission.meal_date).first()
    if report is None:
        report = MealReport(employee_id=employee.id, meal_date=submission.meal_date, breakfast=submission.breakfast, dinner=submission.dinner)
        db.add(report)
    else:
        report.breakfast = submission.breakfast
        report.dinner = submission.dinner
    report.updated_at = now.replace(tzinfo=None)
    db.flush()
    db.refresh(report)
    db.add(MealReportRevision(
        report_id=report.id, breakfast=submission.breakfast, dinner=submission.dinner,
        submitted_at=now.replace(tzinfo=None),
    ))
    db.commit()
    return report_view(db, employee.id, submission.meal_date)
