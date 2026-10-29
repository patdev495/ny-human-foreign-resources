from __future__ import annotations

import datetime as dt

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from features.hr_foreign.end_shift_reporting import rules
from features.hr_foreign.end_shift_reporting.models import EndShiftReport
from features.hr_foreign.end_shift_reporting.schemas import (
    DemandGroup, DemandPerson, EndShiftDemandView, EndShiftReportView, EndShiftSelection, EndShiftSubmission,
)
from features.hr_foreign.meal_reporting import rules as meal_rules
from features.hr_foreign.meal_reporting.service import active_stay, active_travel
from features.hr_foreign.models import ForeignEmployee


def is_eligible(db: Session, employee_id: int, on_date: dt.date) -> bool:
    employee = db.get(ForeignEmployee, employee_id)
    if employee is None or employee.employee_type != "FOREIGN" or not active_travel(db, employee_id, on_date):
        return False
    stay = active_stay(db, employee_id, on_date)
    return bool(stay and stay.accommodation_type == "KTX" and stay.room_id is not None)


def report_view(db: Session, employee_id: int, report_date: dt.date) -> EndShiftReportView:
    report = db.query(EndShiftReport).filter(
        EndShiftReport.employee_id == employee_id, EndShiftReport.report_date == report_date,
    ).first()
    current = EndShiftSelection(
        shift_choice=report.shift_choice, pickup_location=report.pickup_location, destination=report.destination,
    ) if report else None
    return EndShiftReportView(employee_id=employee_id, report_date=report_date, current=current)


def submit_report(db: Session, payload: EndShiftSubmission) -> EndShiftReportView:
    now = meal_rules.now_vietnam()
    if not rules.can_submit(payload.report_date, now):
        raise HTTPException(status_code=422, detail="Reporting closed for this date. Contact HR.")
    employee = db.get(ForeignEmployee, payload.employee_id)
    if employee is None or employee.employee_type != "FOREIGN":
        raise HTTPException(status_code=404, detail="Person not found")
    if not is_eligible(db, payload.employee_id, payload.report_date):
        raise HTTPException(status_code=403, detail="Only current dormitory residents can report end of shift")
    if db.bind is not None and db.bind.dialect.name == "mssql":
        db.execute(text(
            "DECLARE @result int; EXEC @result = sp_getapplock "
            "@Resource=:resource, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; "
            "IF @result < 0 RAISERROR('End shift report is busy', 16, 1);"
        ), {"resource": f"end-shift-report:{employee.id}:{payload.report_date.isoformat()}"})
    report = db.query(EndShiftReport).filter(
        EndShiftReport.employee_id == employee.id, EndShiftReport.report_date == payload.report_date,
    ).first()
    if report is None:
        report = EndShiftReport(employee_id=employee.id, report_date=payload.report_date)
        db.add(report)
    report.shift_choice = payload.shift_choice
    report.pickup_location = payload.pickup_location
    report.destination = payload.destination
    report.updated_at = now.replace(tzinfo=None)
    db.flush()
    db.commit()
    return report_view(db, employee.id, payload.report_date)


DEMAND_KEYS = ("CN09_1730", "CN09_2000", "CN15_1730", "CN15_2000", "SELF_TRAVEL", "NOT_REPORTED")


def demand_view(db: Session, report_date: dt.date) -> EndShiftDemandView:
    reports = db.query(EndShiftReport).filter(EndShiftReport.report_date == report_date).all()
    by_employee = {report.employee_id: report for report in reports}
    grouped: dict[str, list[DemandPerson]] = {key: [] for key in DEMAND_KEYS}
    employees = db.query(ForeignEmployee).filter(ForeignEmployee.employee_type == "FOREIGN").order_by(ForeignEmployee.name_latin).all()
    for employee in employees:
        if not is_eligible(db, employee.id, report_date):
            continue
        stay = active_stay(db, employee.id, report_date)
        room_number = stay.room.room_number if stay and stay.room else None
        person = DemandPerson(
            employee_id=employee.id, name_latin=employee.name_latin,
            name_chinese=employee.name_chinese, room_number=room_number,
        )
        report = by_employee.get(employee.id)
        if report is None:
            key = "NOT_REPORTED"
        elif report.shift_choice == "SELF_TRAVEL":
            key = "SELF_TRAVEL"
        else:
            key = f"{report.pickup_location}_{report.shift_choice.replace(':', '')}"
        grouped[key].append(person)
    return EndShiftDemandView(
        date=report_date,
        groups=[DemandGroup(key=key, count=len(grouped[key]), people=grouped[key]) for key in DEMAND_KEYS],
    )
