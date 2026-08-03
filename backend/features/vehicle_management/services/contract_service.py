from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from features.vehicle_management.models import (
    DailyOdometerLog,
    MonthlyVehicleContract,
    Vehicle,
    VehicleDispatch,
)
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


def parse_time_to_minutes(time_str: Optional[str]) -> Optional[int]:
    if not time_str:
        return None
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return None


def calculate_vehicle_monthly_overtime_and_surcharges(
    db: Session, vehicle_id: int, contract: MonthlyVehicleContract, from_date: str, to_date: str
) -> tuple[float, float, float]:

    dispatches = (
        db.query(VehicleDispatch)
        .filter(
            VehicleDispatch.vehicle_id == vehicle_id,
            VehicleDispatch.dispatch_date >= from_date,
            VehicleDispatch.dispatch_date <= to_date,
        )
        .all()
    )

    daily_map = {}
    for d in dispatches:
        daily_map.setdefault(d.dispatch_date, []).append(d)

    total_ot_hours = 0.0
    total_ot_cost = 0.0
    total_surcharges = 0.0

    for date_str, trip_list in daily_map.items():
        sorted_trips = sorted(trip_list, key=lambda t: (t.pickup_time or "00:00", t.id))
        first_trip = sorted_trips[0]
        last_trip = sorted_trips[-1]

        start_time_str = first_trip.pickup_time
        end_time_str = last_trip.return_time or last_trip.pickup_time

        start_mins = parse_time_to_minutes(start_time_str)
        end_mins = parse_time_to_minutes(end_time_str)

        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            is_sunday = date_obj.weekday() == 6
        except Exception:
            is_sunday = False

        std_start_str = contract.sunday_standard_start_time if is_sunday else contract.standard_start_time
        std_end_str = contract.sunday_standard_end_time if is_sunday else contract.standard_end_time

        std_start_mins = parse_time_to_minutes(std_start_str) or (450 if is_sunday else 420)
        std_end_mins = parse_time_to_minutes(std_end_str) or 1080

        ot_rate = contract.overtime_rate_weekend if is_sunday else contract.overtime_rate_weekday

        # Sunday daily fee
        if is_sunday and contract.sunday_daily_rate > 0:
            total_surcharges += contract.sunday_daily_rate

        if start_mins is not None and end_mins is not None:
            early_ot_mins = max(0, std_start_mins - start_mins)
            early_ot_hours = early_ot_mins / 60.0
            late_ot_hours = 0.0

            # Evening bonus calculation for 7-seat (18:00 - 22:00 fixed 100k bonus)
            if contract.evening_fixed_bonus_amount > 0 and contract.evening_fixed_bonus_start:
                bonus_start_mins = parse_time_to_minutes(contract.evening_fixed_bonus_start) or 1080
                bonus_end_mins = parse_time_to_minutes(contract.evening_fixed_bonus_end) or 1320

                if end_mins > bonus_start_mins and not is_sunday:
                    total_surcharges += contract.evening_fixed_bonus_amount

                if end_mins > bonus_end_mins and not is_sunday:
                    late_ot_mins = end_mins - bonus_end_mins
                    late_ot_hours = late_ot_mins / 60.0
                elif is_sunday:
                    late_ot_mins = max(0, end_mins - std_end_mins)
                    late_ot_hours = late_ot_mins / 60.0
            else:
                late_ot_mins = max(0, end_mins - std_end_mins)
                late_ot_hours = late_ot_mins / 60.0

            day_ot = early_ot_hours + late_ot_hours
            total_ot_hours += day_ot
            total_ot_cost += day_ot * ot_rate

    return round(total_ot_hours, 1), round(total_ot_cost, 0), round(total_surcharges, 0)


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

        ot_hours, ot_cost, surcharges = calculate_vehicle_monthly_overtime_and_surcharges(
            db, v.id, c, from_date, to_date
        )

        total_cost = c.base_monthly_cost + excess_km_cost + ot_cost + surcharges

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
            overtime_hours=ot_hours,
            overtime_cost=ot_cost,
            surcharges_cost=surcharges,
            total_cost=total_cost,
        )
        results.append(item)

    return results
