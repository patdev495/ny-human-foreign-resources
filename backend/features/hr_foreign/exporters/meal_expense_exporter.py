from __future__ import annotations

import datetime
import io
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    ForeignEmployee,
    MealAbsence,
    MealPriceConfig,
    MealSessionLock,
    Stay,
)


HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="000000")
TITLE_FONT = Font(name="Calibri", size=14, bold=True)
PRICE_NOTE_FONT = Font(name="Calibri", size=11, italic=True)
BOLD_FONT = Font(name="Calibri", size=11, bold=True)
REGULAR_FONT = Font(name="Calibri", size=11)

BORDER_THIN = Border(
    left=Side(style="thin", color="D9D9D9"),
    right=Side(style="thin", color="D9D9D9"),
    top=Side(style="thin", color="D9D9D9"),
    bottom=Side(style="thin", color="D9D9D9"),
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

    # Style header rows 6-7 (no background fill, black bold text, thin border)
    for r in range(6, 8):
        for c in range(1, 15):
            cell = ws.cell(row=r, column=c)
            cell.font = HEADER_FONT
            cell.border = BORDER_THIN
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Merge header cells matching sample report layout
    ws.merge_cells("A6:A7")
    ws.merge_cells("B6:B7")
    ws.merge_cells("C6:E6")
    ws.merge_cells("F6:H6")
    ws.merge_cells("I6:I7")
    ws.merge_cells("J6:L6")
    ws.merge_cells("M6:M7")
    ws.merge_cells("N6:N7")

    # Fetch locks & configs
    locks = (
        db.query(MealSessionLock)
        .filter(MealSessionLock.lock_date >= start_date, MealSessionLock.lock_date <= end_date)
        .all()
    )
    locks_map = {(l.lock_date, l.meal_session): l for l in locks}

    event_days_map = {
        ev.event_date: ev
        for ev in db.query(EventDay)
        .filter(EventDay.event_date >= start_date, EventDay.event_date <= end_date)
        .all()
    }

    # Stays & Absences
    eligible_stays = (
        db.query(Stay)
        .filter(
            Stay.accommodation_type == "KTX",
            Stay.has_meals == True,
            Stay.start_date <= end_date,
            or_(Stay.end_date.is_(None), Stay.end_date >= start_date),
        )
        .all()
    )

    # DORMITORY janitors count (excluding DAY salary unit)
    dorm_janitors_count = (
        db.query(ForeignEmployee)
        .filter(
            ForeignEmployee.role.ilike("%tạp vụ%") | ForeignEmployee.role.ilike("%lao công%"),
            ForeignEmployee.workplace_location == "DORMITORY",
            or_(
                ForeignEmployee.salary_unit != "DAY",
                ForeignEmployee.salary_unit.is_(None),
            ),
        )
        .count()
    )
    if dorm_janitors_count == 0:
        dorm_janitors_count = 2  # default 2 janitors at KTX

    curr_d = start_date
    day_idx = 0

    while curr_d <= end_date:
        r = 8 + day_idx
        ws.cell(row=r, column=1, value=day_idx + 1).font = REGULAR_FONT
        ws.cell(row=r, column=2, value=curr_d).font = REGULAR_FONT

        is_sunday = (curr_d.weekday() == 6)

        if is_sunday:
            # Sunday formatting: fill hyphen "-" for counts, prices, and totals
            for col_c in range(3, 14):
                ws.cell(row=r, column=col_c, value="-")
            ws.cell(row=r, column=14, value="Chủ nhật")
        else:
            # Working day
            ev_day = event_days_map.get(curr_d)
            day_type = ev_day.event_type if ev_day else "NORMAL"

            price_cfg = (
                db.query(MealPriceConfig)
                .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= curr_d)
                .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
                .first()
            )

            bf_lock = locks_map.get((curr_d, "BREAKFAST"))
            dn_lock = locks_map.get((curr_d, "DINNER"))
            lc_lock = locks_map.get((curr_d, "LUNCH"))

            # Sáng NNN
            bf_price = bf_lock.locked_price_per_meal if bf_lock else (float(price_cfg.foreign_breakfast_price) if price_cfg else 20000.0)
            if bf_lock:
                bf_count = bf_lock.final_meal_count
            else:
                bf_count = 0
                for stay in eligible_stays:
                    if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                        absent = db.query(MealAbsence).filter(
                            MealAbsence.stay_id == stay.id,
                            MealAbsence.absence_date == curr_d,
                            MealAbsence.meal_type.in_(["BREAKFAST", "ALL_DAY"]),
                        ).first()
                        if not absent:
                            bf_count += 1

            # Tối NNN
            dn_price = dn_lock.locked_price_per_meal if dn_lock else (float(price_cfg.foreign_dinner_price) if price_cfg else 35000.0)
            if dn_lock:
                dn_count = dn_lock.final_meal_count
            else:
                dn_count = 0
                for stay in eligible_stays:
                    if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                        absent = db.query(MealAbsence).filter(
                            MealAbsence.stay_id == stay.id,
                            MealAbsence.absence_date == curr_d,
                            MealAbsence.meal_type.in_(["DINNER", "ALL_DAY"]),
                        ).first()
                        if not absent:
                            dn_count += 1

            # Tạp vụ (Lao công)
            janitor_price = lc_lock.locked_price_per_meal if lc_lock else (float(price_cfg.janitor_meal_price) if price_cfg else 20000.0)
            janitor_count = lc_lock.final_meal_count if lc_lock else dorm_janitors_count

            # Fruit allowance
            fruit_val = float(price_cfg.fruit_allowance_price) if (price_cfg and price_cfg.fruit_allowance_price) else 60000.0

            ws.cell(row=r, column=3, value=f"=D{r}*E{r}")
            ws.cell(row=r, column=4, value=bf_count)
            ws.cell(row=r, column=5, value=bf_price)

            ws.cell(row=r, column=6, value=f"=G{r}*H{r}")
            ws.cell(row=r, column=7, value=dn_count)
            ws.cell(row=r, column=8, value=dn_price)

            ws.cell(row=r, column=9, value=fruit_val)

            ws.cell(row=r, column=10, value=f"=K{r}*L{r}")
            ws.cell(row=r, column=11, value=janitor_count)
            ws.cell(row=r, column=12, value=janitor_price)

            ws.cell(row=r, column=13, value=f"=C{r}+F{r}+I{r}+J{r}")
            ws.cell(row=r, column=14, value=ev_day.notes if ev_day else None)

        # Style data row
        for c in range(1, 15):
            cell = ws.cell(row=r, column=c)
            cell.font = REGULAR_FONT
            cell.border = BORDER_THIN
            cell.alignment = Alignment(horizontal="center", vertical="center")
            if not is_sunday and c in [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:
                cell.number_format = "#,##0"

        curr_d += datetime.timedelta(days=1)
        day_idx += 1

    # Total summary row
    last_r = 8 + day_idx - 1
    tot_r = last_r + 1

    cell_tot_label = ws.cell(row=tot_r, column=1, value="总 共")
    cell_tot_label.font = BOLD_FONT
    cell_tot_label.border = BORDER_THIN
    cell_tot_label.alignment = Alignment(horizontal="center", vertical="center")

    for c in range(2, 15):
        cell = ws.cell(row=tot_r, column=c)
        cell.font = BOLD_FONT
        cell.border = BORDER_THIN
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
