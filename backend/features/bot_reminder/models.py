from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, String, Unicode, UnicodeText
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class ChannelDay(Base):
    __tablename__ = "bot_reminder_channel_days"

    channel: Mapped[str] = mapped_column(String(16), primary_key=True)
    delivery_date: Mapped[date] = mapped_column(Date, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)


class ChannelChange(Base):
    __tablename__ = "bot_reminder_channel_changes"

    channel: Mapped[str] = mapped_column(String(16), primary_key=True)
    effective_date: Mapped[date] = mapped_column(Date, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)


class PreReminderDelivery(Base):
    __tablename__ = "bot_pre_reminder_deliveries"

    channel: Mapped[str] = mapped_column(String(16), primary_key=True)
    delivery_date: Mapped[date] = mapped_column(Date, primary_key=True)
    recipient_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    display_name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    error: Mapped[str] = mapped_column(UnicodeText, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
