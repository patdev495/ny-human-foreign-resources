from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, String
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
