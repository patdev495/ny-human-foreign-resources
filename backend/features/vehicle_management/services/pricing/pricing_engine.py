from __future__ import annotations

from sqlalchemy.orm import Session
from features.vehicle_management.models import RouteType
from features.vehicle_management.schemas import CalculateCostRequest, CalculateCostResponse
from .monthly_leased_adapter import MonthlyLeasedContractAdapter, MonthlyLeasedPricingResult
from .route_based_adapter import RouteBasedContractAdapter
from .pricing_strategies import (
    FixedRouteStrategy,
    KmBasedStrategy,
    PricingStrategy,
)


class DispatchPricingEngine:
    """Deep module for all vehicle dispatch and contract pricing calculations."""

    def __init__(self) -> None:
        self._strategies: dict[RouteType, PricingStrategy] = {
            RouteType.FIXED_ROUTE: FixedRouteStrategy(),
            RouteType.KM_BASED: KmBasedStrategy(),
        }

    def calculate_dispatch_cost(self, db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
        """Calculate single dispatch trip cost."""
        if req.vendor_route_id:
            return RouteBasedContractAdapter.calculate_trip_cost(db, req)
        strategy = self._strategies.get(req.route_type, FixedRouteStrategy())
        return strategy.calculate(db, req)

    def calculate_monthly_leased_bill(
        self,
        vehicle_type: str,
        total_actual_km: float,
        overtime_hours: float = 0.0,
        sunday_days_count: int = 0,
        holiday_days_count: int = 0,
        overnight_count: int = 0,
        meal_count: int = 0,
        toll_fee: float = 0.0,
    ) -> MonthlyLeasedPricingResult:
        """Calculate monthly leased contract pricing summary (Duc Anh innovation packages)."""
        return MonthlyLeasedContractAdapter.calculate_monthly_bill(
            vehicle_type=vehicle_type,
            total_actual_km=total_actual_km,
            overtime_hours=overtime_hours,
            sunday_days_count=sunday_days_count,
            holiday_days_count=holiday_days_count,
            overnight_count=overnight_count,
            meal_count=meal_count,
            toll_fee=toll_fee,
        )


_default_engine = DispatchPricingEngine()


def calculate_dispatch_cost(db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
    """Public helper function delegating to default DispatchPricingEngine."""
    return _default_engine.calculate_dispatch_cost(db, req)


def calculate_monthly_leased_bill(
    vehicle_type: str,
    total_actual_km: float,
    overtime_hours: float = 0.0,
    sunday_days_count: int = 0,
    holiday_days_count: int = 0,
    overnight_count: int = 0,
    meal_count: int = 0,
    toll_fee: float = 0.0,
) -> MonthlyLeasedPricingResult:
    """Public helper function for monthly leased vehicle contract billing."""
    return _default_engine.calculate_monthly_leased_bill(
        vehicle_type=vehicle_type,
        total_actual_km=total_actual_km,
        overtime_hours=overtime_hours,
        sunday_days_count=sunday_days_count,
        holiday_days_count=holiday_days_count,
        overnight_count=overnight_count,
        meal_count=meal_count,
        toll_fee=toll_fee,
    )
