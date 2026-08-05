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



from features.vehicle_management.services.binh_an_excel_service import build_binh_an_excel_report
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
    return build_binh_an_excel_report(db, from_date, to_date)




