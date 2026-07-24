from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import MealAbsence, Stay
from features.hr_foreign.schemas import (
    DailyPresenceGroup,
    DailyPresenceItem,
    DailyPresenceReportResponse,
    DailyPresenceSummary,
)
from .employee_service import evaluate_employee_statuses, get_employees


def get_daily_presence_report(
    db: Session, target_date: datetime.date
) -> DailyPresenceReportResponse:
    stays = (
        db.query(Stay)
        .filter(
            or_(Stay.start_date.is_(None), Stay.start_date <= target_date),
            or_(Stay.end_date.is_(None), Stay.end_date >= target_date),
        )
        .all()
    )

    stay_ids = [s.id for s in stays]
    absent_stay_ids = set(
        r[0]
        for r in db.query(MealAbsence.stay_id)
        .filter(MealAbsence.stay_id.in_(stay_ids), MealAbsence.absence_date == target_date)
        .all()
    ) if stay_ids else set()

    items: list[DailyPresenceItem] = []
    unassigned_items: list[DailyPresenceItem] = []
    ktx_map: dict[str, list[DailyPresenceItem]] = {}
    hotel_map: dict[str, list[DailyPresenceItem]] = {}

    for stay in stays:
        if stay.id in absent_stay_ids:
            continue

        emp = stay.employee
        if not emp:
            continue

        room_num = stay.room.room_number if stay.room else None
        hotel_n = stay.hotel.name if stay.hotel else None
        hotel_rm = stay.hotel_room_number

        if room_num:
            loc_name = f"Phòng {room_num}"
        elif hotel_n:
            loc_name = f"{hotel_n}" + (f" - P.{hotel_rm}" if hotel_rm else "")
        else:
            loc_name = "Chưa xếp phòng"

        item = DailyPresenceItem(
            employee_id=emp.id,
            employee_code=emp.employee_code,
            name_latin=emp.name_latin,
            name_chinese=emp.name_chinese,
            gender=emp.gender,
            department=emp.department,
            phone=emp.phone,
            accommodation_type=stay.accommodation_type,
            location_name=loc_name,
            room_number=room_num,
            hotel_name=hotel_n,
            hotel_room_number=hotel_rm,
            bed_location=stay.bed_location,
            stay_id=stay.id,
            stay_type=stay.stay_type,
            start_date=stay.start_date,
            expected_end_date=stay.expected_end_date,
        )
        items.append(item)

        if stay.accommodation_type == "KTX" and room_num:
            ktx_map.setdefault(room_num, []).append(item)
        elif stay.accommodation_type == "HOTEL" and hotel_n:
            hotel_map.setdefault(hotel_n, []).append(item)
        else:
            unassigned_items.append(item)

    all_employees = get_employees(db)
    emp_statuses = evaluate_employee_statuses(db, all_employees, today=target_date)
    
    exited_items: list[DailyPresenceItem] = []
    for emp_read in emp_statuses:
        if not emp_read.is_in_vietnam:
            exited_items.append(
                DailyPresenceItem(
                    employee_id=emp_read.id,
                    employee_code=emp_read.employee_code,
                    name_latin=emp_read.name_latin,
                    name_chinese=emp_read.name_chinese,
                    gender=emp_read.gender,
                    department=emp_read.department,
                    phone=emp_read.phone,
                    accommodation_type="KTX",
                    location_name="Đã về nước",
                    actual_exit_date=emp_read.actual_exit_date,
                    expected_entry_date=emp_read.expected_entry_date,
                    notes=emp_read.notes,
                )
            )

    ktx_groups = [
        DailyPresenceGroup(group_name=k, count=len(v), items=v)
        for k, v in ktx_map.items()
    ]
    hotel_groups = [
        DailyPresenceGroup(group_name=k, count=len(v), items=v)
        for k, v in hotel_map.items()
    ]

    ktx_count = sum(g.count for g in ktx_groups)
    hotel_count = sum(g.count for g in hotel_groups)

    return DailyPresenceReportResponse(
        target_date=target_date,
        summary=DailyPresenceSummary(
            total_in_vn=len(items),
            ktx_count=ktx_count,
            hotel_count=hotel_count,
            unassigned_count=len(unassigned_items),
            exited_count=len(exited_items),
        ),
        ktx_groups=ktx_groups,
        hotel_groups=hotel_groups,
        unassigned_items=unassigned_items,
        exited_items=exited_items,
        items=items,
    )
