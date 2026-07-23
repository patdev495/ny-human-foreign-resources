from __future__ import annotations

import datetime
from collections import defaultdict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from features.hr_foreign.models import (
    Contract,
    DocWarningConfig,
    ForeignEmployee,
    Stay,
    TamTru,
    Visa,
    WorkPermit,
)
from features.hr_foreign.schemas import (
    DocWarningConfigItem,
    DocWarningConfigUpdateItem,
    ExpiringDocumentItem,
    ExpiringDocumentsResponse,
    ForeignEmployeeRead,
)

DEFAULT_DOC_WARNING_CONFIGS = [
    {"doc_type": "VISA", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "TAM_TRU", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "GPLD", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "CONTRACT", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "PASSPORT", "warning_value": 30, "warning_unit": "DAY"},
]


def get_warning_configs(db: Session) -> list[DocWarningConfig]:
    configs = db.query(DocWarningConfig).all()
    existing_types = {c.doc_type for c in configs}
    added = False
    for default in DEFAULT_DOC_WARNING_CONFIGS:
        if default["doc_type"] not in existing_types:
            cfg = DocWarningConfig(
                doc_type=default["doc_type"],
                warning_value=default["warning_value"],
                warning_unit=default["warning_unit"],
            )
            db.add(cfg)
            added = True
    if added:
        db.flush()
        configs = db.query(DocWarningConfig).all()
    return configs


def update_warning_configs(
    db: Session, updates: list[DocWarningConfigUpdateItem]
) -> list[DocWarningConfig]:
    configs = get_warning_configs(db)
    config_map = {c.doc_type: c for c in configs}
    for item in updates:
        if item.doc_type in config_map:
            config_map[item.doc_type].warning_value = item.warning_value
            config_map[item.doc_type].warning_unit = item.warning_unit
    db.commit()
    return get_warning_configs(db)



def evaluate_employee_statuses(
    db: Session, employees: list[ForeignEmployee], today: datetime.date | None = None
) -> list[ForeignEmployeeRead]:
    if today is None:
        today = datetime.date.today()

    if not employees:
        return []

    emp_ids = [e.id for e in employees]

    # 1. Batch query Stays (with Room preloaded)
    stays = (
        db.query(Stay)
        .options(joinedload(Stay.room))
        .filter(Stay.employee_id.in_(emp_ids))
        .all()
    )
    stays_by_emp: dict[int, list[Stay]] = defaultdict(list)
    stay_to_emp_id: dict[int, int] = {}
    for s in stays:
        stays_by_emp[s.employee_id].append(s)
        stay_to_emp_id[s.id] = s.employee_id

    all_stay_ids = list(stay_to_emp_id.keys())

    # 2. Batch query Visas
    visas_by_emp: dict[int, list[Visa]] = defaultdict(list)
    if all_stay_ids:
        visas = (
            db.query(Visa)
            .filter(Visa.stay_id.in_(all_stay_ids), Visa.expiry_date.isnot(None))
            .order_by(Visa.expiry_date.desc())
            .all()
        )
        for v in visas:
            emp_id = stay_to_emp_id.get(v.stay_id)
            if emp_id:
                visas_by_emp[emp_id].append(v)

    # 3. Batch query TamTrus
    tam_trus_by_emp: dict[int, list[TamTru]] = defaultdict(list)
    if all_stay_ids:
        tam_trus = (
            db.query(TamTru)
            .filter(TamTru.stay_id.in_(all_stay_ids), TamTru.expiry_date.isnot(None))
            .order_by(TamTru.expiry_date.desc())
            .all()
        )
        for tt in tam_trus:
            emp_id = stay_to_emp_id.get(tt.stay_id)
            if emp_id:
                tam_trus_by_emp[emp_id].append(tt)

    # 4. Batch query WorkPermits
    work_permits = (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id.in_(emp_ids), WorkPermit.valid_to.isnot(None))
        .order_by(WorkPermit.valid_to.desc())
        .all()
    )
    wp_by_emp: dict[int, list[WorkPermit]] = defaultdict(list)
    for wp in work_permits:
        wp_by_emp[wp.employee_id].append(wp)

    # 5. Batch query Contracts
    contracts = (
        db.query(Contract)
        .filter(Contract.employee_id.in_(emp_ids), Contract.end_date.isnot(None))
        .order_by(Contract.end_date.desc())
        .all()
    )
    contracts_by_emp: dict[int, list[Contract]] = defaultdict(list)
    for c in contracts:
        contracts_by_emp[c.employee_id].append(c)

    results: list[ForeignEmployeeRead] = []
    for emp in employees:
        res = ForeignEmployeeRead.model_validate(emp)
        emp_stays = sorted(
            stays_by_emp.get(emp.id, []),
            key=lambda s: s.start_date or datetime.date.min,
            reverse=True,
        )
        latest_stay = emp_stays[0] if emp_stays else None

        active_stay = next(
            (s for s in emp_stays if s.end_date is None or s.end_date >= today), None
        )

        # Fallback travel dates from latest stay record if profile level is empty
        effective_entry = emp.entry_date or (latest_stay.start_date if latest_stay else None)
        effective_expected_exit = (
            emp.expected_exit_date
            or (latest_stay.expected_end_date if latest_stay else None)
            or emp.required_exit_date
        )
        effective_actual_exit = emp.actual_exit_date or (latest_stay.end_date if latest_stay else None)

        res.entry_date = effective_entry
        res.expected_exit_date = effective_expected_exit
        res.actual_exit_date = effective_actual_exit
        
        # 1. Determine presence status (is_in_vietnam)
        if effective_actual_exit and effective_actual_exit <= today:
            res.is_in_vietnam = False
        elif effective_entry and effective_entry <= today:
            res.is_in_vietnam = True
        else:
            has_exited_legacy = bool(emp.required_exit_date and emp.required_exit_date < today)
            res.is_in_vietnam = bool(active_stay and not has_exited_legacy)

        # 2. Determine overdue return status (is_overdue_exit)
        if res.is_in_vietnam and effective_actual_exit is None and effective_expected_exit and effective_expected_exit < today:
            res.is_overdue_exit = True
        else:
            res.is_overdue_exit = False

        if active_stay:
            if active_stay.room:
                res.current_room_number = active_stay.room.room_number
            elif active_stay.accommodation_type == "HOTEL":
                res.current_room_number = "Khách sạn"
            else:
                res.current_room_number = None
        else:
            res.current_room_number = None

        emp_visas = visas_by_emp.get(emp.id, [])
        latest_visa = emp_visas[0] if emp_visas else None
        res.latest_visa_expiry = latest_visa.expiry_date if latest_visa else None
        res.latest_visa_type = latest_visa.visa_type if latest_visa else None

        emp_tam_trus = tam_trus_by_emp.get(emp.id, [])
        latest_tt = emp_tam_trus[0] if emp_tam_trus else None
        res.latest_tamtru_expiry = latest_tt.expiry_date if latest_tt else None

        emp_wps = wp_by_emp.get(emp.id, [])
        latest_wp = emp_wps[0] if emp_wps else None
        res.latest_gpld_expiry = latest_wp.valid_to if latest_wp else None

        emp_contracts = contracts_by_emp.get(emp.id, [])
        latest_c = emp_contracts[0] if emp_contracts else None
        res.latest_contract_expiry = latest_c.end_date if latest_c else None

        results.append(res)

    return results


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

    # 1. Visas
    visas = (
        db.query(Visa)
        .filter(Visa.expiry_date >= today, Visa.expiry_date <= visa_cutoff)
        .all()
    )
    expiring_visas: list[ExpiringDocumentItem] = []
    for v in visas:
        stay = v.stay
        emp = stay.employee if stay else None
        if emp:
            days_rem = (v.expiry_date - today).days
            expiring_visas.append(
                ExpiringDocumentItem(
                    id=v.id,
                    stay_id=v.stay_id,
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
        stay = tt.stay
        emp = stay.employee if stay else None
        if emp:
            days_rem = (tt.expiry_date - today).days
            expiring_tam_trus.append(
                ExpiringDocumentItem(
                    id=tt.id,
                    stay_id=tt.stay_id,
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
        if emp:
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
        if emp:
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

    # 5. Passports
    passports = (
        db.query(ForeignEmployee)
        .filter(ForeignEmployee.passport_expiry >= today, ForeignEmployee.passport_expiry <= passport_cutoff)
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

    # 6. Check Missing Information for Employees & Active Stays
    all_employees = db.query(ForeignEmployee).all()

    active_stays = (
        db.query(Stay)
        .filter(or_(Stay.end_date.is_(None), Stay.end_date >= today))
        .all()
    )
    active_stay_map = defaultdict(list)
    for s in active_stays:
        active_stay_map[s.employee_id].append(s)

    active_stay_ids = [s.id for s in active_stays]
    visas_for_stays = (
        db.query(Visa).filter(Visa.stay_id.in_(active_stay_ids)).all()
        if active_stay_ids
        else []
    )
    visas_by_stay = defaultdict(list)
    for v in visas_for_stays:
        visas_by_stay[v.stay_id].append(v)

    tam_trus_for_stays = (
        db.query(TamTru).filter(TamTru.stay_id.in_(active_stay_ids)).all()
        if active_stay_ids
        else []
    )
    tam_trus_by_stay = defaultdict(list)
    for tt in tam_trus_for_stays:
        tam_trus_by_stay[tt.stay_id].append(tt)

    all_wps = db.query(WorkPermit).all()
    wps_by_emp = defaultdict(list)
    for wp in all_wps:
        wps_by_emp[wp.employee_id].append(wp)

    all_contracts = db.query(Contract).all()
    contracts_by_emp = defaultdict(list)
    for c in all_contracts:
        contracts_by_emp[c.employee_id].append(c)

    for emp in all_employees:
        # Check Passports missing info
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

        # Check Active Stays for Visas & Tam Trus missing info
        emp_active_stays = active_stay_map.get(emp.id, [])
        for stay in emp_active_stays:
            s_visas = visas_by_stay.get(stay.id, [])
            if not s_visas or any(v.expiry_date is None for v in s_visas):
                expiring_visas.append(
                    ExpiringDocumentItem(
                        id=None,
                        stay_id=stay.id,
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
            s_tt = tam_trus_by_stay.get(stay.id, [])
            if not s_tt or any(tt.expiry_date is None for tt in s_tt):
                expiring_tam_trus.append(
                    ExpiringDocumentItem(
                        id=None,
                        stay_id=stay.id,
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

        # Check GPLD & Contract missing info for all active employees
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


