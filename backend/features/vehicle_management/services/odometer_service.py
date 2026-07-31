from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import DailyOdometerLog, Vehicle
from features.vehicle_management.schemas import DailyOdometerLogCreate, DailyOdometerLogResponse


def get_daily_odometer_logs(
    db: Session,
    vehicle_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    billing_month: Optional[str] = None,
) -> List[DailyOdometerLogResponse]:
    query = db.query(DailyOdometerLog).join(Vehicle)
    if vehicle_id:
        query = query.filter(DailyOdometerLog.vehicle_id == vehicle_id)

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
        query = query.filter(DailyOdometerLog.log_date >= from_date)
    if to_date:
        query = query.filter(DailyOdometerLog.log_date <= to_date)

    logs = query.order_by(DailyOdometerLog.log_date.desc(), DailyOdometerLog.id.desc()).all()
    res = []
    for l in logs:
        resp = DailyOdometerLogResponse.model_validate(l)
        resp.vehicle_name = l.vehicle.name if l.vehicle else None
        resp.license_plate = l.vehicle.license_plate if l.vehicle else None
        res.append(resp)
    return res


def create_or_update_daily_odometer_log(
    db: Session, log_in: DailyOdometerLogCreate
) -> DailyOdometerLogResponse:
    daily_km = max(0.0, log_in.end_km - log_in.start_km) if log_in.end_km > 0 else 0.0
    existing = (
        db.query(DailyOdometerLog)
        .filter(
            DailyOdometerLog.vehicle_id == log_in.vehicle_id,
            DailyOdometerLog.log_date == log_in.log_date,
        )
        .first()
    )
    if existing:
        existing.start_km = log_in.start_km
        existing.end_km = log_in.end_km
        existing.daily_km = daily_km
        if log_in.start_photo_url is not None:
            existing.start_photo_url = log_in.start_photo_url
        if log_in.end_photo_url is not None:
            existing.end_photo_url = log_in.end_photo_url
        if log_in.notes is not None:
            existing.notes = log_in.notes
        db.commit()
        db.refresh(existing)
        l = existing
    else:
        l = DailyOdometerLog(
            vehicle_id=log_in.vehicle_id,
            log_date=log_in.log_date,
            start_km=log_in.start_km,
            end_km=log_in.end_km,
            daily_km=daily_km,
            start_photo_url=log_in.start_photo_url,
            end_photo_url=log_in.end_photo_url,
            notes=log_in.notes,
        )
        db.add(l)
        db.commit()
        db.refresh(l)

    resp = DailyOdometerLogResponse.model_validate(l)
    resp.vehicle_name = l.vehicle.name if l.vehicle else None
    resp.license_plate = l.vehicle.license_plate if l.vehicle else None
    return resp
