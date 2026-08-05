"""
duc_anh_excel_service.py
========================
Generate Đức Anh vehicle monthly reconciliation Excel report **from code**
using xlsxwriter — no .xlsx template files required.

Sheet 1: BẢNG KÊ CHI TIẾT XUẤT VAT 07   (main reconciliation, 28 cols A..AB)
Sheet 2: ĐNTT                             (Đối Nợ Thanh Toán summary)
"""
from __future__ import annotations

from datetime import datetime, timedelta
from io import BytesIO

import xlsxwriter
from sqlalchemy.orm import Session

from features.vehicle_management.models import MonthlyVehicleContract, VehicleDispatch

# ---------------------------------------------------------------------------
# Color constants (matching original template)
# ---------------------------------------------------------------------------
YELLOW_HEADER = "#FFFF00"   # column header background
YELLOW_ROW    = "#FFFF99"   # alternating data row (odd)
WHITE_ROW     = "#FFFFFF"   # alternating data row (even)
ORANGE_TOTAL  = "#FFC000"   # TỔNG row background


def _xl_col(n: int) -> str:
    """0-indexed int -> Excel column letter."""
    result = ""
    n += 1
    while n:
        n, rem = divmod(n - 1, 26)
        result = chr(65 + rem) + result
    return result


# ---------------------------------------------------------------------------
# Main public API
# ---------------------------------------------------------------------------

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

    _write_main_sheet(wb, contract, v, month_str, year_str, days, daily_map)
    _write_dntt_sheet(wb, contract, v, month_str, year_str, days, daily_map)

    wb.close()
    out.seek(0)
    return out


# ---------------------------------------------------------------------------
# Sheet 1: BANG KE CHI TIET XUAT VAT 07
# ---------------------------------------------------------------------------

def _write_main_sheet(
    wb: xlsxwriter.Workbook,
    contract: MonthlyVehicleContract,
    v: object,
    month_str: str,
    year_str: str,
    days: list[str],
    daily_map: dict[str, list[VehicleDispatch]],
) -> None:
    ws = wb.add_worksheet("BẢNG KÊ CHI TIẾT XUẤT VAT 07")

    # column widths (0-indexed A..AB = 0..27)
    col_widths = [
        11, 7, 7, 7, 7, 12, 8, 9, 13, 3,   # A-J
        7, 5, 5, 8, 8, 11, 8, 11, 9, 9,    # K-T
        9, 9, 9, 11, 7, 9, 16, 12,          # U-AB
    ]
    for i, w in enumerate(col_widths):
        ws.set_column(i, i, w)

    # row heights
    for r0, h in enumerate([24, 18, 40, 30, 18, 24, 18, 20, 50, 50, 30]):
        ws.set_row(r0, h)
    for i in range(len(days)):
        ws.set_row(11 + i, 30)
    total_r0 = 11 + len(days)
    ws.set_row(total_r0, 30)
    ws.set_row(total_r0 + 1, 12)
    ws.set_row(total_r0 + 2, 30)

    # format factory
    def fmt(**kw: object) -> xlsxwriter.format.Format:
        base = {"font_name": "Times New Roman", "font_size": 12, "valign": "vcenter"}
        base.update(kw)
        return wb.add_format(base)

    f_company  = fmt(bold=True, font_size=13)
    f_republic = fmt(font_size=12, align="right")
    f_addr     = fmt(font_size=11)
    f_iddlp    = fmt(font_size=12, align="right")
    f_title    = fmt(bold=True, font_size=14, align="center", text_wrap=True)
    f_month    = fmt(bold=True, font_size=13, align="center", text_wrap=True)
    f_left     = fmt(align="left")
    f_dvt      = fmt(font_size=11, align="right")
    f_col_hdr  = fmt(bold=True, align="center", text_wrap=True,
                     bg_color=YELLOW_HEADER, border=1, font_size=11)
    f_param_n  = fmt(num_format="#,##0", align="right", border=1,
                     bg_color=YELLOW_HEADER, bold=True, font_size=11)
    f_sig_l    = fmt(bold=True, align="left")
    f_sig_r    = fmt(bold=True, align="right")

    # yellow / white row formats
    def make_row_fmts(bg: str) -> tuple:
        fc  = fmt(align="center", bg_color=bg, border=1)
        fn  = fmt(num_format="#,##0", align="right", bg_color=bg, border=1)
        fdt = fmt(num_format="yyyy-mm-dd", align="center", bg_color=bg, border=1)
        ftm = fmt(num_format="hh:mm", align="center", bg_color=bg, border=1)
        return fc, fn, fdt, ftm

    yfc, yfn, yfdt, yftm = make_row_fmts(YELLOW_ROW)
    wfc, wfn, wfdt, wftm = make_row_fmts(WHITE_ROW)

    f_total_lbl = fmt(bold=True, align="center", bg_color=ORANGE_TOTAL, border=1)
    f_total_num = fmt(bold=True, num_format="#,##0", align="right",
                      bg_color=ORANGE_TOTAL, border=1)

    plate_display = getattr(v, "license_plate", "") or ""

    # --- HEADER BLOCK ---
    ws.merge_range(0, 0, 0, 10,
        "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_company)
    ws.merge_range(0, 16, 0, 27, "Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam", f_republic)
    ws.merge_range(1, 0, 1, 10,
        "ĐC: Số 7, Tổ dân phố Hoàng Mai 1, Phường Nếnh, Tỉnh Bắc Ninh, Việt Nam", f_addr)
    ws.merge_range(1, 16, 1, 27, "Độc Lập - Tự Do - Hạnh Phúc", f_iddlp)
    ws.merge_range(2, 0, 2, 27,
        "BẢNG ĐỐI CHIẾU KHỐI LƯỢNG VÀ GIÁ TRỊ SỬ DỤNG XE Ô TÔ \n租车使用对账明细表",
        f_title)
    ws.merge_range(3, 0, 3, 27,
        f"Tháng {month_str} năm {year_str}\n{year_str} 年{month_str}月", f_month)
    ws.merge_range(4, 0, 4, 27, f"Loại xe: 07 chỗ ngồi- BKS: {plate_display}", f_left)
    ws.merge_range(5, 0, 5, 27,
        f"Bảng kê số {month_str}{year_str} ngày 25/{month_str}/{year_str}"
        " kèm hóa đơn số:            kí hiệu:", f_left)
    ws.merge_range(6, 0, 6, 27,
        "Khách hàng客户: CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_left)
    ws.merge_range(7, 23, 7, 27, "ĐVT: VND", f_dvt)

    # --- COLUMN HEADERS (rows 8-9, 0-indexed) ---
    def hdr(r0: int, c0: int, r1: int, c1: int, text: str) -> None:
        if r0 == r1 and c0 == c1:
            ws.write(r0, c0, text, f_col_hdr)
        else:
            ws.merge_range(r0, c0, r1, c1, text, f_col_hdr)

    hdr(8, 0, 9, 0, "NGÀY\n日期")
    hdr(8, 1, 9, 1, "Km đầu\n开始公里")
    hdr(8, 2, 9, 2, "Km cuối\n结束公里")
    hdr(8, 3, 9, 3, "SỐ KM\n使用公里数")
    hdr(8, 4, 8, 5, "SỐ KM TRỌN GÓI THEO HỢP ĐỒNG\n按合同的公里数")
    hdr(9, 4, 9, 4, "SỐ KM\n公里数")
    hdr(9, 5, 9, 5, "GIÁ TRỊ\n金额")
    hdr(8, 6, 8, 8, "KM PHỤ TRỘI NGÀY THƯỜNG\n平日超过公里数")
    hdr(9, 6, 9, 6, "SỐ KM PHỤ TRỘI\n超过公里数")
    hdr(9, 7, 9, 7, "ĐƠN GIÁ\n单价")
    hdr(9, 8, 9, 8, "THÀNH TIỀN\n金额")
    hdr(8, 10, 9, 10, "Giờ B.Đầu\n开始时间")
    hdr(8, 11, 9, 11, "Giờ K.Thúc\n结束时间")
    hdr(8, 12, 8, 13, "Số giờ tăng ca 时间加班")
    hdr(9, 12, 9, 12, "GIỜ\n工时")
    hdr(9, 13, 9, 13, "THÀNH TIỀN\n金额")
    hdr(8, 14, 8, 16, " GIỜ PHỤ TRỘI NGÀY THƯỜNG\n平日超过时间")
    hdr(9, 14, 9, 14, "GIỜ\n工时")
    hdr(9, 15, 9, 15, "ĐƠN GIÁ\n单价")
    hdr(9, 16, 9, 16, "THÀNH TIÊN\n金额")
    hdr(8, 17, 9, 17, "ĐƠN GIÁ NGÀY QUA ĐÊM\n过夜单价")
    hdr(8, 18, 8, 20, "ĐƠN GIÁ NGÀY CN/LỄ\n礼拜天或节日的单价")
    hdr(9, 18, 9, 18, "GIỜ\n工时")
    hdr(9, 19, 9, 19, "ĐƠN GIÁ\n单价")
    hdr(9, 20, 9, 20, "THÀNH TIỀN\n金额")
    hdr(8, 21, 8, 23, " GIỜ PHỤ TRỘI NGÀY CHỦ NHẬT/LỄ\n礼拜天或节日超过时间")
    hdr(9, 21, 9, 21, "GIỜ\n工时")
    hdr(9, 22, 9, 22, "ĐƠN GIÁ\n单价")
    hdr(9, 23, 9, 23, "THÀNH TIỀN\n金额")
    hdr(8, 24, 8, 25, "TIỀN ĂN\n餐费")
    hdr(9, 24, 9, 24, "SỐ BỮA ĂN\n餐数量")
    hdr(9, 25, 9, 25, "THÀNH TIỀN\n金额")
    hdr(8, 26, 9, 26, "TIỀN VÉ XE\n过路费、车票")
    hdr(8, 27, 9, 27, "CỘNG\n合计")

    # --- CONTRACT PARAM ROW (row 11, index 10) ---
    km_allowance  = contract.km_allowance or 3000
    base_cost     = contract.base_monthly_cost or 0
    excess_rate   = contract.excess_km_rate or 0
    evening_bonus = contract.evening_fixed_bonus_amount or 0
    overnight_fee = contract.overnight_fee or 300000
    ot_rate_wd    = contract.overtime_rate_weekday or 50000

    ws.write(10, 4, km_allowance, f_param_n)
    ws.write(10, 5, base_cost, f_param_n)
    ws.write(10, 7, excess_rate, f_param_n)
    ws.write_formula(10, 8, "=G11*H11", f_param_n)
    ws.write_formula(10, 27, "=F11+I11+Q11+R11+T11+X11+Z11+AA11", f_param_n)

    # --- DATA ROWS ---
    DR = 11  # 0-indexed first data row

    for idx, d_str in enumerate(days):
        r0 = DR + idx
        is_yellow = (idx % 2 == 0)
        fc, fn, fdt, ftm = (yfc, yfn, yfdt, yftm) if is_yellow else (wfc, wfn, wfdt, wftm)

        ws.write(r0, 0, d_str, fdt)  # A: NGÀY

        trips = daily_map.get(d_str, [])
        if trips:
            trips_s = sorted(trips, key=lambda t: (t.pickup_time or "00:00", t.id))
            ft = trips_s[0]
            lt = trips_s[-1]

            s_km = ft.odometer_km or ft.start_km
            e_km = lt.end_km or lt.odometer_km

            if s_km is not None:
                ws.write(r0, 1, s_km, fn)   # B
            if e_km is not None:
                ws.write(r0, 2, e_km, fn)   # C
            ws.write_formula(r0, 3, f"=+C{r0+1}-B{r0+1}", fn)  # D

            if ft.pickup_time:
                ws.write(r0, 10, ft.pickup_time, ftm)   # K
            if lt.return_time or lt.pickup_time:
                ws.write(r0, 11, lt.return_time or lt.pickup_time, ftm)  # L

            # O: IF(OR(K<$K$10,L>$L$10),1,0)
            ws.write_formula(r0, 14,
                f"=IF(OR(K{r0+1}<$K$10,L{r0+1}>$L$10),1,0)", fn)  # O
            ws.write(r0, 15, evening_bonus or ot_rate_wd, fn)       # P
            ws.write_formula(r0, 16, f"=O{r0+1}*P{r0+1}", fn)      # Q

            day_toll     = sum(getattr(t, "toll_fee", 0.0) or 0.0 for t in trips)
            day_meal     = sum(getattr(t, "meal_count", 0) or 0 for t in trips)
            day_overnight= sum(getattr(t, "overnight_count", 0) or 0 for t in trips)

            if day_overnight > 0:
                ws.write(r0, 17, day_overnight * overnight_fee, fn)  # R
            if day_meal > 0:
                ws.write(r0, 24, day_meal, fc)                        # Y
                ws.write_formula(r0, 25, f"=Y{r0+1}*50000", fn)      # Z
            if day_toll > 0:
                ws.write(r0, 26, day_toll, fn)                        # AA

            ws.write_formula(r0, 27,
                f"=SUM(I{r0+1}+N{r0+1}+Q{r0+1}+R{r0+1}+X{r0+1}+Z{r0+1}+AA{r0+1}+U{r0+1})",
                fn)  # AB
        else:
            ws.write_formula(r0, 3, f"=+C{r0+1}-B{r0+1}", fn)
            ws.write_formula(r0, 14,
                f"=IF(OR(K{r0+1}<$K$10,L{r0+1}>$L$10),1,0)", fn)
            ws.write_formula(r0, 16, f"=O{r0+1}*P{r0+1}", fn)
            ws.write_formula(r0, 27,
                f"=SUM(I{r0+1}+N{r0+1}+Q{r0+1}+R{r0+1}+X{r0+1}+Z{r0+1}+AA{r0+1}+U{r0+1})",
                fn)

    # --- TONG ROW ---
    tr0 = DR + len(days)   # 0-indexed
    fd1 = DR + 1           # 1-indexed first data row

    ws.write(tr0, 0, "TỔNG", f_total_lbl)
    ws.write_formula(tr0, 3, f"=+SUM(D{fd1}:D{tr0})", f_total_num)
    ws.write_formula(tr0, 4, f"=SUM(E{fd1}:E{tr0})", f_total_num)
    ws.write_formula(tr0, 5, f"=SUM(F{fd1}:F{tr0})", f_total_num)
    ws.write(tr0, 6, 0, f_total_num)
    ws.write_formula(tr0, 7, f"=SUM(H{fd1}:H{tr0})", f_total_num)
    ws.write_formula(tr0, 8, f"=+G{tr0+1}*H{tr0+1}", f_total_num)
    ws.write_formula(tr0, 12, f"=SUM(M{fd1}:M{tr0})", f_total_num)
    ws.write_formula(tr0, 13, f"=SUM(N{fd1}:N{tr0})", f_total_num)
    ws.write_formula(tr0, 14, f"=SUM(O{fd1}:O{tr0})", f_total_num)
    ws.write_formula(tr0, 16, f"=SUM(Q{fd1}:Q{tr0})", f_total_num)
    ws.write_formula(tr0, 17, f"=SUM(R{fd1}:R{tr0})", f_total_num)
    ws.write_formula(tr0, 18, f"=SUM(S{fd1}:S{tr0})", f_total_num)
    ws.write_formula(tr0, 20, f"=SUM(U{fd1}:U{tr0})", f_total_num)
    ws.write_formula(tr0, 21, f"=SUM(V{fd1}:V{tr0})", f_total_num)
    ws.write_formula(tr0, 23, f"=SUM(X{fd1}:X{tr0})", f_total_num)
    ws.write_formula(tr0, 24, f"=SUM(Y{fd1}:Y{tr0})", f_total_num)
    ws.write_formula(tr0, 25, f"=SUM(Z{fd1}:Z{tr0})", f_total_num)
    ws.write_formula(tr0, 26, f"=SUM(AA{fd1}:AA{tr0})", f_total_num)
    ws.write_formula(tr0, 27, f"=SUM(AB{fd1}:AB{tr0})", f_total_num)

    # --- SIGNATURE ---
    sig_r0 = tr0 + 2
    ws.merge_range(sig_r0, 0, sig_r0, 13,
        "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_sig_l)
    ws.merge_range(sig_r0, 14, sig_r0, 27,
        "                    CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_sig_r)

    ws.freeze_panes(11, 0)


# ---------------------------------------------------------------------------
# Sheet 2: DNTT (Doi No Thanh Toan)
# ---------------------------------------------------------------------------

def _write_dntt_sheet(
    wb: xlsxwriter.Workbook,
    contract: MonthlyVehicleContract,
    v: object,
    month_str: str,
    year_str: str,
    days: list[str],
    daily_map: dict[str, list[VehicleDispatch]],
) -> None:
    ws = wb.add_worksheet("ĐNTT")

    def fmt(**kw: object) -> xlsxwriter.format.Format:
        base = {"font_name": "Times New Roman", "font_size": 12, "valign": "vcenter"}
        base.update(kw)
        return wb.add_format(base)

    f_title   = fmt(bold=True, font_size=13, align="center", text_wrap=True)
    f_label   = fmt(bold=True, align="left")
    f_center  = fmt(align="center")
    f_col_hdr = fmt(bold=True, align="center", border=1,
                    bg_color=YELLOW_HEADER, text_wrap=True)
    f_data_c  = fmt(align="center", border=1)
    f_data_n  = fmt(num_format="#,##0", align="right", border=1)
    f_date    = fmt(num_format="yyyy-mm-dd", align="center", border=1)
    f_total   = fmt(bold=True, num_format="#,##0", align="right",
                    border=1, bg_color=ORANGE_TOTAL)
    f_total_l = fmt(bold=True, align="center", border=1, bg_color=ORANGE_TOTAL)
    f_sig     = fmt(bold=True, align="center")

    ws.set_column(0, 0, 5)
    ws.set_column(1, 1, 13)
    ws.set_column(2, 2, 22)
    ws.set_column(3, 3, 18)
    ws.set_column(4, 4, 9)
    ws.set_column(5, 5, 9)
    ws.set_column(6, 6, 9)
    ws.set_column(7, 7, 18)

    plate_display = getattr(v, "license_plate", "") or ""

    ws.set_row(0, 40)
    ws.merge_range(0, 0, 0, 7,
        f"{year_str} 年{month_str}月份的对账单\nBẢNG ĐỐI CHIẾU CÔNG NỢ CƯỚC XE THÁNG {month_str}/{year_str}",
        f_title)

    ws.set_row(1, 22)
    ws.merge_range(1, 0, 1, 7, f"Xe {plate_display}", f_label)

    ws.set_row(2, 10)

    ws.set_row(3, 45)
    ws.write(3, 0, "STT",             f_col_hdr)
    ws.write(3, 1, "NGÀY\n日期",      f_col_hdr)
    ws.write(3, 2, "NỘI DUNG\n内容",  f_col_hdr)
    ws.write(3, 3, "SỐ TIỀN\n金额",   f_col_hdr)
    ws.write(3, 4, "Km đầu\n开始",    f_col_hdr)
    ws.write(3, 5, "Km cuối\n结束",   f_col_hdr)
    ws.write(3, 6, "SỐ KM\n公里数",   f_col_hdr)
    ws.write(3, 7, "GHI CHÚ\n备注",   f_col_hdr)

    DR = 4
    stt = 1
    for idx, d_str in enumerate(days):
        r0 = DR + idx
        ws.set_row(r0, 25)
        trips = daily_map.get(d_str, [])
        if trips:
            trips_s = sorted(trips, key=lambda t: (t.pickup_time or "00:00", t.id))
            ft = trips_s[0]
            lt = trips_s[-1]
            total_cost = sum(t.cost or 0.0 for t in trips)
            s_km = ft.odometer_km or ft.start_km or 0
            e_km = lt.end_km or lt.odometer_km or 0
            km_used = (e_km - s_km) if (e_km and s_km) else 0
            note = " ".join(filter(None, [ft.pickup_time, ft.passenger_name]))
            ws.write(r0, 0, stt,         f_data_c)
            ws.write(r0, 1, d_str,       f_date)
            ws.write(r0, 2, "Đưa đón ca", f_data_c)
            ws.write(r0, 3, total_cost,  f_data_n)
            ws.write(r0, 4, s_km,        f_data_n)
            ws.write(r0, 5, e_km,        f_data_n)
            ws.write(r0, 6, km_used,     f_data_n)
            ws.write(r0, 7, note,        f_data_c)
        else:
            ws.write(r0, 0, stt,  f_data_c)
            ws.write(r0, 1, d_str, f_date)
            ws.write(r0, 2, "",   f_data_c)
            ws.write(r0, 3, 0,    f_data_n)
            ws.write(r0, 4, "",   f_data_c)
            ws.write(r0, 5, "",   f_data_c)
            ws.write(r0, 6, 0,    f_data_n)
            ws.write(r0, 7, "",   f_data_c)
        stt += 1

    total_r0 = DR + len(days)
    ws.set_row(total_r0, 28)
    ws.merge_range(total_r0, 0, total_r0, 2, "TỔNG CỘNG 合计", f_total_l)
    ws.write_formula(total_r0, 3, f"=SUM(D{DR+1}:D{total_r0})", f_total)
    ws.write_formula(total_r0, 6, f"=SUM(G{DR+1}:G{total_r0})", f_total)

    sig_r0 = total_r0 + 2
    ws.set_row(sig_r0, 28)
    ws.merge_range(sig_r0, 0, sig_r0, 3,
        f"Bắc Ninh, ngày 25 tháng {month_str} năm {year_str}", f_center)
    ws.set_row(sig_r0 + 1, 28)
    ws.merge_range(sig_r0 + 1, 0, sig_r0 + 1, 1,
        "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_sig)
    ws.merge_range(sig_r0 + 1, 4, sig_r0 + 1, 7,
        "CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_sig)
