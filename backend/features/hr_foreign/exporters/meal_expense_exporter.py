from __future__ import annotations

import datetime
import io
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from features.hr_foreign.services.meal_calculation_engine import MealCalculationEngine



HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="000000")
TITLE_FONT = Font(name="Calibri", size=14, bold=True)
PRICE_NOTE_FONT = Font(name="Calibri", size=11, italic=True)
BOLD_FONT = Font(name="Calibri", size=11, bold=True)
REGULAR_FONT = Font(name="Calibri", size=11)

GRID_SIDE = Side(style="thin", color="AAB8C7")
GROUP_SIDE = Side(style="medium", color="526579")
GROUP_START_COLUMNS = {1, 3, 6, 9, 10, 13, 14}
HEADER_FILLS = {
    3: "E7F0FA", 4: "E7F0FA", 5: "E7F0FA",
    6: "FFF0E3", 7: "FFF0E3", 8: "FFF0E3",
    9: "E9F5E9",
    10: "F1EDFA", 11: "F1EDFA", 12: "F1EDFA",
    13: "FFF0BF",
}
TOTAL_FILL = PatternFill(fill_type="solid", fgColor="E4EBF2")


def _table_border(column: int, row: int, total_row: bool = False) -> Border:
    return Border(
        left=GROUP_SIDE if column in GROUP_START_COLUMNS else GRID_SIDE,
        right=GROUP_SIDE if column == 14 else GRID_SIDE,
        top=GROUP_SIDE if row == 6 or total_row else GRID_SIDE,
        bottom=GROUP_SIDE if total_row else GRID_SIDE,
    )


def generate_meal_expense_excel(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> io.BytesIO:
    wb = Workbook()

    # Sheet title: e.g. 27.07-26.08
    sheet_title = f"{start_date.strftime('%d.%m')}-{end_date.strftime('%d.%m')}"
    ws = wb.active
    ws.title = sheet_title

    # Header block
    ws.cell(row=1, column=1, value="CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM").font = BOLD_FONT
    ws.cell(row=1, column=13, value="ăn sáng :20k").font = PRICE_NOTE_FONT
    ws.cell(row=2, column=1, value="Đ/c:Nhà xưởng CN 09-08, CN 09-09, lô CN-09, khu công nghiệp Vân Trung, Phường Nếnh,  tỉnh Bắc Ninh, Việt Nam.").font = REGULAR_FONT
    ws.cell(row=2, column=13, value="ăn trưa / tối :35k").font = PRICE_NOTE_FONT

    ws.cell(
        row=4,
        column=1,
        value=f"DANH SÁCH THANH TOÁN TIỀN ĂN\n付款饭费{start_date.strftime('%Y/%m/%d')} 到 {end_date.strftime('%Y/%m/%d')}",
    ).font = TITLE_FONT
    ws.cell(row=4, column=13, value="chủ tịch sang :50k").font = PRICE_NOTE_FONT

    # Header row 6 & 7
    ws.cell(row=6, column=1, value="Stt")
    ws.cell(row=6, column=2, value="Ngày 日")
    ws.cell(row=6, column=3, value="Buổi sáng 早饭")
    ws.cell(row=6, column=6, value="Buổi tối 晚饭")
    ws.cell(row=6, column=9, value="hoa quả \n水果钱")
    ws.cell(row=6, column=10, value="Suất ăn tạp vụ\n钱餐 service")
    ws.cell(row=6, column=13, value="Tổng tiền\n 一共")
    ws.cell(row=6, column=14, value="Ghi chú\n笔记")

    ws.cell(row=7, column=3, value="Số tiền thực chi suất ăn 金额")
    ws.cell(row=7, column=4, value="Suất ăn 吨饭")
    ws.cell(row=7, column=5, value="trị giá  suất ăn 1 người1人份食物")
    ws.cell(row=7, column=6, value="Số tiền thực chi suất ăn 金额")
    ws.cell(row=7, column=7, value="Suất ăn 吨饭")
    ws.cell(row=7, column=8, value="trị giá  suất ăn 1 người1人份食物")
    ws.cell(row=7, column=10, value="Số tiền thực chi suất ăn 金额")
    ws.cell(row=7, column=11, value="Suất ăn 吨饭")
    ws.cell(row=7, column=12, value="trị giá  suất ăn 1 người1人份食物")

    # Merge header cells matching sample report layout
    ws.merge_cells("A6:A7")
    ws.merge_cells("B6:B7")
    ws.merge_cells("C6:E6")
    ws.merge_cells("F6:H6")
    ws.merge_cells("I6:I7")
    ws.merge_cells("J6:L6")
    ws.merge_cells("M6:M7")
    ws.merge_cells("N6:N7")

    # Shade each cost group and draw stronger boundaries around the table.
    for r in range(6, 8):
        for c in range(1, 15):
            cell = ws.cell(row=r, column=c)
            cell.font = HEADER_FONT
            cell.border = _table_border(c, r)
            if c in HEADER_FILLS:
                color = HEADER_FILLS[c]
                cell.fill = PatternFill(fill_type="solid", fgColor=color)
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Fetch pre-calculated daily breakdown items from Deep MealCalculationEngine
    daily_items = MealCalculationEngine.get_daily_expense_breakdown_items(db, start_date, end_date)

    day_idx = 0
    for day_idx, item in enumerate(daily_items):
        r = 8 + day_idx
        ws.cell(row=r, column=1, value=day_idx + 1).font = REGULAR_FONT
        ws.cell(row=r, column=2, value=item.date).font = REGULAR_FONT

        if item.is_sunday:
            # Sunday formatting: fill hyphen "-" for counts, prices, and totals
            for col_c in range(3, 14):
                ws.cell(row=r, column=col_c, value="-")
            ws.cell(row=r, column=14, value="Chủ nhật")
        else:
            # Working day
            ws.cell(row=r, column=3, value=f"=D{r}*E{r}")
            ws.cell(row=r, column=4, value=item.breakfast_count)
            ws.cell(row=r, column=5, value=item.breakfast_price)

            ws.cell(row=r, column=6, value=f"=G{r}*H{r}")
            ws.cell(row=r, column=7, value=item.dinner_count)
            ws.cell(row=r, column=8, value=item.dinner_price)

            ws.cell(row=r, column=9, value=item.fruit_allowance)

            ws.cell(row=r, column=10, value=f"=K{r}*L{r}")
            ws.cell(row=r, column=11, value=item.janitor_count)
            ws.cell(row=r, column=12, value=item.janitor_price)

            ws.cell(row=r, column=13, value=f"=C{r}+F{r}+I{r}+J{r}")
            ws.cell(row=r, column=14, value=item.notes)

        # Style data row
        for c in range(1, 15):
            cell = ws.cell(row=r, column=c)
            cell.font = REGULAR_FONT
            cell.border = _table_border(c, r)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            if not item.is_sunday and c in [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:
                cell.number_format = "#,##0"


    # Total summary row
    last_r = 8 + len(daily_items) - 1
    tot_r = last_r + 1

    cell_tot_label = ws.cell(row=tot_r, column=1, value="总 共")
    cell_tot_label.font = BOLD_FONT
    cell_tot_label.border = _table_border(1, tot_r, total_row=True)
    cell_tot_label.fill = TOTAL_FILL
    cell_tot_label.alignment = Alignment(horizontal="center", vertical="center")

    for c in range(2, 15):
        cell = ws.cell(row=tot_r, column=c)
        cell.font = BOLD_FONT
        cell.border = _table_border(c, tot_r, total_row=True)
        cell.fill = TOTAL_FILL
        cell.alignment = Alignment(horizontal="center", vertical="center")
        if c in range(3, 14):
            col_let = get_column_letter(c)
            cell.value = f"=SUM({col_let}8:{col_let}{last_r})"
            cell.number_format = "#,##0"

    # Fit column widths
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = 16

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
