from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.vehicle_management import service
from features.vehicle_management.models import OwnershipGroup
from features.vehicle_management.schemas import (
    VehicleCreate,
    VehicleDispatchCreate,
    VehicleDispatchResponse,
    VehicleDispatchUpdate,
    VehicleResponse,
    VehicleUpdate,
)

router = APIRouter(prefix="/api/vehicle-management", tags=["Vehicle Management"])


# --- Vehicle Catalog Routes ---

@router.get("/vehicles", response_model=List[VehicleResponse])
def list_vehicles(
    ownership_group: Optional[OwnershipGroup] = None,
    db: Session = Depends(get_db),
):
    return service.get_vehicles(db, ownership_group=ownership_group)


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
):
    return service.create_vehicle(db, vehicle_in)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
):
    vehicle = service.update_vehicle(db, vehicle_id, vehicle_in)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    success = service.delete_vehicle(db, vehicle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}


# --- Vehicle Dispatch Routes ---

@router.get("/dispatches", response_model=List[VehicleDispatchResponse])
def list_dispatches(
    from_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    ownership_group: Optional[OwnershipGroup] = None,
    search: Optional[str] = Query(None, description="Search by name, driver, or locations"),
    db: Session = Depends(get_db),
):
    return service.get_dispatches(
        db, from_date=from_date, to_date=to_date, ownership_group=ownership_group, search=search
    )


@router.post("/dispatches", response_model=VehicleDispatchResponse, status_code=status.HTTP_201_CREATED)
def create_dispatch(
    dispatch_in: VehicleDispatchCreate,
    db: Session = Depends(get_db),
):
    return service.create_dispatch(db, dispatch_in)


@router.put("/dispatches/{dispatch_id}", response_model=VehicleDispatchResponse)
def update_dispatch(
    dispatch_id: int,
    dispatch_in: VehicleDispatchUpdate,
    db: Session = Depends(get_db),
):
    dispatch = service.update_dispatch(db, dispatch_id, dispatch_in)
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch record not found")
    return dispatch


@router.delete("/dispatches/{dispatch_id}")
def delete_dispatch(
    dispatch_id: int,
    db: Session = Depends(get_db),
):
    success = service.delete_dispatch(db, dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch record not found")
    return {"message": "Dispatch record deleted successfully"}
