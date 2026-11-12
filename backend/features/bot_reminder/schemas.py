from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CutoffTime(BaseModel):
    time: str

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value) is None:
            raise ValueError("Use HH:MM in Vietnam time")
        return value


class TestMessageResult(BaseModel):
    message_type: Literal["PRE", "CUTOFF"]
    status: Literal["SENT", "FAILED"]
    error: str = ""


class TravelReminderConfig(CutoffTime):
    enabled: bool = True
    days_before: int = Field(default=3, ge=0, le=365, strict=True)
    time: str = "08:00"


class TestSendResponse(BaseModel):
    status: Literal["SENT", "FAILED"]
    results: list[TestMessageResult]
