from __future__ import annotations

import datetime
from fastapi import HTTPException
from sqlalchemy import case
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    Contract,
    ForeignEmployee,
    Stay,
    TamTru,
    TravelRecord,
    Visa,
    WorkPermit,
)
from features.hr_foreign.schemas import (
    ContractRead,
    EmployeeHistoryResponse,
    ExitDateActionRequest,
    StayRead,
    TamTruRead,
    TravelRecordCreate,
    TravelRecordRead,
    TravelRecordUpdate,
    VisaRead,
    WorkPermitRead,
)
from .employee_crud_service import get_employee_by_id, to_employee_read


def _validate_travel_record_dates(
    entry: datetime.date | None,
    expected_exit: datetime.date | None,
    actual_exit: datetime.date | None,
) -> None:
    if entry:
        if actual_exit and actual_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=f"Ngày về thực tế ({actual_exit}) không thể nhỏ hơn ngày đến ({entry}).",
            )
        if expected_exit and expected_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=f"Ngày dự kiến về ({expected_exit}) không thể nhỏ hơn ngày đến ({entry}).",
            )


def list_travel_records(db: Session, emp_id: int) -> list[TravelRecord]:
    records = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == emp_id)
        .all()
    )
    return sorted(records, key=lambda r: r.entry_date or datetime.date.min, reverse=True)


def create_travel_record(
    db: Session,
    emp: ForeignEmployee,
    payload: TravelRecordCreate,
) -> TravelRecord:
    _validate_travel_record_dates(
        entry=payload.entry_date,
        expected_exit=payload.expected_exit_date,
        actual_exit=payload.actual_exit_date,
    )

    open_trip = (
        db.query(TravelRecord)
        .filter(
            TravelRecord.employee_id == emp.id,
            TravelRecord.actual_exit_date.is_(None),
        )
        .first()
    )
    if open_trip:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Đợt sang ngày {open_trip.entry_date} chưa có Ngày về thực tế. "
                f"Vui lòng chốt Ngày về thực tế cho đợt cũ trước khi thêm đợt đến mới."
            ),
        )

    record = TravelRecord(employee_id=emp.id, **payload.model_dump())
    db.add(record)
    emp.entry_date = record.entry_date
    emp.expected_entry_date = record.expected_entry_date
    emp.expected_exit_date = record.expected_exit_date
    emp.actual_exit_date = record.actual_exit_date
    db.commit()
    db.refresh(record)
    return record


def update_travel_record(
    db: Session,
    record: TravelRecord,
    payload: TravelRecordUpdate,
) -> TravelRecord:
    _validate_travel_record_dates(
        entry=payload.entry_date,
        expected_exit=payload.expected_exit_date,
        actual_exit=payload.actual_exit_date,
    )
    for key, value in payload.model_dump().items():
        setattr(record, key, value)
    
    emp = db.query(ForeignEmployee).filter(ForeignEmployee.id == record.employee_id).first()
    if emp:
        latest = (
            db.query(TravelRecord)
            .filter(TravelRecord.employee_id == emp.id)
            .order_by(
                case((TravelRecord.entry_date.is_(None), 1), else_=0),
                TravelRecord.entry_date.desc(),
                TravelRecord.id.desc(),
            )
            .first()
        )
        if latest and latest.id == record.id:
            emp.entry_date = record.entry_date
            emp.expected_entry_date = record.expected_entry_date
            emp.expected_exit_date = record.expected_exit_date
            emp.actual_exit_date = record.actual_exit_date

    db.commit()
    db.refresh(record)
    return record


def get_travel_record_by_id(db: Session, record_id: int) -> TravelRecord | None:
    return db.query(TravelRecord).filter(TravelRecord.id == record_id).first()


def record_employee_exit(
    db: Session,
    emp: ForeignEmployee,
    payload: ExitDateActionRequest,
) -> TravelRecord:
    latest_tr = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == emp.id)
        .order_by(
            case((TravelRecord.entry_date.is_(None), 1), else_=0),
            TravelRecord.entry_date.desc(),
            TravelRecord.id.desc(),
        )
        .first()
    )
    if not latest_tr:
        latest_tr = TravelRecord(
            employee_id=emp.id,
            entry_date=emp.entry_date,
            expected_exit_date=emp.expected_exit_date,
        )
        db.add(latest_tr)

    if payload.actual_exit_date:
        if latest_tr.entry_date and payload.actual_exit_date < latest_tr.entry_date:
            raise HTTPException(
                status_code=400,
                detail=f"Ngày thực tế đã về ({payload.actual_exit_date}) không thể nhỏ hơn ngày đến ({latest_tr.entry_date})",
            )
        latest_tr.actual_exit_date = payload.actual_exit_date
        emp.actual_exit_date = payload.actual_exit_date

        if payload.action_type == "CHECK_OUT":
            active_stays = (
                db.query(Stay)
                .filter(Stay.employee_id == emp.id, Stay.end_date.is_(None))
                .all()
            )
            for s in active_stays:
                s.end_date = payload.actual_exit_date

    if payload.expected_exit_date is not None:
        latest_tr.expected_exit_date = payload.expected_exit_date
        emp.expected_exit_date = payload.expected_exit_date

    if payload.expected_entry_date is not None:
        latest_tr.expected_entry_date = payload.expected_entry_date
        emp.expected_entry_date = payload.expected_entry_date

    if payload.notes:
        latest_tr.notes = payload.notes

    db.commit()
    db.refresh(latest_tr)
    return latest_tr


def get_employee_history(db: Session, emp_id: int) -> EmployeeHistoryResponse | None:
    emp = get_employee_by_id(db, emp_id)
    if not emp:
        return None

    work_permits = (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id == emp_id)
        .order_by(WorkPermit.valid_from)
        .all()
    )
    contracts = (
        db.query(Contract)
        .filter(Contract.employee_id == emp_id)
        .order_by(Contract.start_date)
        .all()
    )
    stays = db.query(Stay).filter(Stay.employee_id == emp_id).all()
    travel_records = list_travel_records(db, emp_id)
    stay_ids = [s.id for s in stays]

    visas = db.query(Visa).filter(Visa.stay_id.in_(stay_ids)).all() if stay_ids else []
    tam_trus = db.query(TamTru).filter(TamTru.stay_id.in_(stay_ids)).all() if stay_ids else []

    stay_reads = []
    for s in stays:
        sr = StayRead.model_validate(s)
        if s.room:
            sr.room_number = s.room.room_number
        stay_reads.append(sr)

    return EmployeeHistoryResponse(
        employee=to_employee_read(db, emp),
        work_permits=[WorkPermitRead.model_validate(wp) for wp in work_permits],
        contracts=[ContractRead.model_validate(c) for c in contracts],
        stays=stay_reads,
        visas=[VisaRead.model_validate(v) for v in visas],
        tam_trus=[TamTruRead.model_validate(tt) for tt in tam_trus],
        travel_records=[TravelRecordRead.model_validate(tr) for tr in travel_records],
    )
