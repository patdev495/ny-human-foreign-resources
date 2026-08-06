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
    MealAbsenceCreate,
    MealPriceConfigCreate,
    MealPriceConfigUpdate,
    MealSessionLockCreate,
)


from .meal_calculation_engine import MealCalculationEngine


# --- MEAL PRICE CONFIG CRUD & SEEDING ---

def seed_default_meal_prices(db: Session) -> None:
    MealCalculationEngine.seed_default_meal_prices(db)


def get_meal_price_configs(db: Session) -> list[MealPriceConfig]:
    seed_default_meal_prices(db)
    return (
        db.query(MealPriceConfig)
        .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
        .all()
    )


def get_meal_price_config_by_id(db: Session, config_id: int) -> MealPriceConfig | None:
    return db.query(MealPriceConfig).filter(MealPriceConfig.id == config_id).first()


def create_meal_price_config(
    db: Session, payload: MealPriceConfigCreate
) -> MealPriceConfig:
    config = MealPriceConfig(**payload.model_dump())
    db.add(config)
    db.flush()
    db.commit()
    db.refresh(config)
    return config


def update_meal_price_config(
    db: Session, config: MealPriceConfig, payload: MealPriceConfigUpdate
) -> MealPriceConfig:
    old_day_type = config.day_type
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    if payload.day_type and payload.day_type != old_day_type:
        db.query(EventDay).filter(EventDay.event_type == old_day_type).update(
            {EventDay.event_type: payload.day_type}, synchronize_session=False
        )

    db.commit()
    db.refresh(config)
    return config


def delete_meal_price_config(db: Session, config: MealPriceConfig) -> None:
    db.delete(config)
    db.commit()


# --- MEAL ABSENCE CRUD ---

def get_meal_absences_by_stay(db: Session, stay_id: int) -> list[MealAbsence]:
    return db.query(MealAbsence).filter(MealAbsence.stay_id == stay_id).all()


def get_meal_absence_by_id(db: Session, abs_id: int) -> MealAbsence | None:
    return db.query(MealAbsence).filter(MealAbsence.id == abs_id).first()


def create_meal_absence(db: Session, stay_id: int, payload: MealAbsenceCreate) -> MealAbsence:
    absence = MealAbsence(stay_id=stay_id, **payload.model_dump())
    db.add(absence)
    db.flush()
    db.commit()
    db.refresh(absence)
    return absence


def delete_meal_absence(db: Session, absence: MealAbsence) -> None:
    db.delete(absence)
    db.commit()


# --- FORECAST & LOCK ENGINE ---

def get_daily_meal_forecast(
    db: Session, target_date: datetime.date
) -> DailyMealForecastResponse:
    """Calculate daily meal forecast breakdown for KTX residents and janitor lunch."""
    return MealCalculationEngine.calculate_daily_forecast(db, target_date)



def lock_meal_session(db: Session, payload: MealSessionLockCreate) -> MealSessionLock:
    """Lock or update snapshot for a specific meal session (BREAKFAST, LUNCH, DINNER)."""
    existing = (
        db.query(MealSessionLock)
        .filter(
            MealSessionLock.lock_date == payload.lock_date,
            MealSessionLock.meal_session == payload.meal_session,
        )
        .first()
    )
    if existing:
        existing.calculated_meal_count = payload.calculated_meal_count
        existing.final_meal_count = payload.final_meal_count
        existing.locked_price_per_meal = payload.locked_price_per_meal
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    lock_item = MealSessionLock(**payload.model_dump())
    db.add(lock_item)
    db.flush()
    db.commit()
    db.refresh(lock_item)
    return lock_item


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
