from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import OwnershipGroup, Vehicle, VehicleDispatch
from features.vehicle_management.schemas import (
    VehicleCreate,
    VehicleDispatchCreate,
    VehicleDispatchUpdate,
    VehicleUpdate,
)


def seed_default_vehicles(db: Session) -> None:
    # Delete any legacy corrupted seed records containing '?' in python string
    all_vehicles = db.query(Vehicle).all()
    corrupted_v_ids = [
        v.id for v in all_vehicles if "?" in (v.name or "") or "?" in (v.driver_name or "")
    ]
    if corrupted_v_ids:
        db.query(Vehicle).filter(Vehicle.id.in_(corrupted_v_ids)).delete(synchronize_session=False)
        db.commit()

    all_dispatches = db.query(VehicleDispatch).all()
    corrupted_d_ids = [
        d.id for d in all_dispatches if "?" in (d.vehicle_name or "") or "?" in (d.driver_name or "")
    ]
    if corrupted_d_ids:
        db.query(VehicleDispatch).filter(VehicleDispatch.id.in_(corrupted_d_ids)).delete(synchronize_session=False)
        db.commit()

    count = db.query(Vehicle).count()
    if count > 0:
        return



    defaults = [
        # Xe công ty
        Vehicle(
            ownership_group=OwnershipGroup.COMPANY_OWNED,
            name="A Ngọc",
            driver_name="A Ngọc",
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.COMPANY_OWNED,
            name="A Đại",
            driver_name="A Đại",
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        # Xe thuê ngoài
        Vehicle(
            ownership_group=OwnershipGroup.OUTSOURCED,
            name="Xe 4 chỗ",
            driver_name=None,
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.OUTSOURCED,
            name="Xe 7 chỗ",
            driver_name=None,
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.OUTSOURCED,
            name="Xe 16 chỗ",
            driver_name=None,
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
    ]
    for v in defaults:
        db.add(v)
    db.commit()


def get_vehicles(db: Session, ownership_group: Optional[OwnershipGroup] = None) -> List[Vehicle]:
    seed_default_vehicles(db)
    query = db.query(Vehicle).filter(Vehicle.is_active == True)
    if ownership_group:
        query = query.filter(Vehicle.ownership_group == ownership_group)
    return query.order_by(Vehicle.ownership_group, Vehicle.id).all()


def create_vehicle(db: Session, vehicle_in: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.flush()
    db.refresh(vehicle)
    db.commit()
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, vehicle_in: VehicleUpdate) -> Optional[Vehicle]:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return None
    for key, value in vehicle_in.model_dump().items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> bool:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return False
    vehicle.is_active = False
    db.commit()
    return True


def get_dispatches(
    db: Session,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    ownership_group: Optional[OwnershipGroup] = None,
    search: Optional[str] = None,
) -> List[VehicleDispatch]:
    query = db.query(VehicleDispatch)
    if from_date:
        query = query.filter(VehicleDispatch.dispatch_date >= from_date)
    if to_date:
        query = query.filter(VehicleDispatch.dispatch_date <= to_date)
    if ownership_group:
        query = query.filter(VehicleDispatch.ownership_group == ownership_group)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (VehicleDispatch.vehicle_name.ilike(term))
            | (VehicleDispatch.driver_name.ilike(term))
            | (VehicleDispatch.passenger_name.ilike(term))
            | (VehicleDispatch.pickup_location.ilike(term))
            | (VehicleDispatch.dropoff_location.ilike(term))
        )
    return query.order_by(VehicleDispatch.dispatch_date.desc(), VehicleDispatch.id.desc()).all()


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
    dispatch = db.query(VehicleDispatch).filter(VehicleDispatch.id == dispatch_id).first()
    if not dispatch:
        return None
    for key, value in dispatch_in.model_dump().items():
        setattr(dispatch, key, value)
    db.commit()
    db.refresh(dispatch)
    return dispatch


def delete_dispatch(db: Session, dispatch_id: int) -> bool:
    dispatch = db.query(VehicleDispatch).filter(VehicleDispatch.id == dispatch_id).first()
    if not dispatch:
        return False
    db.delete(dispatch)
    db.commit()
    return True
