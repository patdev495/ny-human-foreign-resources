from __future__ import annotations

from datetime import datetime, timedelta
from io import BytesIO
from typing import List, Optional
import zipfile
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from features.vehicle_management.models import (
    MonthlyVehicleContract,
    OwnershipGroup,
    Vehicle,
    VehicleDispatch,
)
from features.vehicle_management.services.contract_service import (
    parse_time_to_minutes,
    seed_default_vehicles,
)


def style_header_cell(cell, fill_color="1F4E78", font_color="FFFFFF"):
    cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    cell.font = Font(name="Segoe UI", size=10, bold=True, color=font_color)
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )
    cell.border = thin_border


def style_data_cell(cell, align="left", is_bold=False, bg_color=None):
    cell.font = Font(name="Segoe UI", size=10, bold=is_bold, color="1F2937")
    cell.alignment = Alignment(horizontal=align, vertical="center")
    thin_border = Border(
        left=Side(style="thin", color="E5E7EB"),
        right=Side(style="thin", color="E5E7EB"),
        top=Side(style="thin", color="E5E7EB"),
        bottom=Side(style="thin", color="E5E7EB"),
    )
    cell.border = thin_border
    if bg_color:
        cell.fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")


def auto_fit_columns(ws):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if "\n" in val_str:
                val_str = max(val_str.split("\n"), key=len)
            max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)



from features.vehicle_management.services.template_excel_service import (
    find_binh_an_template,
    populate_binh_an_from_template,
)
from features.vehicle_management.services.duc_anh_excel_service import generate_duc_anh_report



def generate_single_vehicle_excel_file(
    db: Session, contract: MonthlyVehicleContract, from_date: str, to_date: str
) -> BytesIO:
    # Use xlsxwriter-based generator (no template file dependency)
    return generate_duc_anh_report(db, contract, from_date, to_date)





def generate_duc_anh_zip_report(db: Session, from_date: str, to_date: str) -> BytesIO:
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
            excel_bytes = generate_single_vehicle_excel_file(db, c, from_date, to_date).getvalue()
            zf.writestr(fname, excel_bytes)

    zip_buffer.seek(0)
    return zip_buffer



def generate_duc_anh_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    return generate_duc_anh_zip_report(db, from_date, to_date)


def generate_binh_an_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    template_path = find_binh_an_template()
    if template_path and template_path.exists():
        return populate_binh_an_from_template(template_path, db, from_date, to_date)

    wb = Workbook()

    ws = wb.active
    ws.title = "BẢNG KÊ BÌNH AN"
    ws.views.sheetView[0].showGridLines = True

    # Title Block
    ws.merge_cells("A1:K1")
    t_cell = ws["A1"]
    t_cell.value = "BẢNG KÊ CHI TIẾT CÁC CHUYẾN ĐIỀU XE — NHÀ XE BÌNH AN"
    t_cell.font = Font(name="Segoe UI", size=14, bold=True, color="B85450")
    t_cell.alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("A2:K2")
    s_cell = ws["A2"]
    s_cell.value = f"Giai đoạn: Từ ngày {from_date} đến ngày {to_date}"
    s_cell.font = Font(name="Segoe UI", size=10, italic=True, color="4B5563")
    s_cell.alignment = Alignment(horizontal="center", vertical="center")

    dispatches = (
        db.query(VehicleDispatch)
        .filter(
            VehicleDispatch.ownership_group == OwnershipGroup.OUTSOURCED,
            VehicleDispatch.dispatch_date >= from_date,
            VehicleDispatch.dispatch_date <= to_date,
        )
        .order_by(VehicleDispatch.dispatch_date.asc(), VehicleDispatch.id.asc())
        .all()
    )

    headers = [
        "STT", "Ngày Điều Xe", "Giờ Đón", "Loại Xe / Biển Số", "Tài Xế",
        "Hành Khách", "Số Lượng", "Điểm Đi ➔ Điểm Đến", "KM / Giờ Chờ",
        "Chi Phí Chuyến (đ)", "Ghi Chú",
    ]
    ws.append([])
    ws.append(headers)
    for c_i in range(1, 12):
        style_header_cell(ws.cell(row=4, column=c_i), fill_color="C00000")

    total_cost = 0.0
    for idx, d in enumerate(dispatches, 1):
        total_cost += d.cost
        ws.append([
            idx,
            d.dispatch_date,
            d.pickup_time or "—",
            d.vehicle_name,
            f"{d.driver_name or '—'} {d.driver_phone or ''}",
            d.passenger_name or "—",
            f"{d.passenger_count} người",
            f"{d.pickup_location or '—'} ➔ {d.dropoff_location or '—'}",
            f"{d.distance_km} KM ({d.waiting_hours}h)",
            d.cost,
            d.notes or "—",
        ])
        cur_r = 4 + idx
        for c_i in range(1, 12):
            cell = ws.cell(row=cur_r, column=c_i)
            align = "center" if c_i in (1, 2, 3, 7) else "right" if c_i == 10 else "left"
            style_data_cell(cell, align=align)
            if c_i == 10:
                cell.number_format = "#,##0"

    footer_r = 5 + len(dispatches)
    ws.append(["TỔNG CỘNG CHI PHÍ NHÀ XE BÌNH AN", "", "", "", "", "", "", "", "", total_cost, ""])
    ws.merge_cells(start_row=footer_r, start_column=1, end_row=footer_r, end_column=9)
    for c_i in range(1, 12):
        cell = ws.cell(row=footer_r, column=c_i)
        style_data_cell(cell, align="right" if c_i == 10 else "center", is_bold=True, bg_color="FCE4D6")
        if c_i == 10: cell.number_format = "#,##0"

    auto_fit_columns(ws)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output
