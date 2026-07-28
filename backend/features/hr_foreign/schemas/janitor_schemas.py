from __future__ import annotations

import datetime
from pydantic import BaseModel, ConfigDict, Field


class JanitorAttendanceCreate(BaseModel):
    employee_id: int
    attendance_date: datetime.date
    absence_type: str = Field(..., description="'FULL_DAY' or 'HALF_DAY'")
    reason: str | None = None


class JanitorAttendanceRangeCreate(BaseModel):
    employee_id: int
    start_date: datetime.date
    end_date: datetime.date
    absence_type: str = Field(..., description="'FULL_DAY' or 'HALF_DAY'")
    reason: str | None = None


class JanitorAttendanceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: int
    employee_code: str | None = None
    name_latin: str
    name_chinese: str | None = None
    workplace_location: str | None = None
    status: str = "PRESENT"  # "PRESENT" | "ABSENT"
    absence_type: str | None = None  # "FULL_DAY" | "HALF_DAY" | None
    reason: str | None = None


class JanitorDailyAttendanceSheet(BaseModel):
    date: datetime.date
    total_count: int = 0
    present_count: int = 0
    full_day_absence_count: int = 0
    half_day_absence_count: int = 0
    items: list[JanitorAttendanceItem] = []
