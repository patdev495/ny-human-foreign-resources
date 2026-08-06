from __future__ import annotations

import datetime
from sqlalchemy.orm import Session
from features.hr_foreign.schemas import (
    DailyMealForecastResponse,
    MealExpenseReportResponse,
)
from .meal_engine.meal_forecast_calculator import (
    calculate_daily_forecast,
    get_prices_for_date,
    seed_default_meal_prices,
)
from .meal_engine.meal_expense_calculator import (
    calculate_expense_report,
)


class MealCalculationEngine:
    """Deep module facade for all KTX meal calculations, price resolution, and locking logic."""

    @staticmethod
    def seed_default_meal_prices(db: Session) -> None:
        seed_default_meal_prices(db)

    @classmethod
    def get_prices_for_date(
        cls, db: Session, target_date: datetime.date, day_type: str
    ) -> tuple[float, float, float]:
        return get_prices_for_date(db, target_date, day_type)

    @classmethod
    def calculate_daily_forecast(
        cls, db: Session, target_date: datetime.date
    ) -> DailyMealForecastResponse:
        return calculate_daily_forecast(db, target_date)

    @classmethod
    def calculate_expense_report(
        cls, db: Session, start_date: datetime.date, end_date: datetime.date
    ) -> MealExpenseReportResponse:
        return calculate_expense_report(db, start_date, end_date)
