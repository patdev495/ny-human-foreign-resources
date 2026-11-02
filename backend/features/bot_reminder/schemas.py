from __future__ import annotations

import re

from pydantic import BaseModel, field_validator


class CutoffTime(BaseModel):
    time: str

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value) is None:
            raise ValueError("Use HH:MM in Vietnam time")
        return value
