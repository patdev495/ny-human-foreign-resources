from __future__ import annotations

import datetime
from sqlalchemy.orm import Session

from features.hr_foreign.models import EmailDeliveryLog, EmailNotificationConfig


def get_email_notification_config(
    db: Session, config_key: str = "DOC_WARNING"
) -> EmailNotificationConfig:
    cfg = (
        db.query(EmailNotificationConfig)
        .filter(EmailNotificationConfig.config_key == config_key)
        .first()
    )
    if not cfg:
        cfg = EmailNotificationConfig(
            config_key=config_key,
            recipient_emails="",
            is_enabled=True,
            scheduled_time="08:00",
        )
        db.add(cfg)
        db.flush()
        db.commit()
        db.refresh(cfg)
    return cfg


def update_email_notification_config(
    db: Session,
    recipient_emails: str | None = None,
    is_enabled: bool | None = None,
    scheduled_time: str | None = None,
    config_key: str = "DOC_WARNING",
) -> EmailNotificationConfig:
    cfg = get_email_notification_config(db, config_key=config_key)
    if recipient_emails is not None:
        cfg.recipient_emails = recipient_emails
    if is_enabled is not None:
        cfg.is_enabled = is_enabled
    if scheduled_time is not None:
        cfg.scheduled_time = scheduled_time
    db.commit()
    db.refresh(cfg)
    return cfg


def create_email_delivery_log(
    db: Session,
    trigger_type: str = "AUTO",
    recipients: str | None = None,
    total_expired_docs: int = 0,
    total_expiring_docs: int = 0,
    status: str = "SUCCESS",
    error_message: str | None = None,
) -> EmailDeliveryLog:
    log_entry = EmailDeliveryLog(
        sent_at=datetime.datetime.now(),
        trigger_type=trigger_type,
        recipients=recipients,
        total_expired_docs=total_expired_docs,
        total_expiring_docs=total_expiring_docs,
        status=status,
        error_message=error_message,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def get_email_delivery_logs(db: Session, limit: int = 20) -> list[EmailDeliveryLog]:
    return (
        db.query(EmailDeliveryLog)
        .order_by(EmailDeliveryLog.sent_at.desc())
        .limit(limit)
        .all()
    )
