from __future__ import annotations

import datetime
import io
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import ForeignEmployee, JanitorAttendanceRecord


FONT_FAMILY = "Times New Roman"

TITLE_FONT = Font(name=FONT_FAMILY, size=18, bold=True, color="000000")
HEADER_FONT = Font(name=FONT_FAMILY, size=11, bold=True, color="000000")
BOLD_FONT = Font(name=FONT_FAMILY, size=11, bold=True, color="000000")
REGULAR_FONT = Font(name=FONT_FAMILY, size=11, color="000000")

FILL_HEADER = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")

BORDER_THIN = Border(
    left=Side(style="thin", color="BFBFBF"),
    right=Side(style="thin", color="BFBFBF"),
    top=Side(style="thin", color="BFBFBF"),
    bottom=Side(style="thin", color="BFBFBF"),
)

NUMBER_FORMAT_CURRENCY = "#,##0"


def generate_janitor_payroll_excel(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> io.BytesIO:
    wb = Workbook()

    # Sheet title: e.g. 01.07-31.07
    sheet_title = f"{start_date.strftime('%d.%m')}-{end_date.strftime('%d.%m')}"
    ws = wb.active
    ws.title = sheet_title

    # Query janitors (include active or those who resigned during/after start_date)
    janitors = (
        db.query(ForeignEmployee)
        .filter(
            ForeignEmployee.employee_type == "JANITORIAL",
            or_(
                ForeignEmployee.resignation_date.is_(None),
                ForeignEmployee.resignation_date >= start_date,
            ),
        )
        .order_by(ForeignEmployee.id)
        .all()
    )

    # Query attendance records in period
    att_records = (
        db.query(JanitorAttendanceRecord)
        .filter(
            JanitorAttendanceRecord.attendance_date >= start_date,
            JanitorAttendanceRecord.attendance_date <= end_date,
        )
        .all()
    )
    att_dict = {(r.employee_id, r.attendance_date): r for r in att_records}


    # Calculate days in period
    date_list: list[datetime.date] = []
    curr = start_date
    while curr <= end_date:
        date_list.append(curr)
        curr += datetime.timedelta(days=1)

    num_days = len(date_list)
    sundays_count = sum(1 for d in date_list if d.weekday() == 6)
    required_workdays = num_days - sundays_count

    # Row 5: Title
    month_year_str = start_date.strftime("%m/%Y")
    title_cell = ws.cell(row=5, column=1, value=f"BẢNG CÔNG-LƯƠNG TẠP VỤ THÁNG {month_year_str}")
    title_cell.font = TITLE_FONT
    title_cell.alignment = Alignment(horizontal="left", vertical="center")


    # Row 6: Day indices 1..num_days
    for i in range(num_days):
        c_cell = ws.cell(row=6, column=11 + i, value=i + 1)
        c_cell.font = REGULAR_FONT
        c_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Row 7: Headers
    headers = [
        (1, "STT"),
        (2, "ca"),
        (3, "Mã số nhân viên\n"),
        (4, "Họ và tên\n"),
        (5, "Tên tiếng Việt"),
        (6, "mã "),
        (7, "Bộ phận"),
        (8, "Nơi làm việc"),
        (9, "Ngày vào làm việc\n"),
        (10, "TV"),
    ]

    for col_idx, text in headers:
        cell = ws.cell(row=7, column=col_idx, value=text)

    # Dates header (row 7)
    for i, d in enumerate(date_list):
        cell = ws.cell(row=7, column=11 + i, value=d.strftime("%d/%m"))

    # Right headers
    col_bonus = 11 + num_days
    col_round_input = 12 + num_days
    col_attendance = 13 + num_days
    col_salary = 14 + num_days
    col_salary_blank = 15 + num_days
    col_amount = 16 + num_days
    col_signature = 17 + num_days

    ws.cell(row=7, column=col_bonus, value="最终奖金")
    ws.cell(row=7, column=col_round_input, value="làm tròn")
    ws.cell(row=7, column=col_attendance, value="总共考勤")
    ws.cell(row=7, column=col_salary, value="薪资")
    ws.cell(row=7, column=col_salary_blank, value="工资")
    ws.cell(row=7, column=col_amount, value="金额")
    ws.cell(row=7, column=col_signature, value="签名")

    # Style header row 7
    for c in range(1, col_signature + 1):
        cell = ws.cell(row=7, column=c)
        cell.font = HEADER_FONT
        cell.fill = FILL_HEADER
        cell.border = BORDER_THIN
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Populate employee rows starting at row 8
    current_row = 8
    stt = 1
    for emp in janitors:
        workday_row = current_row
        ot_row = current_row + 1
        name_accented = emp.name_chinese or emp.name_latin or ""

        # --- Row 1: ngày công ---
        c1 = ws.cell(row=workday_row, column=1, value=stt)
        c2 = ws.cell(row=workday_row, column=2, value="ngày công")
        c3 = ws.cell(row=workday_row, column=3, value=emp.employee_code or "")
        c4 = ws.cell(row=workday_row, column=4, value=name_accented)
        c5 = ws.cell(row=workday_row, column=5, value=name_accented)  # Accented Vietnamese name
        c6 = ws.cell(row=workday_row, column=6, value=emp.employee_code or "")
        c7 = ws.cell(row=workday_row, column=7, value=emp.department or "Nhân Sự/管理课")
        c8 = ws.cell(row=workday_row, column=8, value=emp.workplace_location or "")
        c9 = ws.cell(row=workday_row, column=9, value=emp.entry_date.strftime("%d/%m/%Y") if emp.entry_date else "")
        c10 = ws.cell(row=workday_row, column=10, value="")

        c1.alignment = Alignment(horizontal="center", vertical="center")
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c3.alignment = Alignment(horizontal="center", vertical="center")
        c4.alignment = Alignment(horizontal="left", vertical="center")
        c5.alignment = Alignment(horizontal="left", vertical="center")
        c6.alignment = Alignment(horizontal="center", vertical="center")
        c7.alignment = Alignment(horizontal="left", vertical="center")
        c8.alignment = Alignment(horizontal="center", vertical="center")
        c9.alignment = Alignment(horizontal="center", vertical="center")

        # Fill dates attendance ('N' for Mon-Sat unless recorded, empty for Sun)
        for i, d in enumerate(date_list):
            c_idx = 11 + i
            d_cell = ws.cell(row=workday_row, column=c_idx)
            d_cell.font = REGULAR_FONT
            d_cell.border = BORDER_THIN
            d_cell.alignment = Alignment(horizontal="center", vertical="center")
            if d.weekday() == 6:  # Sunday
                d_cell.value = "-"
            elif emp.resignation_date and d >= emp.resignation_date:
                d_cell.value = "TV"
            else:
                att_rec = att_dict.get((emp.id, d))
                if att_rec:
                    if att_rec.absence_type == "FULL_DAY":
                        d_cell.value = "X"
                    elif att_rec.absence_type == "HALF_DAY":
                        d_cell.value = "N/2"
                    else:
                        d_cell.value = "N"
                else:
                    d_cell.value = "N"

        # Formulas for attendance & salary
        first_day_col = get_column_letter(11)
        last_day_col = get_column_letter(10 + num_days)
        col_att_letter = get_column_letter(col_attendance)
        col_sal_letter = get_column_letter(col_salary)

        # Attendance formula: COUNTIFS for N and N/2
        att_cell = ws.cell(
            row=workday_row,
            column=col_attendance,
            value=f'=+COUNTIFS({first_day_col}{workday_row}:{last_day_col}{workday_row},"N")+COUNTIFS({first_day_col}{workday_row}:{last_day_col}{workday_row},"N/2")*0.5+COUNTIFS({first_day_col}{workday_row}:{last_day_col}{workday_row},"0.5")*0.5',
        )
        att_cell.alignment = Alignment(horizontal="center", vertical="center")

        sal_cell = ws.cell(row=workday_row, column=col_salary, value=emp.salary or 0.0)
        sal_cell.number_format = NUMBER_FORMAT_CURRENCY
        sal_cell.alignment = Alignment(horizontal="right", vertical="center")

        # Amount formula: IF for MONTH, multiplication for DAY
        amt_cell = ws.cell(row=workday_row, column=col_amount)
        if (emp.salary_unit or "").upper() == "DAY":
            amt_cell.value = f"={col_sal_letter}{workday_row}*{col_att_letter}{workday_row}"
        else:
            amt_cell.value = f"=IF({col_att_letter}{workday_row}>={required_workdays}, {col_sal_letter}{workday_row}, ROUND({col_sal_letter}{workday_row}/{required_workdays}*{col_att_letter}{workday_row}, -3))"
        
        amt_cell.number_format = NUMBER_FORMAT_CURRENCY
        amt_cell.alignment = Alignment(horizontal="right", vertical="center")

        sig_cell = ws.cell(row=workday_row, column=col_signature, value=emp.role or "")
        sig_cell.alignment = Alignment(horizontal="left", vertical="center")

        # Apply fonts & borders to row 1
        for col_i in range(1, col_signature + 1):
            c_item = ws.cell(row=workday_row, column=col_i)
            c_item.font = REGULAR_FONT
            c_item.border = BORDER_THIN

        # --- Row 2: tăng ca ---
        ot1 = ws.cell(row=ot_row, column=1, value="")
        ot2 = ws.cell(row=ot_row, column=2, value="tăng ca\n")
        ot3 = ws.cell(row=ot_row, column=3, value=f"=+C{workday_row}")
        ot4 = ws.cell(row=ot_row, column=4, value=f"=+D{workday_row}")
        ot5 = ws.cell(row=ot_row, column=5, value=f"=+E{workday_row}")
        ot6 = ws.cell(row=ot_row, column=6, value=f"=+F{workday_row}")
        ot7 = ws.cell(row=ot_row, column=7, value=f"=+G{workday_row}")
        ot8 = ws.cell(row=ot_row, column=8, value=f"=+H{workday_row}")

        ot2.alignment = Alignment(horizontal="center", vertical="center")
        ot3.alignment = Alignment(horizontal="center", vertical="center")
        ot4.alignment = Alignment(horizontal="left", vertical="center")
        ot5.alignment = Alignment(horizontal="left", vertical="center")
        ot6.alignment = Alignment(horizontal="center", vertical="center")
        ot7.alignment = Alignment(horizontal="left", vertical="center")
        ot8.alignment = Alignment(horizontal="center", vertical="center")

        for col_i in range(1, col_signature + 1):
            c_item = ws.cell(row=ot_row, column=col_i)
            c_item.font = REGULAR_FONT
            c_item.border = BORDER_THIN

        current_row += 2
        stt += 1

    # Total Rows
    if janitors:
        total_row = current_row
        col_amt_letter = get_column_letter(col_amount)
        first_emp_row = 8
        last_emp_row = current_row - 1

        lbl_tot = ws.cell(row=total_row, column=col_salary, value="总共")
        lbl_tot.font = BOLD_FONT
        lbl_tot.alignment = Alignment(horizontal="center", vertical="center")

        tot_cell = ws.cell(
            row=total_row,
            column=col_amount,
            value=f"=SUBTOTAL(9,{col_amt_letter}{first_emp_row}:{col_amt_letter}{last_emp_row})",
        )
        tot_cell.font = BOLD_FONT
        tot_cell.number_format = NUMBER_FORMAT_CURRENCY
        tot_cell.alignment = Alignment(horizontal="right", vertical="center")

        for c in range(1, col_signature + 1):
            cell = ws.cell(row=total_row, column=c)
            cell.border = BORDER_THIN

        round_total_row = total_row + 1
        round_cell = ws.cell(
            row=round_total_row,
            column=col_amount,
            value=f"=ROUND({col_amt_letter}{total_row},-3)",
        )
        round_cell.font = BOLD_FONT
        round_cell.number_format = NUMBER_FORMAT_CURRENCY
        round_cell.alignment = Alignment(horizontal="right", vertical="center")

        for c in range(1, col_signature + 1):
            cell = ws.cell(row=round_total_row, column=c)
            cell.border = BORDER_THIN

    # Fixed explicit column widths so no text is truncated or cut off
    col_widths: dict[int, float] = {
        1: 6.0,    # STT
        2: 14.0,   # ca
        3: 18.0,   # Mã số nhân viên
        4: 25.0,   # Họ và tên
        5: 25.0,   # Tên tiếng Việt (Accented)
        6: 16.0,   # mã
        7: 22.0,   # Bộ phận
        8: 18.0,   # Nơi làm việc
        9: 18.0,   # Ngày vào làm việc
        10: 12.0,  # TV
    }

    # Date columns (11 .. 10 + num_days) width 5.5
    for i in range(num_days):
        col_widths[11 + i] = 5.5

    col_widths[col_bonus] = 14.0
    col_widths[col_round_input] = 14.0
    col_widths[col_attendance] = 14.0
    col_widths[col_salary] = 18.0
    col_widths[col_salary_blank] = 16.0
    col_widths[col_amount] = 20.0
    col_widths[col_signature] = 24.0

    for col_i, w in col_widths.items():
        col_letter = get_column_letter(col_i)
        ws.column_dimensions[col_letter].width = w

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
