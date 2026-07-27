from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import service
from features.hr_foreign.schemas import (
    EmailConfigRead,
    EmailConfigUpdate,
    EmailDeliveryLogRead,
    TestEmailRequest,
    TestEmailResponse,
    TriggerWarningEmailResponse,
)
from features.hr_foreign.services import email_service

router = APIRouter()


@router.get("/email-config", response_model=EmailConfigRead)
def get_email_config(db: Session = Depends(get_db)) -> EmailConfigRead:
    return service.get_email_notification_config(db)


@router.put("/email-config", response_model=EmailConfigRead)
def update_email_config(
    payload: EmailConfigUpdate, db: Session = Depends(get_db)
) -> EmailConfigRead:
    return service.update_email_notification_config(
        db,
        recipient_emails=payload.recipient_emails,
        is_enabled=payload.is_enabled,
        scheduled_time=payload.scheduled_time,
    )


@router.post("/email-config/send-test", response_model=TestEmailResponse)
def send_test_email(
    payload: TestEmailRequest, db: Session = Depends(get_db)
) -> TestEmailResponse:
    success, message = email_service.send_test_email(payload.to_email)
    return TestEmailResponse(success=success, message=message)


@router.post("/email-config/trigger-now", response_model=TriggerWarningEmailResponse)
def trigger_warning_email_now(
    db: Session = Depends(get_db),
) -> TriggerWarningEmailResponse:
    success, message, log = email_service.send_daily_doc_warning_digest(
        db, trigger_type="MANUAL"
    )
    return TriggerWarningEmailResponse(
        success=success,
        message=message,
        total_expired_docs=log.total_expired_docs if log else 0,
        total_expiring_docs=log.total_expiring_docs if log else 0,
    )


@router.get("/email-delivery-logs", response_model=list[EmailDeliveryLogRead])
def get_email_delivery_logs(
    db: Session = Depends(get_db),
) -> list[EmailDeliveryLogRead]:
    return service.get_email_delivery_logs(db, limit=20)
