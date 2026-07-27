from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    MealAbsence,
    MealPriceConfig,
    MealSessionLock,
    Stay,
)
from features.hr_foreign.schemas import (
    JanitorDailyItem,
    MealExpenseReportItem,
    MealExpenseReportResponse,
)
from .meal_price_service import seed_default_meal_prices


def validate_meal_session_locks_for_period(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> dict[str, list[dict[str, str | list[str]]]]:
    """Check if all working days (excluding Sundays) in start_date..end_date have meal session locks."""
    locks = (
        db.query(MealSessionLock)
        .filter(
            MealSessionLock.lock_date >= start_date,
            MealSessionLock.lock_date <= end_date,
        )
        .all()
    )
    locked_map: dict[datetime.date, set[str]] = {}
    for l in locks:
        locked_map.setdefault(l.lock_date, set()).add(l.meal_session)

    missing_dates: list[dict[str, str | list[str]]] = []
    curr_d = start_date
    while curr_d <= end_date:
        # Skip Sunday (weekday == 6)
        if curr_d.weekday() != 6:
            day_locks = locked_map.get(curr_d, set())
            missing_sessions = []
            if "BREAKFAST" not in day_locks:
                missing_sessions.append("BREAKFAST")
            if "DINNER" not in day_locks:
                missing_sessions.append("DINNER")
            if "LUNCH" not in day_locks:
                missing_sessions.append("LUNCH")
            
            if missing_sessions:
                missing_dates.append({
                    "date": curr_d.isoformat(),
                    "missing_sessions": missing_sessions
                })
        curr_d += datetime.timedelta(days=1)

    return {"missing_dates": missing_dates}


def calculate_meal_expenses(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> MealExpenseReportResponse:
    seed_default_meal_prices(db)

    event_days_map = {
        ev.event_date: ev.event_type
        for ev in db.query(EventDay)
        .filter(EventDay.event_date >= start_date, EventDay.event_date <= end_date)
        .all()
    }

    def get_prices(d: datetime.date, day_type: str) -> tuple[float, float]:
        cfg = (
            db.query(MealPriceConfig)
            .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= d)
            .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
            .first()
        )
        if cfg:
            return float(cfg.foreign_breakfast_price), float(cfg.foreign_dinner_price)
        return (50000.0, 70000.0) if day_type == "PRESIDENT_VISIT" else (30000.0, 40000.0)

    locks = (
        db.query(MealSessionLock)
        .filter(
            MealSessionLock.lock_date >= start_date,
            MealSessionLock.lock_date <= end_date,
        )
        .all()
    )
    locks_map = {(l.lock_date, l.meal_session): l for l in locks}

    eligible_stays = (
        db.query(Stay)
        .filter(
            Stay.accommodation_type == "KTX",
            Stay.has_meals == True,
            Stay.start_date <= end_date,
            or_(Stay.end_date.is_(None), Stay.end_date >= start_date),
        )
        .all()
    )

    items: list[MealExpenseReportItem] = []
    overall_session_meals: dict[tuple[datetime.date, str], int] = {}
    overall_session_cost: dict[tuple[datetime.date, str], float] = {}

    for stay in eligible_stays:
        emp = stay.employee
        room = stay.room
        if not emp:
            continue

        absences = (
            db.query(MealAbsence)
            .filter(
                MealAbsence.stay_id == stay.id,
                MealAbsence.absence_date >= start_date,
                MealAbsence.absence_date <= end_date,
            )
            .all()
        )
        absences_by_date: dict[datetime.date, set[str]] = {}
        for ma in absences:
            absences_by_date.setdefault(ma.absence_date, set()).add(ma.meal_type)

        stay_days_count = 0
        absent_days_count = 0
        meal_days_count = 0
        emp_total_meals = 0
        normal_days_count = 0
        event_days_count = 0
        total_cost = 0.0

        curr_d = start_date
        while curr_d <= end_date:
            if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                stay_days_count += 1
                day_type = event_days_map.get(curr_d, "NORMAL")
                default_bf_price, default_dn_price = get_prices(curr_d, day_type)

                day_absences = absences_by_date.get(curr_d, set())
                is_bf_absent = ("ALL_DAY" in day_absences) or ("BREAKFAST" in day_absences)
                is_dn_absent = ("ALL_DAY" in day_absences) or ("DINNER" in day_absences)

                if is_bf_absent and is_dn_absent:
                    absent_days_count += 1
                else:
                    meal_days_count += 1
                    if day_type == "NORMAL":
                        normal_days_count += 1
                    else:
                        event_days_count += 1

                bf_lock = locks_map.get((curr_d, "BREAKFAST"))
                bf_price = bf_lock.locked_price_per_meal if bf_lock else default_bf_price
                if not is_bf_absent:
                    emp_total_meals += 1
                    total_cost += bf_price
                    overall_session_meals[(curr_d, "BREAKFAST")] = (
                        overall_session_meals.get((curr_d, "BREAKFAST"), 0) + 1
                    )
                    overall_session_cost[(curr_d, "BREAKFAST")] = (
                        overall_session_cost.get((curr_d, "BREAKFAST"), 0.0) + bf_price
                    )

                dn_lock = locks_map.get((curr_d, "DINNER"))
                dn_price = dn_lock.locked_price_per_meal if dn_lock else default_dn_price
                if not is_dn_absent:
                    emp_total_meals += 1
                    total_cost += dn_price
                    overall_session_meals[(curr_d, "DINNER")] = (
                        overall_session_meals.get((curr_d, "DINNER"), 0) + 1
                    )
                    overall_session_cost[(curr_d, "DINNER")] = (
                        overall_session_cost.get((curr_d, "DINNER"), 0.0) + dn_price
                    )

            curr_d += datetime.timedelta(days=1)

        if stay_days_count > 0:
            items.append(
                MealExpenseReportItem(
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    name_chinese=emp.name_chinese,
                    passport_number=emp.passport_number,
                    room_number=room.room_number if room else "N/A",
                    stay_days=stay_days_count,
                    absent_days=absent_days_count,
                    meal_days=meal_days_count,
                    normal_days=normal_days_count,
                    event_days=event_days_count,
                    meal_count=emp_total_meals,
                    total_cost=total_cost,
                )
            )

    total_employees = len(items)
    total_stay_days = sum(i.stay_days for i in items)
    total_meal_days = sum(i.meal_days for i in items)

    janitor_items: list[JanitorDailyItem] = []
    company_total_meals = 0
    company_total_expense = 0.0

    curr_d = start_date
    while curr_d <= end_date:
        lunch_lock = locks_map.get((curr_d, "LUNCH"))
        if lunch_lock:
            j_cost = lunch_lock.final_meal_count * lunch_lock.locked_price_per_meal
            janitor_items.append(
                JanitorDailyItem(
                    date=curr_d,
                    meal_count=lunch_lock.final_meal_count,
                    price_per_meal=lunch_lock.locked_price_per_meal,
                    total_cost=j_cost,
                    notes=lunch_lock.notes,
                )
            )

        for session in ("BREAKFAST", "LUNCH", "DINNER"):
            lock = locks_map.get((curr_d, session))
            if lock:
                company_total_meals += lock.final_meal_count
                company_total_expense += lock.final_meal_count * lock.locked_price_per_meal
            else:
                company_total_meals += overall_session_meals.get((curr_d, session), 0)
                company_total_expense += overall_session_cost.get((curr_d, session), 0.0)

        curr_d += datetime.timedelta(days=1)

    total_janitor_meals = sum(j.meal_count for j in janitor_items)
    total_janitor_expense = sum(j.total_cost for j in janitor_items)

    return MealExpenseReportResponse(
        start_date=start_date,
        end_date=end_date,
        total_employees=total_employees,
        total_stay_days=total_stay_days,
        total_meal_days=total_meal_days,
        total_meals=company_total_meals,
        total_expense=company_total_expense,
        items=items,
        janitor_items=janitor_items,
        total_janitor_meals=total_janitor_meals,
        total_janitor_expense=total_janitor_expense,
    )

