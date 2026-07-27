from __future__ import annotations

import datetime
from pydantic import BaseModel, ConfigDict


class EmailConfigRead(BaseModel):
    id: int
    config_key: str
    recipient_emails: str | None = None
    is_enabled: bool = True
    scheduled_time: str = "08:00"
    last_sent_at: datetime.datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class EmailConfigUpdate(BaseModel):
    recipient_emails: str | None = None
    is_enabled: bool | None = None
    scheduled_time: str | None = None


class TestEmailRequest(BaseModel):
    to_email: str


class TestEmailResponse(BaseModel):
    success: bool
    message: str


class TriggerWarningEmailResponse(BaseModel):
    success: bool
    message: str
    total_expired_docs: int = 0
    total_expiring_docs: int = 0


class EmailDeliveryLogRead(BaseModel):
    id: int
    sent_at: datetime.datetime
    trigger_type: str
    recipients: str | None = None
    total_expired_docs: int = 0
    total_expiring_docs: int = 0
    status: str
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)
