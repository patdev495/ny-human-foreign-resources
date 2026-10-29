from __future__ import annotations

import datetime
from dataclasses import dataclass
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import EventDay, MealAbsence, MealExtra, MealPriceConfig, MealSessionLock, Stay
from features.hr_foreign.services.janitor_service import get_dormitory_janitor_count_for_date
from .meal_forecast_calculator import calculate_daily_forecast, get_prices_for_date, seed_default_meal_prices, uses_meal_reports

@dataclass
class DailyExpenseRow:
    date: datetime.date
    is_sunday: bool
    day_type: str
    notes: str | None
    breakfast_count: int
    breakfast_price: float
    dinner_count: int
    dinner_price: float
    janitor_count: int
    janitor_price: float
    fruit_allowance: float
    day_total: float



def get_daily_expense_breakdown_items(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> list[DailyExpenseRow]:
    seed_default_meal_prices(db)

    event_days_map = {
        ev.event_date: ev
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

    all_stays = (
        db.query(Stay)
        .filter(
            Stay.start_date <= end_date,
            or_(Stay.end_date.is_(None), Stay.end_date >= start_date),
        )
        .all()
    )

    stay_ids = [s.id for s in eligible_stays]
    absences = (
        db.query(MealAbsence)
        .filter(
            MealAbsence.stay_id.in_(stay_ids),
            MealAbsence.absence_date >= start_date,
            MealAbsence.absence_date <= end_date,
        )
        .all()
    ) if stay_ids else []

    all_stay_ids = [s.id for s in all_stays]
    extras = (
        db.query(MealExtra)
        .filter(
            MealExtra.stay_id.in_(all_stay_ids),
            MealExtra.extra_date >= start_date,
            MealExtra.extra_date <= end_date,
        )
        .all()
    ) if all_stay_ids else []

    absences_by_date: dict[datetime.date, dict[int, set[str]]] = {}
    for ma in absences:
        absences_by_date.setdefault(ma.absence_date, {}).setdefault(ma.stay_id, set()).add(ma.meal_type)

    extras_by_date: dict[datetime.date, dict[int, set[str]]] = {}
    for me in extras:
        extras_by_date.setdefault(me.extra_date, {}).setdefault(me.stay_id, set()).add(me.meal_type)

    rows: list[DailyExpenseRow] = []
    curr_d = start_date
    while curr_d <= end_date:
        is_sunday = (curr_d.weekday() == 6)
        if is_sunday:
            rows.append(
                DailyExpenseRow(
                    date=curr_d,
                    is_sunday=True,
                    day_type="SUNDAY",
                    notes="Chủ nhật",
                    breakfast_count=0,
                    breakfast_price=0.0,
                    dinner_count=0,
                    dinner_price=0.0,
                    janitor_count=0,
                    janitor_price=0.0,
                    fruit_allowance=0.0,
                    day_total=0.0,
                )
            )
        else:
            ev_day = event_days_map.get(curr_d)
            day_type = ev_day.event_type if ev_day else "NORMAL"
            notes = ev_day.notes if ev_day else None

            bf_price_cfg, dn_price_cfg, jn_price_cfg = get_prices_for_date(db, curr_d, day_type)

            price_cfg = (
                db.query(MealPriceConfig)
                .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= curr_d)
                .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
                .first()
            )
            fruit_val = float(price_cfg.fruit_allowance_price) if (price_cfg and price_cfg.fruit_allowance_price) else 60000.0

            bf_lock = locks_map.get((curr_d, "BREAKFAST"))
            dn_lock = locks_map.get((curr_d, "DINNER"))
            lc_lock = locks_map.get((curr_d, "LUNCH"))

            # Sáng
            if bf_lock:
                bf_count = bf_lock.final_meal_count
                bf_price = float(bf_lock.locked_price_per_meal)
            else:
                bf_price = float(bf_price_cfg)
                bf_count = 0
                if uses_meal_reports(curr_d):
                    bf_count = calculate_daily_forecast(db, curr_d).breakfast.calculated_meal_count
                else:
                    for stay in eligible_stays:
                        if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                            day_abs = absences_by_date.get(curr_d, {}).get(stay.id, set())
                            if "BREAKFAST" not in day_abs and "ALL_DAY" not in day_abs:
                                bf_count += 1
                    for stay in all_stays:
                        if not stay.has_meals and stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                            day_ext = extras_by_date.get(curr_d, {}).get(stay.id, set())
                            if "BREAKFAST" in day_ext or "ALL_DAY" in day_ext:
                                bf_count += 1

            # Tối
            if dn_lock:
                dn_count = dn_lock.final_meal_count
                dn_price = float(dn_lock.locked_price_per_meal)
            else:
                dn_price = float(dn_price_cfg)
                dn_count = 0
                if uses_meal_reports(curr_d):
                    dn_count = calculate_daily_forecast(db, curr_d).dinner.calculated_meal_count
                else:
                    for stay in eligible_stays:
                        if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                            day_abs = absences_by_date.get(curr_d, {}).get(stay.id, set())
                            if "DINNER" not in day_abs and "ALL_DAY" not in day_abs:
                                dn_count += 1
                    for stay in all_stays:
                        if not stay.has_meals and stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                            day_ext = extras_by_date.get(curr_d, {}).get(stay.id, set())
                            if "DINNER" in day_ext or "ALL_DAY" in day_ext:
                                dn_count += 1

            # Lao công (Trưa)
            if lc_lock:
                janitor_count = lc_lock.final_meal_count
                janitor_price = float(lc_lock.locked_price_per_meal)
            else:
                janitor_price = float(jn_price_cfg)
                janitor_count = get_dormitory_janitor_count_for_date(db, curr_d)

            day_total = (bf_count * bf_price) + (dn_count * dn_price) + fruit_val + (janitor_count * janitor_price)

            rows.append(
                DailyExpenseRow(
                    date=curr_d,
                    is_sunday=False,
                    day_type=day_type,
                    notes=notes,
                    breakfast_count=bf_count,
                    breakfast_price=bf_price,
                    dinner_count=dn_count,
                    dinner_price=dn_price,
                    janitor_count=janitor_count,
                    janitor_price=janitor_price,
                    fruit_allowance=fruit_val,
                    day_total=day_total,
                )
            )

        curr_d += datetime.timedelta(days=1)

    return rows
