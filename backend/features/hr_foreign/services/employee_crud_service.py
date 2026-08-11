from __future__ import annotations

import datetime
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from features.hr_foreign.models import ForeignEmployee
from features.hr_foreign.schemas import (
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
)
from features.hr_foreign.status_engine import evaluate_employee_statuses


def get_employees(db: Session, q: str | None = None) -> list[ForeignEmployee]:
    query = db.query(ForeignEmployee)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                ForeignEmployee.name_latin.ilike(search_pattern),
                ForeignEmployee.name_chinese.ilike(search_pattern),
                ForeignEmployee.passport_number.ilike(search_pattern),
                ForeignEmployee.department.ilike(search_pattern),
            )
        )
    return query.all()


def get_employees_read(db: Session, q: str | None = None) -> list[ForeignEmployeeRead]:
    employees = get_employees(db, q=q)
    return evaluate_employee_statuses(db, employees)


def to_employee_read(db: Session, emp: ForeignEmployee) -> ForeignEmployeeRead:
    results = evaluate_employee_statuses(db, [emp])
    return results[0]


def _validate_travel_dates(
    payload_entry: datetime.date | None,
    payload_expected_exit: datetime.date | None,
    payload_actual_exit: datetime.date | None,
    existing_entry: datetime.date | None = None,
    existing_actual_exit: datetime.date | None = None,
) -> None:
    entry = payload_entry
    expected_exit = payload_expected_exit
    actual_exit = payload_actual_exit

    today = datetime.date.today()
    if entry and entry > today:
        raise HTTPException(
            status_code=400,
            detail="Ngày thực tế đến Việt Nam không được chọn ngày tương lai. Để lên lịch sang, vui lòng điền vào 'Ngày dự kiến sang'.",
        )
    if actual_exit and actual_exit > today:
        raise HTTPException(
            status_code=400,
            detail="Ngày thực tế đã về nước không được chọn ngày tương lai. Để lên lịch về, vui lòng điền vào 'Ngày dự kiến về'.",
        )

    if entry:
        if actual_exit and actual_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày về thực tế ({actual_exit}) không thể nhỏ hơn ngày đến "
                    f"Việt Nam ({entry})."
                ),
            )
        if expected_exit and expected_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày dự kiến về ({expected_exit}) không thể nhỏ hơn ngày đến "
                    f"Việt Nam ({entry})."
                ),
            )

    if (
        existing_entry is not None
        and existing_actual_exit is None
        and entry is not None
        and entry != existing_entry
        and actual_exit is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Nhân sự chưa có Ngày về thực tế cho đợt sang "
                f"{existing_entry}. Vui lòng cập nhật Ngày về thực tế cho đợt cũ "
                f"trước khi nhập đợt đến mới, hoặc chỉnh sửa Ngày đến của đợt hiện tại."
            ),
        )


def get_employee_by_id(db: Session, emp_id: int) -> ForeignEmployee | None:
    return db.query(ForeignEmployee).filter(ForeignEmployee.id == emp_id).first()


def create_employee(db: Session, payload: ForeignEmployeeCreate) -> ForeignEmployee:
    if payload.employee_code and payload.employee_code.strip():
        code = payload.employee_code.strip()
        existing = db.query(ForeignEmployee).filter(ForeignEmployee.employee_code == code).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Mã nhân viên '{code}' đã tồn tại trong hệ thống ({existing.name_latin}).",
            )
    _validate_travel_dates(
        payload_entry=payload.entry_date,
        payload_expected_exit=payload.expected_exit_date,
        payload_actual_exit=payload.actual_exit_date,
    )
    emp = ForeignEmployee(**payload.model_dump())
    try:
        db.add(emp)
        db.flush()
        db.commit()
        db.refresh(emp)
        return emp
    except IntegrityError as e:
        db.rollback()
        err_str = str(e)
        if "employee_code" in err_str:
            raise HTTPException(
                status_code=400,
                detail="Mã nhân viên bị trùng hoặc cơ sở dữ liệu đang có chỉ mục cũ chặn mã để trống. Hệ thống đang tự động xóa chỉ mục cũ khi khởi động lại backend.",
            )
        raise HTTPException(status_code=400, detail=f"Lỗi ràng buộc dữ liệu: {err_str}")


def update_employee(
    db: Session, emp: ForeignEmployee, payload: ForeignEmployeeUpdate
) -> ForeignEmployee:
    if payload.employee_code and payload.employee_code.strip():
        code = payload.employee_code.strip()
        existing = (
            db.query(ForeignEmployee)
            .filter(ForeignEmployee.employee_code == code, ForeignEmployee.id != emp.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Mã nhân viên '{code}' đã thuộc về nhân viên khác ({existing.name_latin}).",
            )
    _validate_travel_dates(
        payload_entry=payload.entry_date,
        payload_expected_exit=payload.expected_exit_date,
        payload_actual_exit=payload.actual_exit_date,
        existing_entry=emp.entry_date,
        existing_actual_exit=emp.actual_exit_date,
    )
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(emp, key, value)
    try:
        db.commit()
        db.refresh(emp)
        return emp
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi ràng buộc dữ liệu: {e}")


def delete_employee(db: Session, emp: ForeignEmployee) -> None:
    db.delete(emp)
    db.commit()
