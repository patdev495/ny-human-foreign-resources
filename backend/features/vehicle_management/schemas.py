from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from features.vehicle_management.models import OwnershipGroup, RouteType


class VehicleProviderBase(BaseModel):
    name: str
    provider_type: OwnershipGroup = OwnershipGroup.OUTSOURCED
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class VehicleProviderCreate(VehicleProviderBase):
    pass


class VehicleProviderUpdate(VehicleProviderBase):
    pass


class VehicleProviderResponse(VehicleProviderBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VendorRouteBase(BaseModel):
    provider_id: int
    purpose: Optional[str] = None
    pickup_location: str
    dropoff_location: str
    seat_type: str = "4 chỗ"
    fixed_price: float = 0.0
    waiting_fee_per_hour: float = 30000.0
    is_two_way_same_price: bool = True
    notes: Optional[str] = None


class VendorRouteCreate(VendorRouteBase):
    pass


class VendorRouteUpdate(VendorRouteBase):
    pass


class VendorRouteResponse(VendorRouteBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehicleBase(BaseModel):
    provider_id: Optional[int] = None
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


class CalculateCostRequest(BaseModel):
    provider_id: Optional[int] = None
    vendor_route_id: Optional[int] = None
    route_type: RouteType = RouteType.FIXED_ROUTE
    seat_type: Optional[str] = "4 chỗ"
    distance_km: float = 0.0
    waiting_hours: float = 0.0


class CalculateCostResponse(BaseModel):
    base_cost: float
    waiting_cost: float
    total_calculated_cost: float


class VehicleDispatchBase(BaseModel):
    dispatch_date: str
    provider_id: Optional[int] = None
    provider_name: Optional[str] = None
    vehicle_id: Optional[int] = None
    vehicle_name: str
    ownership_group: OwnershipGroup = OwnershipGroup.COMPANY_OWNED
    driver_name: Optional[str] = None
    license_plate: Optional[str] = None
    driver_phone: Optional[str] = None
    pickup_location: Optional[str] = None
    dropoff_location: Optional[str] = None
    pickup_time: Optional[str] = None
    return_time: Optional[str] = None
    passenger_name: Optional[str] = None
    passenger_count: int = 1

    start_km: Optional[float] = None
    end_km: Optional[float] = None
    odometer_km: Optional[float] = None

    vendor_route_id: Optional[int] = None
    route_type: RouteType = RouteType.FIXED_ROUTE
    distance_km: float = 0.0
    waiting_hours: float = 0.0
    calculated_cost: float = 0.0
    cost: float = 0.0
    toll_fee: float = 0.0
    meal_count: int = 0
    overnight_count: int = 0
    notes: Optional[str] = None



class VehicleDispatchCreate(VehicleDispatchBase):
    pass


class VehicleDispatchUpdate(VehicleDispatchBase):
    pass


class VehicleDispatchResponse(VehicleDispatchBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MonthlyVehicleContractBase(BaseModel):
    vehicle_id: int
    contract_name: str
    base_monthly_cost: float = 0.0
    km_allowance: float = 3000.0
    excess_km_rate: float = 0.0
    standard_start_time: str = "07:00"
    standard_end_time: str = "18:00"
    sunday_standard_start_time: str = "07:30"
    sunday_standard_end_time: str = "18:00"
    evening_fixed_bonus_start: Optional[str] = None
    evening_fixed_bonus_end: Optional[str] = None
    evening_fixed_bonus_amount: float = 0.0
    overtime_rate_weekday: float = 50000.0
    overtime_rate_weekend: float = 50000.0
    sunday_daily_rate: float = 1000000.0
    holiday_daily_rate: float = 1200000.0
    overnight_fee: float = 300000.0
    meal_allowance_fee: float = 0.0
    notes: Optional[str] = None


class MonthlyVehicleContractCreate(MonthlyVehicleContractBase):
    pass


class MonthlyVehicleContractUpdate(MonthlyVehicleContractBase):
    pass


class MonthlyVehicleContractResponse(MonthlyVehicleContractBase):
    id: int
    vehicle_name: Optional[str] = None
    license_plate: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyOdometerLogBase(BaseModel):
    vehicle_id: int
    log_date: str
    start_km: float = 0.0
    end_km: float = 0.0
    daily_km: float = 0.0
    start_photo_url: Optional[str] = None
    end_photo_url: Optional[str] = None
    notes: Optional[str] = None


class DailyOdometerLogCreate(DailyOdometerLogBase):
    pass


class DailyOdometerLogUpdate(DailyOdometerLogBase):
    pass


class DailyOdometerLogResponse(DailyOdometerLogBase):
    id: int
    vehicle_name: Optional[str] = None
    license_plate: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MonthlyReconciliationItemResponse(BaseModel):
    vehicle_id: int
    vehicle_name: str
    license_plate: Optional[str] = None
    contract_name: str
    base_monthly_cost: float
    km_allowance: float
    excess_km_rate: float
    total_month_km: float
    excess_km: float
    excess_km_cost: float
    overtime_hours: float = 0.0
    overtime_cost: float = 0.0
    surcharges_cost: float = 0.0
    total_cost: float



