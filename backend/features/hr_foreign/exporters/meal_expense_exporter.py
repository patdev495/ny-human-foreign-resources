from __future__ import annotations

import datetime
import io
from openpyxl import Workbook
from sqlalchemy.orm import Session

from features.hr_foreign.services.meal_expense_service import calculate_meal_expenses
from .excel_styles import apply_header_style, auto_fit_columns


def generate_meal_expense_excel(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> io.BytesIO:
    report = calculate_meal_expenses(db, start_date=start_date, end_date=end_date)

    wb = Workbook()

    # Sheet 1: NNN - Chi phí Bữa ăn
    ws1 = wb.active
    ws1.title = "NNN - Chi phí Bữa ăn"
    headers1 = [
        "STT",
        "Họ tên Latin",
        "Họ tên Trung Quốc",
        "Số Hộ chiếu",
        "Phòng KTX",
        "Số Ngày Ở",
        "Số Ngày Vắng",
        "Ngày Thường",
        "Ngày Sự Kiện",
        "Tổng Bữa",
        "Thành Tiền (VNĐ)",
    ]
    apply_header_style(ws1, headers1)

    for idx, item in enumerate(report.items, start=1):
        ws1.append([
            idx,
            item.employee_name,
            item.name_chinese or "",
            item.passport_number or "",
            item.room_number,
            item.stay_days,
            item.absent_days,
            item.normal_days,
            item.event_days,
            item.meal_count,
            item.total_cost,
        ])
    auto_fit_columns(ws1)

    # Sheet 2: Lao công - Theo ngày
    ws2 = wb.create_sheet(title="Lao công - Theo ngày")
    headers2 = ["STT", "Ngày", "Số Suất Ăn", "Đơn Giá (VNĐ)", "Thành Tiền (VNĐ)", "Ghi Chú"]
    apply_header_style(ws2, headers2)

    for idx, j_item in enumerate(report.janitor_items, start=1):
        ws2.append([
            idx,
            j_item.date.strftime("%d/%m/%Y"),
            j_item.meal_count,
            j_item.price_per_meal,
            j_item.total_cost,
            j_item.notes or "",
        ])
    auto_fit_columns(ws2)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
