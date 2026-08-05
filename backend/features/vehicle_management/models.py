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


class RouteType(str, enum.Enum):
    FIXED_ROUTE = "FIXED_ROUTE"
    KM_BASED = "KM_BASED"


class VehicleProvider(Base):
    __tablename__ = "vehicle_providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(Unicode(200), nullable=False, index=True)
    provider_type: Mapped[OwnershipGroup] = mapped_column(
        Enum(OwnershipGroup), nullable=False, default=OwnershipGroup.OUTSOURCED
    )
    phone: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vehicles: Mapped[list[Vehicle]] = relationship("Vehicle", back_populates="provider")
    routes: Mapped[list[VendorRoute]] = relationship(
        "VendorRoute", back_populates="provider", cascade="all, delete-orphan"
    )


class VendorRoute(Base):
    __tablename__ = "vendor_routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vehicle_providers.id", ondelete="CASCADE"), nullable=False
    )
    purpose: Mapped[Optional[str]] = mapped_column(Unicode(200), nullable=True)
    pickup_location: Mapped[str] = mapped_column(Unicode(255), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(Unicode(255), nullable=False)
    seat_type: Mapped[str] = mapped_column(Unicode(50), nullable=False, default="4 chỗ")
    fixed_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    waiting_fee_per_hour: Mapped[float] = mapped_column(Float, default=30000.0, nullable=False)
    is_two_way_same_price: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    provider: Mapped[VehicleProvider] = relationship("VehicleProvider", back_populates="routes")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("vehicle_providers.id", ondelete="SET NULL"), nullable=True
    )
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

    provider: Mapped[Optional[VehicleProvider]] = relationship("VehicleProvider", back_populates="vehicles")
    dispatches: Mapped[list[VehicleDispatch]] = relationship(
        "VehicleDispatch", back_populates="vehicle", cascade="all, delete-orphan"
    )
    contract: Mapped[Optional[MonthlyVehicleContract]] = relationship(
        "MonthlyVehicleContract", back_populates="vehicle", uselist=False, cascade="all, delete-orphan"
    )
    odometer_logs: Mapped[list[DailyOdometerLog]] = relationship(
        "DailyOdometerLog", back_populates="vehicle", cascade="all, delete-orphan"
    )


class MonthlyVehicleContract(Base):
    __tablename__ = "monthly_vehicle_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    contract_name: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    base_monthly_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    km_allowance: Mapped[float] = mapped_column(Float, default=3000.0, nullable=False)
    excess_km_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    standard_start_time: Mapped[str] = mapped_column(Unicode(10), default="07:00", nullable=False)
    standard_end_time: Mapped[str] = mapped_column(Unicode(10), default="18:00", nullable=False)
    sunday_standard_start_time: Mapped[str] = mapped_column(Unicode(10), default="07:30", nullable=False)
    sunday_standard_end_time: Mapped[str] = mapped_column(Unicode(10), default="18:00", nullable=False)
    evening_fixed_bonus_start: Mapped[Optional[str]] = mapped_column(Unicode(10), nullable=True)  # e.g. "18:00"
    evening_fixed_bonus_end: Mapped[Optional[str]] = mapped_column(Unicode(10), nullable=True)    # e.g. "22:00" or "20:00"
    evening_fixed_bonus_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # e.g. 100000.0
    overtime_rate_weekday: Mapped[float] = mapped_column(Float, default=50000.0, nullable=False)
    overtime_rate_weekend: Mapped[float] = mapped_column(Float, default=50000.0, nullable=False)
    sunday_daily_rate: Mapped[float] = mapped_column(Float, default=1000000.0, nullable=False)
    holiday_daily_rate: Mapped[float] = mapped_column(Float, default=1200000.0, nullable=False)
    overnight_fee: Mapped[float] = mapped_column(Float, default=300000.0, nullable=False)
    meal_allowance_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vehicle: Mapped[Vehicle] = relationship("Vehicle", back_populates="contract")


class DailyOdometerLog(Base):
    __tablename__ = "daily_odometer_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date: Mapped[str] = mapped_column(Unicode(10), nullable=False, index=True)  # YYYY-MM-DD
    start_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    end_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    daily_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    start_photo_url: Mapped[Optional[str]] = mapped_column(Unicode(500), nullable=True)
    end_photo_url: Mapped[Optional[str]] = mapped_column(Unicode(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vehicle: Mapped[Vehicle] = relationship("Vehicle", back_populates="odometer_logs")



class VehicleDispatch(Base):
    __tablename__ = "vehicle_dispatches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dispatch_date: Mapped[str] = mapped_column(Unicode(10), nullable=False, index=True)  # YYYY-MM-DD
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("vehicle_providers.id", ondelete="SET NULL"), nullable=True
    )
    provider_name: Mapped[Optional[str]] = mapped_column(Unicode(200), nullable=True)
    vehicle_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )
    vehicle_name: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    ownership_group: Mapped[OwnershipGroup] = mapped_column(
        Enum(OwnershipGroup), nullable=False, default=OwnershipGroup.COMPANY_OWNED
    )
    driver_name: Mapped[Optional[str]] = mapped_column(Unicode(200), nullable=True)
    license_plate: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(Unicode(50), nullable=True)
    pickup_location: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    dropoff_location: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    pickup_time: Mapped[Optional[str]] = mapped_column(Unicode(20), nullable=True)
    return_time: Mapped[Optional[str]] = mapped_column(Unicode(20), nullable=True)
    passenger_name: Mapped[Optional[str]] = mapped_column(Unicode(255), nullable=True)
    passenger_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # Odometer fields (optional for company vehicles)
    start_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    odometer_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Pricing fields
    vendor_route_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("vendor_routes.id", ondelete="SET NULL"), nullable=True
    )
    route_type: Mapped[RouteType] = mapped_column(
        Enum(RouteType), nullable=False, default=RouteType.FIXED_ROUTE
    )
    distance_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    waiting_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    calculated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # final cost
    toll_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    meal_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    overnight_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(UnicodeText, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


    provider: Mapped[Optional[VehicleProvider]] = relationship("VehicleProvider")
    vehicle: Mapped[Optional[Vehicle]] = relationship("Vehicle", back_populates="dispatches")

