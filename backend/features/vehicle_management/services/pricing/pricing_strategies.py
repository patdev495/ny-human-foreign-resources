from __future__ import annotations

from typing import Protocol
from sqlalchemy.orm import Session
from features.vehicle_management.models import RouteType, VendorRoute
from features.vehicle_management.schemas import CalculateCostRequest, CalculateCostResponse


class PricingStrategy(Protocol):
    def calculate(self, db: Session, req: CalculateCostRequest) -> CalculateCostResponse: ...


class FixedRouteStrategy:
    """Strategy for fixed route matrix pricing (fixed price + waiting fee)."""

    def calculate(self, db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
        base_cost = 0.0
        waiting_rate = 30000.0

        if req.vendor_route_id:
            route = db.query(VendorRoute).filter(VendorRoute.id == req.vendor_route_id).first()
            if route:
                base_cost = route.fixed_price
                waiting_rate = route.waiting_fee_per_hour

        waiting_cost = req.waiting_hours * waiting_rate
        total = base_cost + waiting_cost

        return CalculateCostResponse(
            base_cost=base_cost,
            waiting_cost=waiting_cost,
            total_calculated_cost=total,
        )


class KmBasedStrategy:
    """Strategy for distance-based pricing (14,000 đ/km + 30,000 đ/h waiting fee)."""

    def calculate(self, db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
        default_km_rate = 14000.0
        default_waiting_rate = 30000.0

        base_cost = req.distance_km * default_km_rate
        waiting_cost = req.waiting_hours * default_waiting_rate
        total = base_cost + waiting_cost

        return CalculateCostResponse(
            base_cost=base_cost,
            waiting_cost=waiting_cost,
            total_calculated_cost=total,
        )
