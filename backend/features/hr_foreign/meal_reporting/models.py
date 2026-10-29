from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, UniqueConstraint

from core.database import Base


class MealReport(Base):
    __tablename__ = "meal_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    meal_date = Column(Date, nullable=False, index=True)
    breakfast = Column(Boolean, nullable=False)
    dinner = Column(Boolean, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=dt.datetime.now)

    __table_args__ = (UniqueConstraint("employee_id", "meal_date", name="uq_meal_reports_employee_date"), {"implicit_returning": False})


class MealReportRevision(Base):
    __tablename__ = "meal_report_revisions"
    __table_args__ = {"implicit_returning": False}

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("meal_reports.id"), nullable=False, index=True)
    breakfast = Column(Boolean, nullable=False)
    dinner = Column(Boolean, nullable=False)
    submitted_at = Column(DateTime, nullable=False)
