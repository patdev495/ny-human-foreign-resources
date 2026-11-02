from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class CutoffTime(BaseModel):
    time: str

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        import re

        if re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value) is None:
            raise ValueError("Use HH:MM in Vietnam time")
        return value


class RecipientSelection(BaseModel):
    ids: list[str] = Field(max_length=100)


class TestSendRequest(BaseModel):
    id: str = Field(min_length=1, max_length=100)
