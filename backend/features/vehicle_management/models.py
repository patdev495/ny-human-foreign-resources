from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, Unicode, UnicodeText
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class OwnershipGroup(str, enum.Enum):
    COMPANY_OWNED = "COMPANY_OWNED"
    OUTSOURCED = "OUTSOURCED"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ownership_group: Mapped[OwnershipGroup] = mapped_column(
        Enum(OwnershipGroup), nullable=False, default=OwnershipGroup.COMPANY_OWNED
    )
    name: Mapped[str] = mapped_column(Unicode(200), nullable=False, index=True)
    driver_name: Mapped[Optional[str]] = mapped_column(Unicode(200), nullable=True)
    license_plate: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    default_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    dispatches: Mapped[list[VehicleDispatch]] = relationship(
        "VehicleDispatch", back_populates="vehicle", cascade="all, delete-orphan"
    )


class VehicleDispatch(Base):
    __tablename__ = "vehicle_dispatches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dispatch_date: Mapped[str] = mapped_column(Unicode(10), nullable=False, index=True)  # YYYY-MM-DD
    vehicle_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )
    vehicle_name: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    ownership_group: Mapped[OwnershipGroup] = mapped_column(
        Enum(OwnershipGroup), nullable=False, default=OwnershipGroup.COMPANY_OWNED
    )
    driver_name: Mapped[Optional[str]] = mapped_column(Unicode(200), nullable=True)
    license_plate: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    pickup_location: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    dropoff_location: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    pickup_time: Mapped[Optional[str]] = mapped_column(Unicode(20), nullable=True)
    passenger_name: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    passenger_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vehicle: Mapped[Optional[Vehicle]] = relationship("Vehicle", back_populates="dispatches")
