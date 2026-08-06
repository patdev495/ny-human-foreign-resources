from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import VendorRoute
from features.vehicle_management.schemas import (
    CalculateCostRequest,
    CalculateCostResponse,
    VendorRouteCreate,
    VendorRouteUpdate,
)
from features.vehicle_management.services.pricing import calculate_dispatch_cost


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


__all__ = [
    "get_vendor_routes",
    "get_vendor_route",
    "create_vendor_route",
    "update_vendor_route",
    "delete_vendor_route",
    "calculate_dispatch_cost",
]
