from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Any


@dataclass
class MonthlyLeasedPricingResult:
    vehicle_type: str  # PASSENGER_7SEATER or TRUCK_8TON
    base_monthly_rate: float
    included_km: int
    overage_km_rate: float
    total_actual_km: float
    overage_km: float
    overage_km_cost: float
    overtime_hours: float
    overtime_cost: float
    sunday_days_count: int
    sunday_cost: float
    holiday_days_count: int
    holiday_cost: float
    overnight_count: int
    overnight_cost: float
    meal_count: int
    meal_cost: float
    toll_fee: float
    total_cost: float


class MonthlyLeasedContractAdapter:
    """Adapter for Monthly Leased Vehicle Contracts (Duc Anh Innovations 7-seater & CNHTC 8-ton truck)."""

    SEVEN_SEATER_BASE_RATE = 25_000_000.0
    SEVEN_SEATER_INCLUDED_KM = 3000
    SEVEN_SEATER_OVERAGE_KM_RATE = 6500.0

    TRUCK_8TON_BASE_RATE = 42_000_000.0
    TRUCK_8TON_INCLUDED_KM = 3000
    TRUCK_8TON_OVERAGE_KM_RATE = 10000.0

    SUNDAY_DAILY_RATE = 1_000_000.0
    HOLIDAY_DAILY_RATE = 1_200_000.0
    OVERNIGHT_DAILY_RATE = 300_000.0
    TRUCK_MEAL_RATE = 50_000.0
    OVERTIME_HOURLY_RATE = 50_000.0

    @classmethod
    def calculate_monthly_bill(
        cls,
        vehicle_type: str,
        total_actual_km: float,
        overtime_hours: float = 0.0,
        sunday_days_count: int = 0,
        holiday_days_count: int = 0,
        overnight_count: int = 0,
        meal_count: int = 0,
        toll_fee: float = 0.0,
    ) -> MonthlyLeasedPricingResult:
        """Calculate complete monthly leased vehicle pricing summary."""
        is_truck = vehicle_type.upper() in ("TRUCK_8TON", "XE_TAI", "TRUCK")

        base_rate = cls.TRUCK_8TON_BASE_RATE if is_truck else cls.SEVEN_SEATER_BASE_RATE
        included_km = cls.TRUCK_8TON_INCLUDED_KM if is_truck else cls.SEVEN_SEATER_INCLUDED_KM
        km_rate = cls.TRUCK_8TON_OVERAGE_KM_RATE if is_truck else cls.SEVEN_SEATER_OVERAGE_KM_RATE

        overage_km = max(0.0, total_actual_km - included_km)
        overage_km_cost = overage_km * km_rate

        overtime_cost = overtime_hours * (100000.0 if (is_truck and (sunday_days_count > 0 or holiday_days_count > 0)) else cls.OVERTIME_HOURLY_RATE)
        sunday_cost = sunday_days_count * cls.SUNDAY_DAILY_RATE
        holiday_cost = holiday_days_count * cls.HOLIDAY_DAILY_RATE
        overnight_cost = overnight_count * cls.OVERNIGHT_DAILY_RATE
        meal_cost = (meal_count * cls.TRUCK_MEAL_RATE) if is_truck else 0.0

        total_cost = (
            base_rate
            + overage_km_cost
            + overtime_cost
            + sunday_cost
            + holiday_cost
            + overnight_cost
            + meal_cost
            + toll_fee
        )

        return MonthlyLeasedPricingResult(
            vehicle_type="TRUCK_8TON" if is_truck else "PASSENGER_7SEATER",
            base_monthly_rate=base_rate,
            included_km=included_km,
            overage_km_rate=km_rate,
            total_actual_km=total_actual_km,
            overage_km=overage_km,
            overage_km_cost=overage_km_cost,
            overtime_hours=overtime_hours,
            overtime_cost=overtime_cost,
            sunday_days_count=sunday_days_count,
            sunday_cost=sunday_cost,
            holiday_days_count=holiday_days_count,
            holiday_cost=holiday_cost,
            overnight_count=overnight_count,
            overnight_cost=overnight_cost,
            meal_count=meal_count,
            meal_cost=meal_cost,
            toll_fee=toll_fee,
            total_cost=total_cost,
        )
