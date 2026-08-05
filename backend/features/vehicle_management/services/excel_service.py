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
    find_sample_template,
    populate_binh_an_from_template,
    populate_vehicle_from_template,
)



def generate_single_vehicle_excel_file(
    db: Session, contract: MonthlyVehicleContract, from_date: str, to_date: str
) -> BytesIO:
    v = contract.vehicle
    template_path = find_sample_template(v.license_plate or "") if v else None

    if template_path and template_path.exists():
        return populate_vehicle_from_template(template_path, db, contract, from_date, to_date)

    # Fallback if template is not found (e.g. mock test environment)
    wb = Workbook()
    ws = wb.active
    ws.title = "BẢNG KÊ CHI TIẾT XUẤT VAT"
    ws.views.sheetView[0].showGridLines = True


    # Title Block without arbitrary fills
    ws["A1"] = "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH"
    ws["A1"].font = Font(name="Times New Roman", size=11, bold=True)
    ws["Q1"] = "Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam"
    ws["Q1"].font = Font(name="Times New Roman", size=11, bold=True)
    ws["Q1"].alignment = Alignment(horizontal="right")

    ws["A2"] = "ĐC: Số 7, Tổ dân phố Hoàng Mai 1, Phường Nếnh, Tỉnh Bắc Ninh, Việt Nam."
    ws["A2"].font = Font(name="Times New Roman", size=9, italic=True)
    ws["Q2"] = "Độc Lập - Tự Do - Hạnh Phúc"
    ws["Q2"].font = Font(name="Times New Roman", size=10, bold=True)
    ws["Q2"].alignment = Alignment(horizontal="right")

    ws["A3"] = "BẢNG ĐỐI CHIẾU KHỐI LƯỢNG VÀ GIÁ TRỊ SỬ DỤNG XE Ô TÔ\n租车使用对账明细表"
    ws["A3"].font = Font(name="Times New Roman", size=14, bold=True)
    ws["A3"].alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws["A4"] = f"Giai đoạn từ ngày {from_date} đến ngày {to_date}"
    ws["A4"].font = Font(name="Times New Roman", size=10, italic=True)
    ws["A4"].alignment = Alignment(horizontal="center", vertical="center")

    ws["A5"] = f"Loại xe: {v.name if v else ''} - BKS: {v.license_plate if v else 'Chưa có'}"
    ws["A5"].font = Font(name="Times New Roman", size=10, bold=True)

    ws["A6"] = "Khách hàng客户: CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM"
    ws["A6"].font = Font(name="Times New Roman", size=10, bold=True)

    ws["Q7"] = "ĐVT: VND"
    ws["Q7"].font = Font(name="Times New Roman", size=9, italic=True)
    ws["Q7"].alignment = Alignment(horizontal="right")

    # Table Headers
    headers_r8 = [
        "NGÀY\n日期", "Km đầu\n开始公里", "Km cuối\n结束公里", "SỐ KM\n使用公里数",
        "SỐ KM TRỌN GÓI THEO HỢP ĐỒNG\n按合同的公里数", "", "KM PHỤ TRỘI NGÀY THƯỜNG\n平日超过公里数", "", "",
        "Giờ B.Đầu\n开始时间", "Giờ K.Thúc\n结束时间", "Số giờ tăng ca\n时间加班", "THÀNH TIỀN tăng ca\n金额加班",
        "TIỀN VÉ XE\n过路费、车票", "TIỀN ĂN\n餐费", "ĐƠN GIÁ QUA ĐÊM\n过夜单价", "CỘNG\n合计"
    ]
    headers_r9 = [
        "", "", "", "", "SỐ KM\n公里数", "GIÁ TRỊ\n金额", "SỐ KM PHỤ TRỘI\n超过公里数", "ĐƠN GIÁ\n单价", "THÀNH TIỀN\n金额",
        "", "", "", "", "", "", "", ""
    ]

    ws.append([]) # Row 7 empty
    ws.append(headers_r8) # Row 8
    ws.append(headers_r9) # Row 9

    for col_i in range(1, len(headers_r8) + 1):
        cell8 = ws.cell(row=8, column=col_i)
        cell9 = ws.cell(row=9, column=col_i)
        cell8.font = Font(name="Times New Roman", size=10, bold=True)
        cell9.font = Font(name="Times New Roman", size=10, bold=True)
        cell8.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell9.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Row 10: Contract Base terms
    row10 = [
        None, None, None, None, contract.km_allowance, contract.base_monthly_cost,
        0, contract.excess_km_rate, "=G10*H10", None, None, None, None, None, None, None,
        "=F10+I10"
    ]
    ws.append(row10) # Row 10
    for col_i in range(1, 18):
        cell = ws.cell(row=10, column=col_i)
        cell.font = Font(name="Times New Roman", size=10, bold=True)
        cell.alignment = Alignment(horizontal="right" if col_i in (5, 6, 7, 8, 9, 17) else "center", vertical="center")
        if col_i in (6, 8, 9, 17):
            cell.number_format = "#,##0"
        elif col_i in (5, 7):
            cell.number_format = "#,##0.0"

    dispatches = (
        db.query(VehicleDispatch)
        .filter(
            VehicleDispatch.vehicle_id == v.id if v else False,
            VehicleDispatch.dispatch_date >= from_date,
            VehicleDispatch.dispatch_date <= to_date,
        )
        .all()
    )

    daily_map = {}
    for d in dispatches:
        daily_map.setdefault(d.dispatch_date, []).append(d)

    try:
        curr_dt = datetime.strptime(from_date, "%Y-%m-%d")
        end_dt = datetime.strptime(to_date, "%Y-%m-%d")
    except ValueError:
        curr_dt = datetime.now()
        end_dt = datetime.now()

    row_idx = 11
    total_km = 0.0
    total_ot_hrs = 0.0
    total_ot_cost = 0.0
    total_toll = 0.0
    total_meal = 0.0
    total_overnight = 0.0

    while curr_dt <= end_dt:
        d_str = curr_dt.strftime("%Y-%m-%d")
        trips = daily_map.get(d_str, [])

        if trips:
            trips_sorted = sorted(trips, key=lambda t: (t.pickup_time or "00:00", t.id))
            f_trip = trips_sorted[0]
            l_trip = trips_sorted[-1]

            s_km = f_trip.odometer_km or f_trip.start_km or 0.0
            e_km = l_trip.end_km or l_trip.odometer_km or s_km
            d_km = max(0.0, e_km - s_km) if (e_km >= s_km) else 0.0
            s_time = f_trip.pickup_time or "08:00"
            e_time = l_trip.return_time or l_trip.pickup_time or "18:00"

            day_toll = sum(getattr(t, "toll_fee", 0.0) or 0.0 for t in trips)
            day_meal_cnt = sum(getattr(t, "meal_count", 0) or 0 for t in trips)
            day_meal_cost = day_meal_cnt * contract.meal_allowance_fee
            day_overnight_cnt = sum(getattr(t, "overnight_count", 0) or 0 for t in trips)
            day_overnight_cost = day_overnight_cnt * contract.overnight_fee
        else:
            s_km = 0.0
            e_km = 0.0
            d_km = 0.0
            s_time = "—"
            e_time = "—"
            day_toll = 0.0
            day_meal_cost = 0.0
            day_overnight_cost = 0.0

        total_km += d_km
        total_toll += day_toll
        total_meal += day_meal_cost
        total_overnight += day_overnight_cost

        ws.append([
            d_str, s_km if trips else "", e_km if trips else "", d_km if trips else 0,
            "", "", "", "", "",
            s_time, e_time, 0, 0,
            day_toll, day_meal_cost, day_overnight_cost, day_toll + day_meal_cost + day_overnight_cost
        ])

        for col_i in range(1, 18):
            cell = ws.cell(row=row_idx, column=col_i)
            cell.font = Font(name="Times New Roman", size=10)
            cell.alignment = Alignment(horizontal="center" if col_i in (1, 10, 11) else "right")
            if col_i in (2, 3, 4):
                cell.number_format = "#,##0.0"
            elif col_i in (13, 14, 15, 16, 17):
                cell.number_format = "#,##0"

        row_idx += 1
        curr_dt += timedelta(days=1)

    out = BytesIO()
    wb.save(out)
    out.seek(0)
    return out



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
