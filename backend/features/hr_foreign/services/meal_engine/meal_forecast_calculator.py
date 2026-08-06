from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    ForeignEmployee,
    JanitorAttendanceRecord,
    MealAbsence,
    MealPriceConfig,
    MealSessionLock,
    Stay,
)
from features.hr_foreign.schemas import (
    DailyMealEmployeeItem,
    DailyMealForecastResponse,
    DailyMealSessionSummary,
)


def seed_default_meal_prices(db: Session) -> None:
    if db.query(MealPriceConfig).count() == 0:
        db.add_all([
            MealPriceConfig(
                day_type="NORMAL",
                day_type_name="Ngày bình thường",
                foreign_breakfast_price=30000.0,
                foreign_dinner_price=40000.0,
                janitor_meal_price=25000.0,
                fruit_allowance_price=60000.0,
                effective_from=datetime.date(2020, 1, 1),
            ),
            MealPriceConfig(
                day_type="PRESIDENT_VISIT",
                day_type_name="Chủ tịch sang",
                foreign_breakfast_price=50000.0,
                foreign_dinner_price=70000.0,
                janitor_meal_price=40000.0,
                fruit_allowance_price=60000.0,
                effective_from=datetime.date(2020, 1, 1),
            ),
        ])
        db.flush()
        db.commit()


def get_prices_for_date(
    db: Session, target_date: datetime.date, day_type: str
) -> tuple[float, float, float]:
    cfg = (
        db.query(MealPriceConfig)
        .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= target_date)
        .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
        .first()
    )
    if cfg:
        return (
            float(cfg.foreign_breakfast_price),
            float(cfg.foreign_dinner_price),
            float(cfg.janitor_meal_price),
        )
    if day_type == "PRESIDENT_VISIT":
        return 50000.0, 70000.0, 40000.0
    return 30000.0, 40000.0, 25000.0


def calculate_daily_forecast(
    db: Session, target_date: datetime.date
) -> DailyMealForecastResponse:
    seed_default_meal_prices(db)

    event_day = db.query(EventDay).filter(EventDay.event_date == target_date).first()
    day_type = event_day.event_type if event_day else "NORMAL"
    event_notes = event_day.notes if event_day else None

    bf_price, dn_price, lc_price = get_prices_for_date(db, target_date, day_type)

    price_cfg = (
        db.query(MealPriceConfig)
        .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= target_date)
        .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
        .first()
    )
    day_type_name = (
        price_cfg.day_type_name
        if (price_cfg and price_cfg.day_type_name)
        else ("Ngày bình thường" if day_type == "NORMAL" else day_type)
    )

    locks = db.query(MealSessionLock).filter(MealSessionLock.lock_date == target_date).all()
    locks_map = {l.meal_session: l for l in locks}

    stays = (
        db.query(Stay)
        .filter(
            or_(Stay.start_date.is_(None), Stay.start_date <= target_date),
            or_(Stay.end_date.is_(None), Stay.end_date >= target_date),
        )
        .all()
    )

    stay_ids = [s.id for s in stays]
    meal_absences = (
        db.query(MealAbsence)
        .filter(MealAbsence.stay_id.in_(stay_ids), MealAbsence.absence_date == target_date)
        .all()
    ) if stay_ids else []

    absences_by_stay: dict[int, set[str]] = {}
    for ma in meal_absences:
        absences_by_stay.setdefault(ma.stay_id, set()).add(ma.meal_type)

    employees_list: list[DailyMealEmployeeItem] = []
    active_ktx_residents_count = 0
    breakfast_absent_count = 0
    dinner_absent_count = 0

    for stay in stays:
        emp = stay.employee
        if not emp:
            continue

        loc_name = "Chưa xếp phòng"
        if stay.accommodation_type == "KTX" and stay.room:
            loc_name = f"Phòng {stay.room.room_number}"
        elif stay.accommodation_type == "HOTEL" and stay.hotel:
            loc_name = f"{stay.hotel.name}" + (f" - P.{stay.hotel_room_number}" if stay.hotel_room_number else "")

        stay_absences = absences_by_stay.get(stay.id, set())
        is_bf_absent = ("ALL_DAY" in stay_absences) or ("BREAKFAST" in stay_absences)
        is_dn_absent = ("ALL_DAY" in stay_absences) or ("DINNER" in stay_absences)

        if stay.accommodation_type == "KTX" and stay.has_meals:
            active_ktx_residents_count += 1
            if is_bf_absent:
                breakfast_absent_count += 1
            if is_dn_absent:
                dinner_absent_count += 1

        employees_list.append(
            DailyMealEmployeeItem(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                name_latin=emp.name_latin,
                name_chinese=emp.name_chinese,
                accommodation_type=stay.accommodation_type,
                location_name=loc_name,
                stay_id=stay.id,
                has_meals=stay.has_meals,
                is_breakfast_absent=is_bf_absent,
                is_dinner_absent=is_dn_absent,
            )
        )

    bf_calculated = max(0, active_ktx_residents_count - breakfast_absent_count)
    dn_calculated = max(0, active_ktx_residents_count - dinner_absent_count)

    bf_lock = locks_map.get("BREAKFAST")
    lc_lock = locks_map.get("LUNCH")
    dn_lock = locks_map.get("DINNER")

    total_janitor_ktx = (
        db.query(ForeignEmployee)
        .filter(
            ForeignEmployee.employee_type == "JANITORIAL",
            or_(
                ForeignEmployee.workplace_location == "DORMITORY",
                ForeignEmployee.workplace_location.is_(None),
            ),
            or_(
                ForeignEmployee.salary_unit != "DAY",
                ForeignEmployee.salary_unit.is_(None),
            ),
            or_(
                ForeignEmployee.status != "RESIGNED",
                ForeignEmployee.resignation_date.is_(None),
                ForeignEmployee.resignation_date > target_date,
            ),
        )
        .count()
    )

    absent_ktx_janitors_cnt = (
        db.query(JanitorAttendanceRecord)
        .join(ForeignEmployee, ForeignEmployee.id == JanitorAttendanceRecord.employee_id)
        .filter(
            JanitorAttendanceRecord.attendance_date == target_date,
            ForeignEmployee.employee_type == "JANITORIAL",
            or_(
                ForeignEmployee.workplace_location == "DORMITORY",
                ForeignEmployee.workplace_location.is_(None),
            ),
        )
        .count()
    )
    janitor_ktx_count = max(0, total_janitor_ktx - absent_ktx_janitors_cnt)

    breakfast_summary = DailyMealSessionSummary(
        meal_session="BREAKFAST",
        calculated_meal_count=bf_calculated,
        is_locked=bf_lock is not None,
        final_meal_count=bf_lock.final_meal_count if bf_lock else None,
        locked_price_per_meal=bf_lock.locked_price_per_meal if bf_lock else bf_price,
        locked_at=bf_lock.locked_at if bf_lock else None,
        notes=bf_lock.notes if bf_lock else None,
    )

    lunch_summary = DailyMealSessionSummary(
        meal_session="LUNCH",
        calculated_meal_count=janitor_ktx_count,
        is_locked=lc_lock is not None,
        final_meal_count=lc_lock.final_meal_count if lc_lock else None,
        locked_price_per_meal=lc_lock.locked_price_per_meal if lc_lock else lc_price,
        locked_at=lc_lock.locked_at if lc_lock else None,
        notes=lc_lock.notes if lc_lock else None,
    )

    dinner_summary = DailyMealSessionSummary(
        meal_session="DINNER",
        calculated_meal_count=dn_calculated,
        is_locked=dn_lock is not None,
        final_meal_count=dn_lock.final_meal_count if dn_lock else None,
        locked_price_per_meal=dn_lock.locked_price_per_meal if dn_lock else dn_price,
        locked_at=dn_lock.locked_at if dn_lock else None,
        notes=dn_lock.notes if dn_lock else None,
    )

    return DailyMealForecastResponse(
        date=target_date,
        day_type=day_type,
        day_type_name=day_type_name,
        suggested_price_per_meal=bf_price,
        suggested_breakfast_price=bf_price,
        suggested_dinner_price=dn_price,
        suggested_janitor_price=lc_price,
        event_notes=event_notes,
        breakfast=breakfast_summary,
        lunch=lunch_summary,
        dinner=dinner_summary,
        active_ktx_residents_count=active_ktx_residents_count,
        employees=employees_list,
    )
