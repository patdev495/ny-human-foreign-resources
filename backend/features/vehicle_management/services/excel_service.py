from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import List, Optional
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


def generate_duc_anh_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    seed_default_vehicles(db)
    wb = Workbook()
    wb.remove(wb.active) # Remove default sheet

    contracts = db.query(MonthlyVehicleContract).join(Vehicle).all()
    duc_anh_contracts = [
        c for c in contracts if c.vehicle and c.vehicle.ownership_group == OwnershipGroup.COMPANY_OWNED
    ]

    # Sheet 1: BÁO CÁO TỔNG HỢP ĐỨC ANH
    ws_summary = wb.create_sheet(title="TỔNG HỢP CƯỚC ĐỨC ANH")
    ws_summary.views.sheetView[0].showGridLines = True

    # Title Block
    ws_summary.merge_cells("A1:L1")
    title_cell = ws_summary["A1"]
    title_cell.value = "BÁO CÁO CHI PHÍ THUÊ XE KHOÁN THÁNG CÔNG TY ĐỨC ANH"
    title_cell.font = Font(name="Segoe UI", size=14, bold=True, color="1F4E78")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")

    ws_summary.merge_cells("A2:L2")
    sub_cell = ws_summary["A2"]
    sub_cell.value = f"Giai đoạn đối chiếu: Từ ngày {from_date} đến ngày {to_date}"
    sub_cell.font = Font(name="Segoe UI", size=10, italic=True, color="4B5563")
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")

    headers_summary = [
        "STT",
        "Tên Xe / Biển Số",
        "Tên Hợp Đồng",
        "Giá Khoán Cố Định (đ)",
        "KM Hạn Mức",
        "KM Thực Tế",
        "KM Phụ Trội",
        "Tiền KM Phụ Trội (đ)",
        "Giờ Tăng Ca",
        "Tiền Tăng Ca (đ)",
        "Phụ Phí / Ca Tối (đ)",
        "TỔNG THÀNH TIỀN (đ)",
    ]

    ws_summary.append([]) # row 3 blank
    ws_summary.append(headers_summary) # row 4
    for col_idx in range(1, len(headers_summary) + 1):
        style_header_cell(ws_summary.cell(row=4, column=col_idx))

    row_num = 5
    grand_total = 0.0

    # Process each vehicle
    for idx, c in enumerate(duc_anh_contracts, 1):
        v = c.vehicle
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

        total_km = 0.0
        total_ot_hours = 0.0
        total_ot_cost = 0.0
        total_surcharges = 0.0

        daily_rows = []

        for d_date in sorted(daily_map.keys()):
            trips = sorted(daily_map[d_date], key=lambda t: (t.pickup_time or "00:00", t.id))
            f_trip = trips[0]
            l_trip = trips[-1]

            s_km = f_trip.odometer_km or f_trip.start_km or 0.0
            e_km = l_trip.end_km or l_trip.odometer_km or s_km
            d_km = max(0.0, e_km - s_km) if (e_km and s_km and e_km >= s_km) else 0.0
            total_km += d_km

            s_time = f_trip.pickup_time
            e_time = l_trip.return_time or l_trip.pickup_time
            s_mins = parse_time_to_minutes(s_time)
            e_mins = parse_time_to_minutes(e_time)

            date_obj = datetime.strptime(d_date, "%Y-%m-%d")
            is_sunday = date_obj.weekday() == 6

            std_start_mins = parse_time_to_minutes(c.sunday_standard_start_time if is_sunday else c.standard_start_time) or (450 if is_sunday else 420)
            std_end_mins = parse_time_to_minutes(c.sunday_standard_end_time if is_sunday else c.standard_end_time) or 1080
            ot_rate = c.overtime_rate_weekend if is_sunday else c.overtime_rate_weekday

            day_surcharge = 0.0
            if is_sunday and c.sunday_daily_rate > 0:
                day_surcharge += c.sunday_daily_rate

            day_ot_hours = 0.0
            if s_mins is not None and e_mins is not None:
                early_mins = max(0, std_start_mins - s_mins)
                early_hours = early_mins / 60.0
                late_hours = 0.0

                if c.evening_fixed_bonus_amount > 0 and c.evening_fixed_bonus_start:
                    b_start = parse_time_to_minutes(c.evening_fixed_bonus_start) or 1080
                    b_end = parse_time_to_minutes(c.evening_fixed_bonus_end) or 1320
                    if e_mins > b_start and not is_sunday:
                        day_surcharge += c.evening_fixed_bonus_amount
                    if e_mins > b_end and not is_sunday:
                        late_hours = (e_mins - b_end) / 60.0
                    elif is_sunday:
                        late_hours = max(0, e_mins - std_end_mins) / 60.0
                else:
                    late_hours = max(0, e_mins - std_end_mins) / 60.0

                day_ot_hours = round(early_hours + late_hours, 1)

            day_ot_cost = day_ot_hours * ot_rate
            total_ot_hours += day_ot_hours
            total_ot_cost += day_ot_cost
            total_surcharges += day_surcharge

            daily_rows.append({
                "date": d_date,
                "pickup_time": s_time or "—",
                "return_time": e_time or "—",
                "start_km": s_km,
                "end_km": e_km,
                "daily_km": d_km,
                "ot_hours": day_ot_hours,
                "surcharge": day_surcharge,
                "notes": f_trip.notes or "",
            })

        excess_km = max(0.0, total_km - c.km_allowance)
        excess_cost = excess_km * c.excess_km_rate
        item_total = c.base_monthly_cost + excess_cost + total_ot_cost + total_surcharges
        grand_total += item_total

        # Append row to Summary sheet
        row_data = [
            idx,
            f"{v.name} ({v.license_plate or 'Chưa có biển'})",
            c.contract_name,
            c.base_monthly_cost,
            c.km_allowance,
            total_km,
            excess_km,
            excess_cost,
            total_ot_hours,
            total_ot_cost,
            total_surcharges,
            item_total,
        ]
        ws_summary.append(row_data)

        # Style summary row
        for col_i in range(1, 13):
            cell = ws_summary.cell(row=row_num, column=col_i)
            align = "center" if col_i == 1 else "left" if col_i in (2, 3) else "right"
            style_data_cell(cell, align=align)
            if col_i in (4, 8, 10, 11, 12):
                cell.number_format = "#,##0"
            elif col_i in (5, 6, 7):
                cell.number_format = "#,##0.0"

        row_num += 1

        # Create Individual Sheet for this specific vehicle!
        sheet_title = f"Xe {v.license_plate or v.name[:15]}"
        ws_v = wb.create_sheet(title=sheet_title)
        ws_v.views.sheetView[0].showGridLines = True

        ws_v.merge_cells("A1:J1")
        vt_cell = ws_v["A1"]
        vt_cell.value = f"BẢNG KÊ CHI TIẾT NHẬT KÝ ĐIỀU XE & CÔNG TƠ MÉT — {v.name}"
        vt_cell.font = Font(name="Segoe UI", size=13, bold=True, color="1F4E78")
        vt_cell.alignment = Alignment(horizontal="center", vertical="center")

        ws_v.merge_cells("A2:J2")
        vsub_cell = ws_v["A2"]
        vsub_cell.value = f"Biển số: {v.license_plate or '—'} | Lái xe: {v.driver_name or '—'} | SĐT: {v.driver_phone or '—'} | Chu kỳ: {from_date} đến {to_date}"
        vsub_cell.font = Font(name="Segoe UI", size=9, italic=True, color="4B5563")
        vsub_cell.alignment = Alignment(horizontal="center", vertical="center")

        headers_v = [
            "STT", "Ngày Ghi Nhận", "Chuyến 1 (Giờ Đón)", "Chuyến Cuối (Giờ Về)",
            "KM Đồng Hồ Đầu", "KM Đồng Hồ Cuối", "KM Di Chuyển (KM)", "Giờ Tăng Ca (Giờ)",
            "Phụ Cấp / Phụ Phí (đ)", "Ghi Chú",
        ]
        ws_v.append([])
        ws_v.append(headers_v)
        for c_i in range(1, 11):
            style_header_cell(ws_v.cell(row=4, column=c_i))

        for d_idx, r in enumerate(daily_rows, 1):
            ws_v.append([
                d_idx, r["date"], r["pickup_time"], r["return_time"],
                r["start_km"], r["end_km"], r["daily_km"], r["ot_hours"],
                r["surcharge"], r["notes"],
            ])
            cur_r = 4 + d_idx
            for c_i in range(1, 11):
                cell = ws_v.cell(row=cur_r, column=c_i)
                align = "center" if c_i in (1, 2, 3, 4) else "right" if c_i in (5, 6, 7, 8, 9) else "left"
                style_data_cell(cell, align=align)
                if c_i in (5, 6, 7):
                    cell.number_format = "#,##0.0"
                elif c_i == 9:
                    cell.number_format = "#,##0"

        # Footer row for vehicle sheet
        v_footer_row = 5 + len(daily_rows)
        ws_v.append(["TỔNG CỘNG KHỐI LƯỢNG", "", "", "", "", "", total_km, total_ot_hours, total_surcharges, ""])
        ws_v.merge_cells(start_row=v_footer_row, start_column=1, end_row=v_footer_row, end_column=6)
        for c_i in range(1, 11):
            cell = ws_v.cell(row=v_footer_row, column=c_i)
            style_data_cell(cell, align="right" if c_i in (7, 8, 9) else "center", is_bold=True, bg_color="F2F4F7")
            if c_i == 7: cell.number_format = "#,##0.0"
            elif c_i == 9: cell.number_format = "#,##0"

        auto_fit_columns(ws_v)

    # Footer row for Summary Sheet
    summary_footer_row = 5 + len(duc_anh_contracts)
    ws_summary.append(["TỔNG CỘNG CHI PHÍ THUÊ XE THÁNG ĐỨC ANH", "", "", "", "", "", "", "", "", "", "", grand_total])
    ws_summary.merge_cells(start_row=summary_footer_row, start_column=1, end_row=summary_footer_row, end_column=11)
    for c_i in range(1, 13):
        cell = ws_summary.cell(row=summary_footer_row, column=c_i)
        style_data_cell(cell, align="right" if c_i == 12 else "center", is_bold=True, bg_color="E6F0FA")
        if c_i == 12: cell.number_format = "#,##0"

    auto_fit_columns(ws_summary)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def generate_binh_an_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
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
