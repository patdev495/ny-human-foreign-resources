from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.notifications import NotificationTarget
from features.zalo_reminder.client import BotClient, BotUnavailable
from features.zalo_reminder.models import ZaloRecipient


def notification_targets(db: Session) -> list[NotificationTarget]:
    client = BotClient()
    try:
        if not client.status()["connected"]:
            return []
    except BotUnavailable:
        return []
    return [NotificationTarget(
        channel="zalo", recipient_id=person.zalo_id, name=person.display_name,
        send=lambda message, recipient_id=person.zalo_id: client.send(recipient_id, message),
    ) for person in db.scalars(select(ZaloRecipient).order_by(ZaloRecipient.zalo_id)).all()]
