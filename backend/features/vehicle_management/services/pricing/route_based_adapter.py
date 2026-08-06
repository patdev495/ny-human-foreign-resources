from __future__ import annotations

from dataclasses import dataclass
from sqlalchemy.orm import Session
from features.vehicle_management.models import VendorRoute
from features.vehicle_management.schemas import CalculateCostRequest, CalculateCostResponse


@dataclass
class RouteBasedPricingResult:
    base_cost: float
    waiting_cost: float
    toll_fee: float
    total_cost: float


class RouteBasedContractAdapter:
    """Adapter for Route Based & Per-trip Vehicle Contracts (Binh An outsourcing)."""

    DEFAULT_KM_RATE = 14_000.0
    DEFAULT_WAITING_RATE = 30_000.0

    @classmethod
    def calculate_trip_cost(
        cls, db: Session, req: CalculateCostRequest
    ) -> CalculateCostResponse:
        """Calculate trip cost for fixed route or km-based trip."""
        base_cost = 0.0
        waiting_rate = cls.DEFAULT_WAITING_RATE

        if req.vendor_route_id:
            route = db.query(VendorRoute).filter(VendorRoute.id == req.vendor_route_id).first()
            if route:
                base_cost = route.fixed_price
                waiting_rate = route.waiting_fee_per_hour
        elif req.distance_km > 0:
            base_cost = req.distance_km * cls.DEFAULT_KM_RATE

        waiting_cost = req.waiting_hours * waiting_rate
        total = base_cost + waiting_cost

        return CalculateCostResponse(
            base_cost=base_cost,
            waiting_cost=waiting_cost,
            total_calculated_cost=total,
        )
