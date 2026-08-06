from __future__ import annotations

from sqlalchemy.orm import Session
from features.vehicle_management.models import RouteType
from features.vehicle_management.schemas import CalculateCostRequest, CalculateCostResponse
from features.vehicle_management.services.pricing.pricing_strategies import (
    FixedRouteStrategy,
    KmBasedStrategy,
    PricingStrategy,
)


class DispatchPricingEngine:
    """Encapsulates vehicle dispatch pricing rules and strategy selection."""

    def __init__(self) -> None:
        self._strategies: dict[RouteType, PricingStrategy] = {
            RouteType.FIXED_ROUTE: FixedRouteStrategy(),
            RouteType.KM_BASED: KmBasedStrategy(),
        }

    def calculate_dispatch_cost(self, db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
        strategy = self._strategies.get(req.route_type, FixedRouteStrategy())
        return strategy.calculate(db, req)


_default_engine = DispatchPricingEngine()


def calculate_dispatch_cost(db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
    """Public helper function delegating to the default DispatchPricingEngine."""
    return _default_engine.calculate_dispatch_cost(db, req)
