from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import service
from features.hr_foreign.schemas import (
    DailyMealForecastResponse,
    DailyPresenceReportResponse,
    EventDayCreate,
    EventDayCreateBatch,
    EventDayRead,
    EventDayUpdate,
    MealAbsenceCreate,
    MealAbsenceRead,
    MealExpenseReportResponse,
    MealPriceConfigCreate,
    MealPriceConfigRead,
    MealPriceConfigUpdate,
    MealSessionLockCreate,
    MealSessionLockRead,
)

router = APIRouter()


# --- MEAL ABSENCES ENDPOINTS ---

@router.get("/stays/{stay_id}/meal-absences", response_model=list[MealAbsenceRead])
def list_meal_absences(stay_id: int, db: Session = Depends(get_db)) -> list[MealAbsenceRead]:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.get_meal_absences_by_stay(db, stay_id)


@router.post(
    "/stays/{stay_id}/meal-absences",
    response_model=MealAbsenceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_meal_absence(
    stay_id: int, payload: MealAbsenceCreate, db: Session = Depends(get_db)
) -> MealAbsenceRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.create_meal_absence(db, stay_id, payload)


@router.delete("/meal-absences/{abs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_absence(abs_id: int, db: Session = Depends(get_db)) -> None:
    absence = service.get_meal_absence_by_id(db, abs_id)
    if not absence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence not found")
    service.delete_meal_absence(db, absence)


# --- DAILY MEAL FORECAST & LOCK ENDPOINTS ---

@router.get("/meals/forecast", response_model=DailyMealForecastResponse)
def get_daily_meal_forecast(
    date: datetime.date = Query(...), db: Session = Depends(get_db)
) -> DailyMealForecastResponse:
    return service.get_daily_meal_forecast(db, target_date=date)


@router.post(
    "/meals/lock", response_model=MealSessionLockRead, status_code=status.HTTP_201_CREATED
)
def lock_meal_session(
    payload: MealSessionLockCreate, db: Session = Depends(get_db)
) -> MealSessionLockRead:
    return service.lock_meal_session(db, payload)


# --- EVENT DAYS ENDPOINTS ---

@router.get("/event-days", response_model=list[EventDayRead])
def list_event_days(db: Session = Depends(get_db)) -> list[EventDayRead]:
    return service.get_event_days(db)


@router.post(
    "/event-days", response_model=EventDayRead, status_code=status.HTTP_201_CREATED
)
def create_event_day(
    payload: EventDayCreate, db: Session = Depends(get_db)
) -> EventDayRead:
    existing = service.get_event_day_by_date(db, payload.event_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Event day already registered for this date"
        )
    return service.create_event_day(db, payload)


@router.post(
    "/event-days/batch",
    response_model=list[EventDayRead],
    status_code=status.HTTP_201_CREATED,
)
def create_event_days_batch(
    payload: EventDayCreateBatch, db: Session = Depends(get_db)
) -> list[EventDayRead]:
    try:
        return service.create_event_days_batch(db, payload)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        )


@router.put("/event-days/{ev_id}", response_model=EventDayRead)
def update_event_day(
    ev_id: int, payload: EventDayUpdate, db: Session = Depends(get_db)
) -> EventDayRead:
    ev = service.get_event_day_by_id(db, ev_id)
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event day not found")
    if payload.event_date and payload.event_date != ev.event_date:
        existing = service.get_event_day_by_date(db, payload.event_date)
        if existing and existing.id != ev_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Event day already registered for this date"
            )
    return service.update_event_day(db, ev, payload)


@router.delete("/event-days/{ev_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_day(ev_id: int, db: Session = Depends(get_db)) -> None:
    ev = service.get_event_day_by_id(db, ev_id)
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event day not found")
    service.delete_event_day(db, ev)


# --- MEAL PRICE CONFIGS ENDPOINTS ---

@router.get("/meal-price-configs", response_model=list[MealPriceConfigRead])
def list_meal_price_configs(db: Session = Depends(get_db)) -> list[MealPriceConfigRead]:
    return service.get_meal_price_configs(db)


@router.post(
    "/meal-price-configs",
    response_model=MealPriceConfigRead,
    status_code=status.HTTP_201_CREATED,
)
def create_meal_price_config(
    payload: MealPriceConfigCreate, db: Session = Depends(get_db)
) -> MealPriceConfigRead:
    return service.create_meal_price_config(db, payload)


@router.put("/meal-price-configs/{config_id}", response_model=MealPriceConfigRead)
def update_meal_price_config(
    config_id: int, payload: MealPriceConfigUpdate, db: Session = Depends(get_db)
) -> MealPriceConfigRead:
    cfg = service.get_meal_price_config_by_id(db, config_id)
    if not cfg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal price config not found")
    return service.update_meal_price_config(db, cfg, payload)


@router.delete("/meal-price-configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_price_config(config_id: int, db: Session = Depends(get_db)) -> None:
    cfg = service.get_meal_price_config_by_id(db, config_id)
    if not cfg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal price config not found")
    service.delete_meal_price_config(db, cfg)


# --- MEAL EXPENSE REPORTS ENDPOINT ---

@router.get("/reports/meal-expenses", response_model=MealExpenseReportResponse)
def get_meal_expense_report(
    start_date: datetime.date = Query(...),
    end_date: datetime.date = Query(...),
    db: Session = Depends(get_db),
) -> MealExpenseReportResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="start_date cannot be after end_date"
        )
    return service.calculate_meal_expenses(db, start_date=start_date, end_date=end_date)


# --- DAILY PRESENCE REPORTS ENDPOINT ---

@router.get("/reports/daily-presence", response_model=DailyPresenceReportResponse)
def get_daily_presence_report(
    target_date: datetime.date = Query(default_factory=datetime.date.today),
    db: Session = Depends(get_db),
) -> DailyPresenceReportResponse:
    return service.get_daily_presence_report(db, target_date=target_date)
