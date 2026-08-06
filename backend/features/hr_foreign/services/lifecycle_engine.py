from __future__ import annotations

import datetime
from typing import Any
from sqlalchemy.orm import Session
from features.hr_foreign.models import ForeignEmployee
from features.hr_foreign.schemas import ForeignEmployeeRead
from features.hr_foreign.status_engine.presence_calculator import (
    evaluate_employee_statuses as _evaluate_presence,
)


class EmployeeLifecycleEngine:
    """Deep module for Foreign Employee stay lifecycle, exit date warnings, and presence evaluation."""

    @classmethod
    def evaluate_employee_lifecycle(
        cls, db: Session, employees: list[ForeignEmployee], today: datetime.date | None = None
    ) -> list[ForeignEmployeeRead]:
        """Evaluate full stay lifecycle status and legal document expirations for a list of employees."""
        if today is None:
            today = datetime.date.today()
        return _evaluate_presence(db, employees, today=today)

    @classmethod
    def resolve_stay_status_label(
        cls, is_in_vietnam: bool, is_overdue_exit: bool, actual_exit_date: datetime.date | None = None
    ) -> str:
        """Resolve human-readable stay lifecycle label matching CONTEXT.md terminology."""
        if is_overdue_exit:
            return "Cảnh báo quá hạn về nước"
        if is_in_vietnam:
            return "Đang ở Việt Nam"
        return "Đã về nước"
