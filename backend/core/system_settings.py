from __future__ import annotations

from datetime import time

from sqlalchemy import String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from core.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(100), nullable=False)


def get_time_setting(db: Session, key: str, default: str) -> time:
    value = db.scalar(select(SystemSetting.value).where(SystemSetting.key == key))
    return time.fromisoformat(value or default)


def set_time_setting(db: Session, key: str, value: time) -> None:
    row = db.get(SystemSetting, key)
    if row is None:
        db.add(SystemSetting(key=key, value=value.strftime("%H:%M")))
    else:
        row.value = value.strftime("%H:%M")
    db.commit()
