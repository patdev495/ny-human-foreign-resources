from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, String, Unicode, UnicodeText
from sqlalchemy.dialects.mssql import DATE as MSSQLDate
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class ZaloRecipient(Base):
    __tablename__ = "zalo_reminder_recipients"

    zalo_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    display_name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    selected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ZaloDeliveryLog(Base):
    __tablename__ = "zalo_reminder_delivery_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    zalo_id: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(16), nullable=False)
    message_type: Mapped[str] = mapped_column(String(16), nullable=False, default="CUTOFF")
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    error: Mapped[str] = mapped_column(UnicodeText, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ZaloDailyDelivery(Base):
    __tablename__ = "zalo_reminder_daily_deliveries"

    delivery_date: Mapped[date] = mapped_column(Date().with_variant(MSSQLDate(), "mssql"), primary_key=True)
    zalo_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    display_name: Mapped[str] = mapped_column(Unicode(150), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    error: Mapped[str] = mapped_column(UnicodeText, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
