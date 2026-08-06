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
from .meal_calculation_engine import MealCalculationEngine


def calculate_meal_expenses(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> MealExpenseReportResponse:
    """Calculate aggregate meal expense report items for a date range."""
    return MealCalculationEngine.calculate_expense_report(db, start_date, end_date)

