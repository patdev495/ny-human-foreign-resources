from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, String, Unicode, UnicodeText, select, true
from sqlalchemy.sql import Select
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class TelegramBot(Base):
    __tablename__ = "telegram_reminder_bot"

    key: Mapped[str] = mapped_column(String(10), primary_key=True, default="current")
    bot_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    token: Mapped[str] = mapped_column(String(200), nullable=False)
    webhook_secret: Mapped[str] = mapped_column(String(100), nullable=False)


class TelegramRecipient(Base):
    __tablename__ = "telegram_reminder_recipients"

    user_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    chat_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    selected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


def selected_recipients_query() -> Select[tuple[TelegramRecipient]]:
    return select(TelegramRecipient).where(TelegramRecipient.selected == true())


class TelegramDeliveryLog(Base):
    __tablename__ = "telegram_reminder_delivery_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    bot_id: Mapped[str] = mapped_column(String(50), nullable=False)
    user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    error: Mapped[str] = mapped_column(UnicodeText, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class TelegramDailyDelivery(Base):
    __tablename__ = "telegram_reminder_daily_deliveries"

    delivery_date: Mapped[date] = mapped_column(Date, primary_key=True)
    bot_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    chat_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    error: Mapped[str] = mapped_column(UnicodeText, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
