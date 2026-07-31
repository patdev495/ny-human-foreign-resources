from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import RouteType, VendorRoute
from features.vehicle_management.schemas import (
    CalculateCostRequest,
    CalculateCostResponse,
    VendorRouteCreate,
    VendorRouteUpdate,
)


def get_vendor_routes(db: Session, provider_id: Optional[int] = None) -> List[VendorRoute]:
    query = db.query(VendorRoute)
    if provider_id:
        query = query.filter(VendorRoute.provider_id == provider_id)
    return query.order_by(VendorRoute.provider_id, VendorRoute.id).all()


def get_vendor_route(db: Session, route_id: int) -> Optional[VendorRoute]:
    return db.query(VendorRoute).filter(VendorRoute.id == route_id).first()


def create_vendor_route(db: Session, r_in: VendorRouteCreate) -> VendorRoute:
    route = VendorRoute(**r_in.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


def update_vendor_route(db: Session, route_id: int, r_in: VendorRouteUpdate) -> Optional[VendorRoute]:
    route = get_vendor_route(db, route_id)
    if not route:
        return None
    for key, val in r_in.model_dump(exclude_unset=True).items():
        setattr(route, key, val)
    db.commit()
    db.refresh(route)
    return route


def delete_vendor_route(db: Session, route_id: int) -> bool:
    route = get_vendor_route(db, route_id)
    if not route:
        return False
    db.delete(route)
    db.commit()
    return True


def calculate_dispatch_cost(db: Session, req: CalculateCostRequest) -> CalculateCostResponse:
    base_cost = 0.0
    waiting_rate = 30000.0

    if req.route_type == RouteType.FIXED_ROUTE:
        if req.vendor_route_id:
            route = db.query(VendorRoute).filter(VendorRoute.id == req.vendor_route_id).first()
            if route:
                base_cost = route.fixed_price
                waiting_rate = route.waiting_fee_per_hour
    elif req.route_type == RouteType.KM_BASED:
        base_cost = req.distance_km * 14000.0

    waiting_cost = req.waiting_hours * waiting_rate
    total = base_cost + waiting_cost

    return CalculateCostResponse(
        base_cost=base_cost,
        waiting_cost=waiting_cost,
        total_calculated_cost=total,
    )
