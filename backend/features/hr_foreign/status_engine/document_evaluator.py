from __future__ import annotations

import datetime
from collections import defaultdict
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    Contract,
    ForeignEmployee,
    TamTru,
    Visa,
    WorkPermit,
)
from features.hr_foreign.schemas import (
    ExpiringDocumentItem,
    ExpiringDocumentsResponse,
)
from .warning_configs import get_warning_configs


def get_expiring_documents(
    db: Session, days: int | None = None, today: datetime.date | None = None
) -> ExpiringDocumentsResponse:
    if today is None:
        today = datetime.date.today()

    configs = {c.doc_type: c for c in get_warning_configs(db)}

    def get_cutoff(doc_type: str) -> datetime.date:
        if days is not None:
            return today + datetime.timedelta(days=days)
        cfg = configs.get(doc_type)
        if not cfg:
            return today + datetime.timedelta(days=30)
        num_days = cfg.warning_value * 30 if cfg.warning_unit == "MONTH" else cfg.warning_value
        return today + datetime.timedelta(days=num_days)

    visa_cutoff = get_cutoff("VISA")
    tam_tru_cutoff = get_cutoff("TAM_TRU")
    gpld_cutoff = get_cutoff("GPLD")
    contract_cutoff = get_cutoff("CONTRACT")
    passport_cutoff = get_cutoff("PASSPORT")

    def _is_janitorial(emp: ForeignEmployee) -> bool:
        """Nhân viên tạp vụ: chỉ quản lý tiền công/ăn, không cần theo dõi giấy tờ pháp lý."""
        return emp.employee_type == "JANITORIAL"

    # 1. Visas
    visas = (
        db.query(Visa)
        .filter(Visa.expiry_date >= today, Visa.expiry_date <= visa_cutoff)
        .all()
    )
    expiring_visas: list[ExpiringDocumentItem] = []
    for v in visas:
        emp = v.employee
        if emp and not _is_janitorial(emp):
            days_rem = (v.expiry_date - today).days
            expiring_visas.append(
                ExpiringDocumentItem(
                    id=v.id,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="VISA",
                    type_name=v.visa_type,
                    expiry_date=v.expiry_date,
                    days_remaining=days_rem,
                )
            )

    # 2. Tam Trus
    tam_trus = (
        db.query(TamTru)
        .filter(TamTru.expiry_date >= today, TamTru.expiry_date <= tam_tru_cutoff)
        .all()
    )
    expiring_tam_trus: list[ExpiringDocumentItem] = []
    for tt in tam_trus:
        emp = tt.employee
        if emp and not _is_janitorial(emp):
            days_rem = (tt.expiry_date - today).days
            expiring_tam_trus.append(
                ExpiringDocumentItem(
                    id=tt.id,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="TAM_TRU",
                    type_name="Đăng ký Tạm trú",
                    expiry_date=tt.expiry_date,
                    days_remaining=days_rem,
                )
            )

    # 3. Work Permits (GPLĐ)
    wps = (
        db.query(WorkPermit)
        .filter(WorkPermit.valid_to >= today, WorkPermit.valid_to <= gpld_cutoff)
        .all()
    )
    expiring_gpl_ds: list[ExpiringDocumentItem] = []
    for wp in wps:
        emp = wp.employee
        if emp and not _is_janitorial(emp):
            days_rem = (wp.valid_to - today).days
            expiring_gpl_ds.append(
                ExpiringDocumentItem(
                    id=wp.id,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="GPLD",
                    type_name=f"GPLĐ {wp.permit_number or ''}".strip(),
                    expiry_date=wp.valid_to,
                    days_remaining=days_rem,
                )
            )

    # 4. Contracts
    contracts = (
        db.query(Contract)
        .filter(Contract.end_date >= today, Contract.end_date <= contract_cutoff)
        .all()
    )
    expiring_contracts: list[ExpiringDocumentItem] = []
    for c in contracts:
        emp = c.employee
        if emp and not _is_janitorial(emp):
            days_rem = (c.end_date - today).days
            expiring_contracts.append(
                ExpiringDocumentItem(
                    id=c.id,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="CONTRACT",
                    type_name=f"Hợp đồng {c.contract_type or ''}".strip(),
                    expiry_date=c.end_date,
                    days_remaining=days_rem,
                )
            )

    # 5. Passports — exclude janitorial staff
    passports = (
        db.query(ForeignEmployee)
        .filter(
            ForeignEmployee.passport_expiry >= today,
            ForeignEmployee.passport_expiry <= passport_cutoff,
            ForeignEmployee.employee_type != "JANITORIAL",
        )
        .all()
    )
    expiring_passports: list[ExpiringDocumentItem] = []
    for emp in passports:
        if emp.passport_expiry:
            days_rem = (emp.passport_expiry - today).days
            expiring_passports.append(
                ExpiringDocumentItem(
                    id=emp.id,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="PASSPORT",
                    type_name="Hộ chiếu",
                    expiry_date=emp.passport_expiry,
                    days_remaining=days_rem,
                )
            )

    # 6. Check Missing Information — working employees (non-janitorial)
    all_employees = (
        db.query(ForeignEmployee)
        .filter(
            ForeignEmployee.employee_type != "JANITORIAL",
            ForeignEmployee.status == "WORKING",
        )
        .all()
    )

    all_visas = db.query(Visa).all()
    visas_by_emp: dict[int, list[Visa]] = defaultdict(list)
    for v in all_visas:
        visas_by_emp[v.employee_id].append(v)

    all_tam_trus = db.query(TamTru).all()
    tam_trus_by_emp: dict[int, list[TamTru]] = defaultdict(list)
    for tt in all_tam_trus:
        tam_trus_by_emp[tt.employee_id].append(tt)

    all_wps = db.query(WorkPermit).all()
    wps_by_emp = defaultdict(list)
    for wp in all_wps:
        wps_by_emp[wp.employee_id].append(wp)

    all_contracts = db.query(Contract).all()
    contracts_by_emp = defaultdict(list)
    for c in all_contracts:
        contracts_by_emp[c.employee_id].append(c)

    for emp in all_employees:
        if not emp.passport_number or not emp.passport_expiry:
            expiring_passports.append(
                ExpiringDocumentItem(
                    id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="PASSPORT",
                    type_name="Hộ chiếu",
                    expiry_date=emp.passport_expiry,
                    days_remaining=None,
                    is_missing_info=True,
                    missing_reason="Thiếu số hộ chiếu hoặc ngày hết hạn Hộ chiếu",
                )
            )

        e_visas = visas_by_emp.get(emp.id, [])
        if not e_visas or any(v.expiry_date is None for v in e_visas):
            expiring_visas.append(
                ExpiringDocumentItem(
                    id=None,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="VISA",
                    type_name="Visa",
                    expiry_date=None,
                    days_remaining=None,
                    is_missing_info=True,
                    missing_reason="Chưa đăng ký Visa hoặc thiếu ngày hết hạn",
                )
            )

        e_tt = tam_trus_by_emp.get(emp.id, [])
        if not e_tt or any(tt.expiry_date is None for tt in e_tt):
            expiring_tam_trus.append(
                ExpiringDocumentItem(
                    id=None,
                    stay_id=None,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="TAM_TRU",
                    type_name="Tạm trú",
                    expiry_date=None,
                    days_remaining=None,
                    is_missing_info=True,
                    missing_reason="Chưa đăng ký Tạm trú hoặc thiếu ngày hết hạn",
                )
            )

        if emp.actual_exit_date is None or emp.actual_exit_date > today:
            e_wps = wps_by_emp.get(emp.id, [])
            if not e_wps or any(w.valid_to is None for w in e_wps):
                expiring_gpl_ds.append(
                    ExpiringDocumentItem(
                        id=None,
                        employee_id=emp.id,
                        employee_name=emp.name_latin,
                        passport_number=emp.passport_number,
                        doc_type="GPLD",
                        type_name="GPLĐ",
                        expiry_date=None,
                        days_remaining=None,
                        is_missing_info=True,
                        missing_reason="Thiếu thông tin GPLĐ hoặc ngày hết hạn",
                    )
                )

            e_contracts = contracts_by_emp.get(emp.id, [])
            if not e_contracts or any(c.end_date is None for c in e_contracts):
                expiring_contracts.append(
                    ExpiringDocumentItem(
                        id=None,
                        employee_id=emp.id,
                        employee_name=emp.name_latin,
                        passport_number=emp.passport_number,
                        doc_type="CONTRACT",
                        type_name="Hợp đồng",
                        expiry_date=None,
                        days_remaining=None,
                        is_missing_info=True,
                        missing_reason="Thiếu thông tin HĐLĐ hoặc ngày hết hạn",
                    )
                )

    return ExpiringDocumentsResponse(
        expiring_visas=expiring_visas,
        expiring_tam_trus=expiring_tam_trus,
        expiring_gpl_ds=expiring_gpl_ds,
        expiring_contracts=expiring_contracts,
        expiring_passports=expiring_passports,
    )
