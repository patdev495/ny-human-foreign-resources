from __future__ import annotations

import datetime
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    ForeignEmployee,
    JanitorAttendanceRecord,
    MealAbsence,
    MealExtra,
    MealPriceConfig,
    MealSessionLock,
    MealSessionLockRevision,
    Stay,
)
from features.hr_foreign.schemas import (
    DailyMealEmployeeItem,
    DailyMealForecastResponse,
    DailyMealSessionSummary,
    MealAbsenceCreate,
    MealExtraCreate,
    MealPriceConfigCreate,
    MealPriceConfigUpdate,
    MealSessionLockCreate,
)


from .meal_calculation_engine import MealCalculationEngine
from features.hr_foreign.meal_reporting import rules
from features.hr_foreign.services.meal_engine.meal_forecast_calculator import uses_meal_reports


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
    _require_legacy_meal_date(payload.absence_date)
    absence = MealAbsence(stay_id=stay_id, **payload.model_dump())
    db.add(absence)
    db.flush()
    db.commit()
    db.refresh(absence)
    return absence


def delete_meal_absence(db: Session, absence: MealAbsence) -> None:
    _require_legacy_meal_date(absence.absence_date)
    db.delete(absence)
    db.commit()


# --- MEAL EXTRA CRUD ---

def get_meal_extras_by_stay(db: Session, stay_id: int) -> list[MealExtra]:
    return db.query(MealExtra).filter(MealExtra.stay_id == stay_id).all()


def get_meal_extra_by_id(db: Session, extra_id: int) -> MealExtra | None:
    return db.query(MealExtra).filter(MealExtra.id == extra_id).first()


def create_meal_extra(db: Session, stay_id: int, payload: MealExtraCreate) -> MealExtra:
    _require_legacy_meal_date(payload.extra_date)
    extra = MealExtra(stay_id=stay_id, **payload.model_dump())
    db.add(extra)
    db.flush()
    db.commit()
    db.refresh(extra)
    return extra


def delete_meal_extra(db: Session, extra: MealExtra) -> None:
    _require_legacy_meal_date(extra.extra_date)
    db.delete(extra)
    db.commit()


def _require_legacy_meal_date(meal_date: datetime.date) -> None:
    if uses_meal_reports(meal_date):
        raise HTTPException(status_code=422, detail="Bữa sáng/tối ngày này lấy từ Báo cơm; HR chỉ được điều chỉnh tổng suất khi chốt bữa")


# --- FORECAST & LOCK ENGINE ---

def get_daily_meal_forecast(
    db: Session, target_date: datetime.date
) -> DailyMealForecastResponse:
    """Calculate daily meal forecast breakdown for KTX residents and janitor lunch."""
    return MealCalculationEngine.calculate_daily_forecast(db, target_date)



def lock_meal_session(db: Session, payload: MealSessionLockCreate) -> MealSessionLock:
    """Lock a session and retain every new-workflow breakfast/dinner snapshot."""
    if payload.meal_session not in {"BREAKFAST", "LUNCH", "DINNER"}:
        raise HTTPException(status_code=422, detail="Invalid meal session")
    if payload.final_meal_count < 0 or payload.locked_price_per_meal <= 0:
        raise HTTPException(status_code=422, detail="Invalid count or price")

    new_foreign_workflow = payload.meal_session in {"BREAKFAST", "DINNER"} and uses_meal_reports(payload.lock_date)
    now = rules.now_vietnam()
    if new_foreign_workflow:
        earliest = datetime.datetime.combine(
            payload.lock_date - datetime.timedelta(days=1), datetime.time(17), tzinfo=now.tzinfo
        )
        if now < earliest:
            raise HTTPException(status_code=422, detail="Chỉ được chốt từ 17h ngày hôm trước")
        forecast = get_daily_meal_forecast(db, payload.lock_date)
        suggested = forecast.breakfast.calculated_meal_count if payload.meal_session == "BREAKFAST" else forecast.dinner.calculated_meal_count
        if payload.calculated_meal_count != suggested:
            raise HTTPException(status_code=422, detail="Số suất đề xuất đã thay đổi; hãy tải lại dự báo")
        suggested_price = (
            forecast.suggested_breakfast_price if payload.meal_session == "BREAKFAST"
            else forecast.suggested_dinner_price
        )
        if payload.locked_price_per_meal != suggested_price:
            raise HTTPException(status_code=422, detail="Đơn giá đã thay đổi; hãy tải lại dự báo")

    existing = (
        db.query(MealSessionLock)
        .filter(
            MealSessionLock.lock_date == payload.lock_date,
            MealSessionLock.meal_session == payload.meal_session,
        )
        .first()
    )
    if new_foreign_workflow and (existing is not None or payload.final_meal_count != suggested) and not (payload.notes or "").strip():
        raise HTTPException(status_code=422, detail="Cần nhập lý do khi điều chỉnh hoặc chốt lại")
    locked_at = now.replace(tzinfo=None)
    if existing:
        existing.calculated_meal_count = payload.calculated_meal_count
        existing.final_meal_count = payload.final_meal_count
        existing.locked_price_per_meal = payload.locked_price_per_meal
        existing.notes = payload.notes
        if new_foreign_workflow:
            existing.locked_at = locked_at
            existing.locked_by = payload.locked_by
            db.add(MealSessionLockRevision(
                lock_id=existing.id, lock_date=existing.lock_date, meal_session=existing.meal_session,
                calculated_meal_count=existing.calculated_meal_count,
                final_meal_count=existing.final_meal_count,
                locked_price_per_meal=existing.locked_price_per_meal,
                locked_at=locked_at, locked_by=existing.locked_by, notes=existing.notes,
            ))
        db.commit()
        db.refresh(existing)
        return existing

    lock_item = MealSessionLock(**payload.model_dump())
    if new_foreign_workflow:
        lock_item.locked_at = locked_at
    db.add(lock_item)
    db.flush()
    if new_foreign_workflow:
        db.add(MealSessionLockRevision(
            lock_id=lock_item.id, lock_date=lock_item.lock_date, meal_session=lock_item.meal_session,
            calculated_meal_count=lock_item.calculated_meal_count,
            final_meal_count=lock_item.final_meal_count,
            locked_price_per_meal=lock_item.locked_price_per_meal,
            locked_at=locked_at, locked_by=lock_item.locked_by, notes=lock_item.notes,
        ))
    db.commit()
    db.refresh(lock_item)
    return lock_item


def get_meal_lock_history(
    db: Session, lock_date: datetime.date, meal_session: str
) -> list[MealSessionLockRevision]:
    return (db.query(MealSessionLockRevision)
        .filter(MealSessionLockRevision.lock_date == lock_date, MealSessionLockRevision.meal_session == meal_session)
        .order_by(MealSessionLockRevision.id).all())


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
