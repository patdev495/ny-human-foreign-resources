from __future__ import annotations

from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from features.vehicle_management.models import DailyOdometerLog, MonthlyVehicleContract, Vehicle
from features.vehicle_management.schemas import (
    MonthlyReconciliationItemResponse,
    MonthlyVehicleContractResponse,
    MonthlyVehicleContractUpdate,
)
from features.vehicle_management.services.vehicle_service import seed_default_vehicles


def get_monthly_contracts(db: Session) -> List[MonthlyVehicleContractResponse]:
    seed_default_vehicles(db)
    contracts = db.query(MonthlyVehicleContract).join(Vehicle).all()
    res = []
    for c in contracts:
        resp = MonthlyVehicleContractResponse.model_validate(c)
        resp.vehicle_name = c.vehicle.name if c.vehicle else None
        resp.license_plate = c.vehicle.license_plate if c.vehicle else None
        res.append(resp)
    return res


def get_monthly_contract(db: Session, contract_id: int) -> Optional[MonthlyVehicleContract]:
    return db.query(MonthlyVehicleContract).filter(MonthlyVehicleContract.id == contract_id).first()


def update_monthly_contract(
    db: Session, contract_id: int, contract_in: MonthlyVehicleContractUpdate
) -> Optional[MonthlyVehicleContractResponse]:
    c = get_monthly_contract(db, contract_id)
    if not c:
        return None
    for key, val in contract_in.model_dump().items():
        setattr(c, key, val)
    db.commit()
    db.refresh(c)
    resp = MonthlyVehicleContractResponse.model_validate(c)
    resp.vehicle_name = c.vehicle.name if c.vehicle else None
    resp.license_plate = c.vehicle.license_plate if c.vehicle else None
    return resp


def get_monthly_reconciliation_report(
    db: Session, billing_month: str
) -> List[MonthlyReconciliationItemResponse]:
    seed_default_vehicles(db)

    try:
        year, month = map(int, billing_month.split("-"))
        prev_year = year - 1 if month == 1 else year
        prev_month = 12 if month == 1 else month - 1
        from_date = f"{prev_year:04d}-{prev_month:02d}-26"
        to_date = f"{year:04d}-{month:02d}-25"
    except Exception:
        from_date = f"{billing_month}-01"
        to_date = f"{billing_month}-31"

    contracts = db.query(MonthlyVehicleContract).join(Vehicle).all()
    results = []

    for c in contracts:
        v = c.vehicle
        if not v:
            continue

        km_sum = (
            db.query(func.sum(DailyOdometerLog.daily_km))
            .filter(
                DailyOdometerLog.vehicle_id == v.id,
                DailyOdometerLog.log_date >= from_date,
                DailyOdometerLog.log_date <= to_date,
            )
            .scalar()
            or 0.0
        )

        excess_km = max(0.0, km_sum - c.km_allowance)
        excess_km_cost = excess_km * c.excess_km_rate
        overtime_hours = 0.0
        overtime_cost = 0.0
        surcharges_cost = 0.0
        total_cost = c.base_monthly_cost + excess_km_cost + overtime_cost + surcharges_cost

        item = MonthlyReconciliationItemResponse(
            vehicle_id=v.id,
            vehicle_name=v.name,
            license_plate=v.license_plate,
            contract_name=c.contract_name,
            base_monthly_cost=c.base_monthly_cost,
            km_allowance=c.km_allowance,
            excess_km_rate=c.excess_km_rate,
            total_month_km=km_sum,
            excess_km=excess_km,
            excess_km_cost=excess_km_cost,
            overtime_hours=overtime_hours,
            overtime_cost=overtime_cost,
            surcharges_cost=surcharges_cost,
            total_cost=total_cost,
        )
        results.append(item)

    return results
