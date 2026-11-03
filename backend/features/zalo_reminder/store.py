from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from features.zalo_reminder.models import ZaloDeliveryLog, ZaloRecipient


class RecipientStore:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_recipients(self) -> list[dict[str, str]]:
        rows = self.db.scalars(select(ZaloRecipient).order_by(ZaloRecipient.display_name)).all()
        return [{"id": row.zalo_id, "name": row.display_name} for row in rows]

    def replace_recipients(self, people: list[dict[str, str]]) -> None:
        existing = {row.zalo_id: row for row in self.db.scalars(select(ZaloRecipient)).all()}
        ids = {person["id"] for person in people}
        for row in existing.values():
            if row.zalo_id not in ids:
                self.db.delete(row)
        for person in people:
            row = existing.get(person["id"])
            if row is None:
                self.db.add(ZaloRecipient(zalo_id=person["id"], display_name=person["name"]))
            else:
                row.display_name = person["name"]
        self.db.commit()

    def record_delivery(self, id: str, name: str, status: str, error: str = "",
                        message_type: str = "CUTOFF") -> None:
        self.db.add(ZaloDeliveryLog(
            zalo_id=id, display_name=name, trigger_type="TEST", status=status, error=error,
            message_type=message_type,
        ))
        self.db.commit()

    def list_deliveries(self) -> list[dict[str, str]]:
        rows = self.db.scalars(select(ZaloDeliveryLog).order_by(
            ZaloDeliveryLog.created_at.desc(), ZaloDeliveryLog.id.desc(),
        ).limit(30)).all()
        return [
            {"id": row.zalo_id, "name": row.display_name, "status": row.status,
             "error": row.error, "trigger_type": row.trigger_type, "message_type": row.message_type,
             "created_at": row.created_at.isoformat() + "Z"}
            for row in rows
        ]


def get_recipient_store(db: Session = Depends(get_db)) -> RecipientStore:
    return RecipientStore(db)
