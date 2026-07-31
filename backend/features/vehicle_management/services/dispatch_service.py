from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import OwnershipGroup, VehicleDispatch
from features.vehicle_management.schemas import VehicleDispatchCreate, VehicleDispatchUpdate


def get_dispatches(
    db: Session,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    ownership_group: Optional[OwnershipGroup] = None,
    provider_id: Optional[int] = None,
    billing_month: Optional[str] = None,
    search: Optional[str] = None,
) -> List[VehicleDispatch]:
    query = db.query(VehicleDispatch)
    
    if billing_month:
        try:
            year, month = map(int, billing_month.split("-"))
            prev_year = year - 1 if month == 1 else year
            prev_month = 12 if month == 1 else month - 1
            from_date = f"{prev_year:04d}-{prev_month:02d}-26"
            to_date = f"{year:04d}-{month:02d}-25"
        except Exception:
            pass

    if from_date:
        query = query.filter(VehicleDispatch.dispatch_date >= from_date)
    if to_date:
        query = query.filter(VehicleDispatch.dispatch_date <= to_date)
    if ownership_group:
        query = query.filter(VehicleDispatch.ownership_group == ownership_group)
    if provider_id:
        query = query.filter(VehicleDispatch.provider_id == provider_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (VehicleDispatch.vehicle_name.ilike(term))
            | (VehicleDispatch.provider_name.ilike(term))
            | (VehicleDispatch.driver_name.ilike(term))
            | (VehicleDispatch.driver_phone.ilike(term))
            | (VehicleDispatch.passenger_name.ilike(term))
            | (VehicleDispatch.pickup_location.ilike(term))
            | (VehicleDispatch.dropoff_location.ilike(term))
        )
    return query.order_by(VehicleDispatch.dispatch_date.desc(), VehicleDispatch.id.desc()).all()


def get_dispatch(db: Session, dispatch_id: int) -> Optional[VehicleDispatch]:
    return db.query(VehicleDispatch).filter(VehicleDispatch.id == dispatch_id).first()


def create_dispatch(db: Session, dispatch_in: VehicleDispatchCreate) -> VehicleDispatch:
    dispatch = VehicleDispatch(**dispatch_in.model_dump())
    db.add(dispatch)
    db.flush()
    db.refresh(dispatch)
    db.commit()
    return dispatch


def update_dispatch(
    db: Session, dispatch_id: int, dispatch_in: VehicleDispatchUpdate
) -> Optional[VehicleDispatch]:
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        return None
    for key, value in dispatch_in.model_dump().items():
        setattr(dispatch, key, value)
    db.commit()
    db.refresh(dispatch)
    return dispatch


def delete_dispatch(db: Session, dispatch_id: int) -> bool:
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        return False
    db.delete(dispatch)
    db.commit()
    return True
