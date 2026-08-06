from __future__ import annotations

from datetime import datetime, timedelta
from io import BytesIO
import zipfile
import xlsxwriter
from sqlalchemy.orm import Session

from features.vehicle_management.models import MonthlyVehicleContract, OwnershipGroup, Vehicle, VehicleDispatch
from features.vehicle_management.services.exporters.duc_anh_sheet_builder import write_dntt_sheet, write_main_sheet


def generate_duc_anh_report(
    db: Session,
    contract: MonthlyVehicleContract,
    from_date: str,
    to_date: str,
) -> BytesIO:
    """Generate a complete Duc Anh Excel report using xlsxwriter (no template files)."""
    v = contract.vehicle

    try:
        f_dt = datetime.strptime(from_date, "%Y-%m-%d")
        t_dt = datetime.strptime(to_date, "%Y-%m-%d")
    except ValueError:
        f_dt = t_dt = datetime.now()

    month_str = f"{f_dt.month:02d}"
    year_str = str(f_dt.year)

    dispatches = (
        db.query(VehicleDispatch)
        .filter(
            VehicleDispatch.vehicle_id == v.id,
            VehicleDispatch.dispatch_date >= from_date,
            VehicleDispatch.dispatch_date <= to_date,
        )
        .all()
    )
    daily_map: dict[str, list[VehicleDispatch]] = {}
    for d in dispatches:
        daily_map.setdefault(d.dispatch_date, []).append(d)

    days: list[str] = []
    cur = f_dt
    while cur <= t_dt:
        days.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)

    out = BytesIO()
    wb = xlsxwriter.Workbook(out, {"in_memory": True, "nan_inf_to_errors": True})

    write_main_sheet(wb, contract, v, month_str, year_str, days, daily_map)
    write_dntt_sheet(wb, contract, v, month_str, year_str, days, daily_map)

    wb.close()
    out.seek(0)
    return out


def generate_duc_anh_zip_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    """Package Duc Anh vehicles Excel reports into a single ZIP archive."""
    from features.vehicle_management.services.contract_service import seed_default_vehicles
    seed_default_vehicles(db)
    contracts = db.query(MonthlyVehicleContract).join(Vehicle).all()
    duc_anh_contracts = [
        c for c in contracts if c.vehicle and c.vehicle.ownership_group == OwnershipGroup.COMPANY_OWNED
    ]

    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for c in duc_anh_contracts:
            v = c.vehicle
            plate = v.license_plate or v.name
            fname = f"{plate} NIENYI CHỐT XE {from_date}_den_{to_date}.xlsx"
            excel_bytes = generate_duc_anh_report(db, c, from_date, to_date).getvalue()
            zf.writestr(fname, excel_bytes)

    zip_buffer.seek(0)
    return zip_buffer
