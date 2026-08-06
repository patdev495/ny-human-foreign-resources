from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    MealAbsence,
    MealSessionLock,
    Stay,
)
from features.hr_foreign.schemas import (
    JanitorDailyItem,
    MealExpenseReportItem,
    MealExpenseReportResponse,
)
from .meal_forecast_calculator import get_prices_for_date, seed_default_meal_prices


def calculate_expense_report(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> MealExpenseReportResponse:
    """Calculate aggregate meal expense report items for a date range."""
    seed_default_meal_prices(db)

    event_days_map = {
        ev.event_date: ev.event_type
        for ev in db.query(EventDay)
        .filter(EventDay.event_date >= start_date, EventDay.event_date <= end_date)
        .all()
    }

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
                day_absences = absences_by_date.get(curr_d, set())

                bf_absent = ("ALL_DAY" in day_absences) or ("BREAKFAST" in day_absences)
                dn_absent = ("ALL_DAY" in day_absences) or ("DINNER" in day_absences)

                if bf_absent and dn_absent:
                    absent_days_count += 1
                else:
                    meal_days_count += 1
                    dt = event_days_map.get(curr_d, "NORMAL")
                    if dt != "NORMAL":
                        event_days_count += 1
                    else:
                        normal_days_count += 1

                dt = event_days_map.get(curr_d, "NORMAL")
                bf_price, dn_price, _ = get_prices_for_date(db, curr_d, dt)

                bf_lock = locks_map.get((curr_d, "BREAKFAST"))
                dn_lock = locks_map.get((curr_d, "DINNER"))

                final_bf_price = float(bf_lock.locked_price_per_meal) if bf_lock else bf_price
                final_dn_price = float(dn_lock.locked_price_per_meal) if dn_lock else dn_price

                if not bf_absent:
                    emp_total_meals += 1
                    total_cost += final_bf_price
                    overall_session_meals[(curr_d, "BREAKFAST")] = overall_session_meals.get((curr_d, "BREAKFAST"), 0) + 1
                    overall_session_cost[(curr_d, "BREAKFAST")] = overall_session_cost.get((curr_d, "BREAKFAST"), 0.0) + final_bf_price

                if not dn_absent:
                    emp_total_meals += 1
                    total_cost += final_dn_price
                    overall_session_meals[(curr_d, "DINNER")] = overall_session_meals.get((curr_d, "DINNER"), 0) + 1
                    overall_session_cost[(curr_d, "DINNER")] = overall_session_cost.get((curr_d, "DINNER"), 0.0) + final_dn_price

            curr_d += datetime.timedelta(days=1)

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

    total_employees = len(items)
    total_stay_days = sum(i.stay_days for i in items)
    total_meal_days = sum(i.meal_days for i in items)
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
