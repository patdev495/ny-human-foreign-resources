from __future__ import annotations

import datetime
from collections import defaultdict
from sqlalchemy.orm import Session, joinedload

from features.hr_foreign.models import (
    Contract,
    ForeignEmployee,
    Stay,
    TamTru,
    TravelRecord,
    Visa,
    WorkPermit,
)
from features.hr_foreign.schemas import ForeignEmployeeRead


def evaluate_employee_statuses(
    db: Session, employees: list[ForeignEmployee], today: datetime.date | None = None
) -> list[ForeignEmployeeRead]:
    if today is None:
        today = datetime.date.today()

    if not employees:
        return []

    emp_ids = [e.id for e in employees]

    stays = (
        db.query(Stay)
        .options(joinedload(Stay.room))
        .filter(Stay.employee_id.in_(emp_ids))
        .all()
    )
    stays_by_emp: dict[int, list[Stay]] = defaultdict(list)
    for s in stays:
        stays_by_emp[s.employee_id].append(s)

    visas_by_emp: dict[int, list[Visa]] = defaultdict(list)
    visas = (
        db.query(Visa)
        .filter(Visa.employee_id.in_(emp_ids), Visa.expiry_date.isnot(None))
        .order_by(Visa.expiry_date.desc())
        .all()
    )
    for v in visas:
        visas_by_emp[v.employee_id].append(v)

    tam_trus_by_emp: dict[int, list[TamTru]] = defaultdict(list)
    tam_trus = (
        db.query(TamTru)
        .filter(TamTru.employee_id.in_(emp_ids), TamTru.expiry_date.isnot(None))
        .order_by(TamTru.expiry_date.desc())
        .all()
    )
    for tt in tam_trus:
        tam_trus_by_emp[tt.employee_id].append(tt)

    work_permits = (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id.in_(emp_ids), WorkPermit.valid_to.isnot(None))
        .order_by(WorkPermit.valid_to.desc())
        .all()
    )
    wp_by_emp: dict[int, list[WorkPermit]] = defaultdict(list)
    for wp in work_permits:
        wp_by_emp[wp.employee_id].append(wp)

    contracts = (
        db.query(Contract)
        .filter(Contract.employee_id.in_(emp_ids), Contract.end_date.isnot(None))
        .order_by(Contract.end_date.desc())
        .all()
    )
    contracts_by_emp: dict[int, list[Contract]] = defaultdict(list)
    for c in contracts:
        contracts_by_emp[c.employee_id].append(c)

    travel_records = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id.in_(emp_ids))
        .order_by(TravelRecord.entry_date.desc(), TravelRecord.id.desc())
        .all()
    )
    tr_by_emp: dict[int, list[TravelRecord]] = defaultdict(list)
    for tr in travel_records:
        tr_by_emp[tr.employee_id].append(tr)

    results: list[ForeignEmployeeRead] = []
    for emp in employees:
        res = ForeignEmployeeRead.model_validate(emp)
        emp_stays = sorted(
            stays_by_emp.get(emp.id, []),
            key=lambda s: s.start_date or datetime.date.min,
            reverse=True,
        )
        latest_stay = emp_stays[0] if emp_stays else None
        emp_trs = tr_by_emp.get(emp.id, [])
        latest_completed_tr = next((tr for tr in emp_trs if tr.actual_exit_date is not None), None)
        latest_completed_stay = next((s for s in emp_stays if s.end_date is not None), None)

        last_exit_date = emp.actual_exit_date
        if not last_exit_date:
            if latest_completed_tr and latest_completed_tr.actual_exit_date:
                last_exit_date = latest_completed_tr.actual_exit_date
            elif latest_completed_stay and latest_completed_stay.end_date:
                last_exit_date = latest_completed_stay.end_date

        active_stay = next(
            (s for s in emp_stays if s.end_date is None or s.end_date > today), None
        )

        effective_entry = emp.entry_date or (latest_stay.start_date if latest_stay else None)
        effective_expected_exit = (
            emp.expected_exit_date
            or (latest_stay.expected_end_date if latest_stay else None)
        )

        res.entry_date = effective_entry
        res.expected_exit_date = effective_expected_exit
        
        if emp.actual_exit_date and emp.actual_exit_date <= today:
            res.is_in_vietnam = False
            res.actual_exit_date = emp.actual_exit_date
        elif last_exit_date and (not emp.entry_date or emp.entry_date > today):
            res.is_in_vietnam = False
            res.actual_exit_date = last_exit_date
        elif effective_entry and effective_entry <= today:
            res.is_in_vietnam = True
            res.actual_exit_date = emp.actual_exit_date
        else:
            res.is_in_vietnam = bool(active_stay)
            res.actual_exit_date = last_exit_date if not bool(active_stay) else emp.actual_exit_date

        if res.is_in_vietnam and res.actual_exit_date is None and effective_expected_exit and effective_expected_exit < today:
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
