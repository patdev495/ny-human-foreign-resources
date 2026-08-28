from __future__ import annotations

import datetime
from fastapi import HTTPException
from sqlalchemy import case, or_
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
    today = datetime.date.today()
    if entry and entry > today:
        raise HTTPException(
            status_code=400,
            detail="Ngày thực tế đến Việt Nam không được chọn ngày tương lai. Để lên lịch sang, vui lòng nhập vào 'Ngày dự kiến sang'.",
        )
    if actual_exit and actual_exit > today:
        raise HTTPException(
            status_code=400,
            detail="Ngày thực tế đã về nước không được chọn ngày tương lai. Để lên lịch về, vui lòng nhập vào 'Ngày dự kiến về'.",
        )
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
    today = datetime.date.today()
    if open_trip:
        if not open_trip.entry_date or open_trip.entry_date > today:
            open_trip.entry_date = payload.entry_date
            if payload.expected_entry_date:
                open_trip.expected_entry_date = payload.expected_entry_date
            if payload.expected_exit_date:
                open_trip.expected_exit_date = payload.expected_exit_date
            if payload.notes:
                open_trip.notes = payload.notes
            emp.entry_date = payload.entry_date
            emp.expected_entry_date = open_trip.expected_entry_date
            emp.expected_exit_date = open_trip.expected_exit_date
            emp.actual_exit_date = None
            db.commit()
            db.refresh(open_trip)
            return open_trip
        else:
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


def _sync_travel_record_exit_with_stays(db: Session, record: TravelRecord) -> None:
    if not record.actual_exit_date:
        return
    active_stays = (
        db.query(Stay)
        .filter(
            Stay.employee_id == record.employee_id,
            or_(Stay.travel_record_id == record.id, Stay.travel_record_id.is_(None)),
            or_(Stay.end_date.is_(None), Stay.end_date > record.actual_exit_date),
        )
        .all()
    )
    for stay in active_stays:
        stay.end_date = record.actual_exit_date


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
    for key, value in payload.model_dump(exclude_unset=True).items():
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

    _sync_travel_record_exit_with_stays(db, record)

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
        if payload.actual_exit_date > datetime.date.today():
            raise HTTPException(
                status_code=400,
                detail="Ngày thực tế đã về nước không được chọn ngày tương lai. Để lên lịch về, vui lòng nhập vào 'Ngày dự kiến về'.",
            )
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


def delete_travel_record(db: Session, record: TravelRecord) -> None:
    emp_id = record.employee_id
    db.delete(record)
    db.flush()

    emp = db.query(ForeignEmployee).filter(ForeignEmployee.id == emp_id).first()
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
        if latest:
            emp.entry_date = latest.entry_date
            emp.expected_entry_date = latest.expected_entry_date
            emp.expected_exit_date = latest.expected_exit_date
            emp.actual_exit_date = latest.actual_exit_date
        else:
            emp.entry_date = None
            emp.expected_entry_date = None
            emp.expected_exit_date = None
            emp.actual_exit_date = None

    db.commit()



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

    visas = db.query(Visa).filter(Visa.employee_id == emp_id).order_by(Visa.expiry_date.desc()).all()
    tam_trus = db.query(TamTru).filter(TamTru.employee_id == emp_id).order_by(TamTru.expiry_date.desc()).all()

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
