from __future__ import annotations

from pydantic import BaseModel, Field
from features.bot_reminder.schemas import CutoffTime


class RecipientSelection(BaseModel):
    ids: list[str] = Field(max_length=100)


class TestSendRequest(BaseModel):
    id: str = Field(min_length=1, max_length=100)
