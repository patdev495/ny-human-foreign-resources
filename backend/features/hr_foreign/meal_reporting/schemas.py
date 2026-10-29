from __future__ import annotations

import datetime as dt

from pydantic import BaseModel


class PublicPerson(BaseModel):
    id: int
    name_latin: str
    name_chinese: str | None
    room_number: str | None
    status: str
    can_report: bool


class MealSelection(BaseModel):
    breakfast: bool
    dinner: bool


class MealReportSubmission(MealSelection):
    employee_id: int
    meal_date: dt.date


class MealReportView(BaseModel):
    employee_id: int
    meal_date: dt.date
    current: MealSelection | None


class MealReportRevisionView(MealSelection):
    submitted_at: dt.datetime


class HrMealReportView(MealReportView):
    history: list[MealReportRevisionView]
