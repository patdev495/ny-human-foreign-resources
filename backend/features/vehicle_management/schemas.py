from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from features.vehicle_management.models import OwnershipGroup


class VehicleBase(BaseModel):
    ownership_group: OwnershipGroup = OwnershipGroup.COMPANY_OWNED
    name: str
    driver_name: Optional[str] = None
    license_plate: Optional[str] = None
    driver_phone: Optional[str] = None
    default_cost: float = 0.0
    is_active: bool = True


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehicleDispatchBase(BaseModel):
    dispatch_date: str
    vehicle_id: Optional[int] = None
    vehicle_name: str
    ownership_group: OwnershipGroup = OwnershipGroup.COMPANY_OWNED
    driver_name: Optional[str] = None
    license_plate: Optional[str] = None
    pickup_location: Optional[str] = None
    dropoff_location: Optional[str] = None
    pickup_time: Optional[str] = None
    passenger_name: Optional[str] = None
    passenger_count: int = 1
    cost: float = 0.0
    notes: Optional[str] = None


class VehicleDispatchCreate(VehicleDispatchBase):
    pass


class VehicleDispatchUpdate(VehicleDispatchBase):
    pass


class VehicleDispatchResponse(VehicleDispatchBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
