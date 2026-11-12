from __future__ import annotations

from sqlalchemy.orm import Session

from core.notifications import NotificationTarget
from features.telegram_reminder.client import TelegramClient, TelegramRejected
from features.telegram_reminder.models import TelegramBot, selected_recipients_query


def notification_targets(db: Session) -> list[NotificationTarget]:
    bot = db.get(TelegramBot, "current")
    if bot is None:
        return []
    client = TelegramClient()
    token = bot.token
    return [NotificationTarget(
        channel="telegram", recipient_id=person.user_id, name=person.name,
        send=lambda message, chat_id=person.chat_id: client.send(token, chat_id, message),
        rejected=(TelegramRejected,),
    ) for person in db.scalars(selected_recipients_query()).all()]
