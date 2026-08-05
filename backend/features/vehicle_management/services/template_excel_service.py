from __future__ import annotations

from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Optional
from openpyxl import load_workbook
from sqlalchemy.orm import Session

from features.vehicle_management.models import MonthlyVehicleContract, VehicleDispatch


def find_sample_template(license_plate: str) -> Optional[Path]:
    if not license_plate:
        return None
    
    # Try relative to base dir or workspace root
    base_dir = Path(__file__).resolve().parents[4] / "report"
    if not base_dir.exists():
        base_dir = Path(__file__).resolve().parents[3] / "report"
    
    if not base_dir.exists():
        return None

    clean_plate = license_plate.replace("-", "").replace(".", "").upper()
    for f in base_dir.glob("*.xlsx"):
        clean_fname = f.name.replace("-", "").replace(".", "").upper()
        if ("81988" in clean_plate and "81988" in clean_fname) or \
           ("36900" in clean_plate and "36900" in clean_fname) or \
           ("10378" in clean_plate and "10378" in clean_fname):
            return f
    return None


def populate_vehicle_from_template(
    template_path: Path,
    db: Session,
    contract: MonthlyVehicleContract,
    from_date: str,
    to_date: str,
) -> BytesIO:
    v = contract.vehicle
    wb = load_workbook(template_path)

    sheet_name = "BẢNG KÊ CHI TIẾT XUẤT VAT 07"
    if sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
    else:
        ws = wb.active

    try:
        f_dt = datetime.strptime(from_date, "%Y-%m-%d")
        t_dt = datetime.strptime(to_date, "%Y-%m-%d")
    except ValueError:
        f_dt = datetime.now()
        t_dt = datetime.now()

    month_str = f"{f_dt.month:02d}"
    year_str = f"{f_dt.year}"

    # Update Title Header in template
    ws["A4"] = f"Tháng {month_str} năm {year_str}\n{year_str} 年{month_str}月"
    ws["A6"] = f"Bảng kê số {month_str}{year_str} ngày 25/{month_str}/{year_str} kèm hóa đơn số:            kí hiệu:"

    # Query dispatches for this vehicle in range
    dispatches = (
        db.query(VehicleDispatch)
        .filter(
            VehicleDispatch.vehicle_id == v.id,
            VehicleDispatch.dispatch_date >= from_date,
            VehicleDispatch.dispatch_date <= to_date,
        )
        .all()
    )

    daily_map = {}
    for d in dispatches:
        daily_map.setdefault(d.dispatch_date, []).append(d)

    # Fill daily rows starting at row 12
    curr_dt = f_dt
    day_idx = 0

    while curr_dt <= t_dt:
        r = 12 + day_idx
        d_str = curr_dt.strftime("%Y-%m-%d")

        ws.cell(row=r, column=1).value = d_str
        trips = daily_map.get(d_str, [])

        if trips:
            trips_sorted = sorted(trips, key=lambda t: (t.pickup_time or "00:00", t.id))
            f_trip = trips_sorted[0]
            l_trip = trips_sorted[-1]

            s_km = f_trip.odometer_km or f_trip.start_km
            e_km = l_trip.end_km or l_trip.odometer_km

            s_time = f_trip.pickup_time or "07:00"
            e_time = l_trip.return_time or l_trip.pickup_time or "19:00"

            if s_km is not None: ws.cell(row=r, column=2).value = s_km
            if e_km is not None: ws.cell(row=r, column=3).value = e_km
            ws.cell(row=r, column=4).value = f"=+C{r}-B{r}"

            ws.cell(row=r, column=11).value = s_time
            ws.cell(row=r, column=12).value = e_time

            day_toll = sum(getattr(t, "toll_fee", 0.0) or 0.0 for t in trips)
            day_meal_cnt = sum(getattr(t, "meal_count", 0) or 0 for t in trips)
            day_overnight_cnt = sum(getattr(t, "overnight_count", 0) or 0 for t in trips)

            if day_overnight_cnt > 0:
                ws.cell(row=r, column=18).value = day_overnight_cnt * (contract.overnight_fee or 300000)

            if day_meal_cnt > 0:
                ws.cell(row=r, column=25).value = day_meal_cnt
                ws.cell(row=r, column=26).value = f"=Y{r}*50000"

            if day_toll > 0:
                ws.cell(row=r, column=27).value = day_toll

        day_idx += 1
        curr_dt += timedelta(days=1)

    # Update sheet ĐNTT if present
    if "ĐNTT" in wb.sheetnames:
        ws_dntt = wb["ĐNTT"]
        ws_dntt["A1"] = f"{year_str} 年{month_str}月份的对账单\nBẢNG ĐỐI CHIẾU CÔNG NỢ CƯỚC XE THÁNG {month_str}/{year_str}"
        if ws_dntt.max_row >= 29:
            ws_dntt.cell(row=29, column=2).value = f"Bắc Ninh, ngày 25 tháng {month_str} năm {year_str}"

    out = BytesIO()
    wb.save(out)
    out.seek(0)
    return out
