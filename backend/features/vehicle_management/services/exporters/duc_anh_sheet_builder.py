from __future__ import annotations

from datetime import datetime
import xlsxwriter
from features.vehicle_management.models import MonthlyVehicleContract, VehicleDispatch

YELLOW_HEADER = "#FFFF00"
YELLOW_ROW    = "#FFFF99"
WHITE_ROW     = "#FFFFFF"
ORANGE_TOTAL  = "#FFC000"


def write_main_sheet(
    wb: xlsxwriter.Workbook,
    contract: MonthlyVehicleContract,
    v: object,
    month_str: str,
    year_str: str,
    days: list[str],
    daily_map: dict[str, list[VehicleDispatch]],
) -> None:
    """Write Sheet 1: BẢNG KÊ CHI TIẾT XUẤT VAT 07."""
    ws = wb.add_worksheet("BẢNG KÊ CHI TIẾT XUẤT VAT 07")

    col_widths = [
        11, 7, 7, 7, 7, 12, 8, 9, 13, 3,
        7, 5, 5, 8, 8, 11, 8, 11, 9, 9,
        9, 9, 9, 11, 7, 9, 16, 12,
    ]
    for i, w in enumerate(col_widths):
        ws.set_column(i, i, w)

    for r0, h in enumerate([24, 18, 40, 30, 18, 24, 18, 20, 50, 50, 30]):
        ws.set_row(r0, h)
    for i in range(len(days)):
        ws.set_row(11 + i, 30)
    total_r0 = 11 + len(days)
    ws.set_row(total_r0, 30)
    ws.set_row(total_r0 + 1, 12)
    ws.set_row(total_r0 + 2, 30)

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
    f_col_hdr  = fmt(bold=True, align="center", text_wrap=True, bg_color=YELLOW_HEADER, border=1, font_size=11)
    f_sig_l    = fmt(bold=True, align="left")
    f_sig_r    = fmt(bold=True, align="right")

    def make_cell_fmts(bg: str | None = None, is_bold: bool = False):
        kw = {"border": 1, "bold": is_bold}
        if bg:
            kw["bg_color"] = bg
        fc  = fmt(align="center", **kw)
        fn  = fmt(num_format="#,##0", align="right", **kw)
        fdt = fmt(num_format="yyyy-mm-dd", align="center", **kw)
        ftm = fmt(num_format="hh:mm", align="center", **kw)
        return fc, fn, fdt, ftm

    w_fc, w_fn, w_fdt, w_ftm = make_cell_fmts(None, False)
    y_fc, y_fn, y_fdt, y_ftm = make_cell_fmts(YELLOW_HEADER, False)
    t_fc, t_fn, _, _         = make_cell_fmts(None, True)

    plate_display = getattr(v, "license_plate", "") or ""

    # Header Block
    ws.merge_range(0, 0, 0, 10, "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_company)
    ws.merge_range(0, 16, 0, 27, "Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam", f_republic)
    ws.merge_range(1, 0, 1, 10, "ĐC: Số 7, Tổ dân phố Hoàng Mai 1, Phường Nếnh, Tỉnh Bắc Ninh, Việt Nam", f_addr)
    ws.merge_range(1, 16, 1, 27, "Độc Lập - Tự Do - Hạnh Phúc", f_iddlp)
    ws.merge_range(2, 0, 2, 27, "BẢNG ĐỐI CHIẾU KHỐI LƯỢNG VÀ GIÁ TRỊ SỬ DỤNG XE Ô TÔ \n租车使用对账明细表", f_title)
    ws.merge_range(3, 0, 3, 27, f"Tháng {month_str} năm {year_str}\n{year_str} 年{month_str}月", f_month)
    ws.merge_range(4, 0, 4, 27, f"Loại xe: 07 chỗ ngồi- BKS: {plate_display}", f_left)
    ws.merge_range(5, 0, 5, 27, f"Bảng kê số {month_str}{year_str} ngày 25/{month_str}/{year_str} kèm hóa đơn số:            kí hiệu:", f_left)
    ws.merge_range(6, 0, 6, 27, "Khách hàng客户: CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_left)
    ws.merge_range(7, 23, 7, 27, "ĐVT: VND", f_dvt)

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
    hdr(8, 12, 9, 12, "Số giờ tăng ca\n时间加班")
    hdr(8, 13, 9, 13, "THÀNH TIỀN\ntăng ca 金额")
    hdr(8, 14, 8, 16, " GIỜ PHỤ TRỘI NGÀY THƯỜNG\n平日超过时间")
    hdr(9, 14, 9, 14, "GIỜ\n工时")
    hdr(9, 15, 9, 15, "ĐƠN GIÁ\n单价")
    hdr(9, 16, 9, 16, "THÀNH TIÊN\n金额")
    hdr(8, 17, 9, 17, "ĐƠN GIÁ NGÀY QUA ĐÊM\n过夜单价")
    hdr(8, 18, 8, 20, "ĐƠN GIÁ NGÀY CN/LỄ\n礼拜天หรือ节日的单价")
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

    km_allowance  = contract.km_allowance or 3000
    base_cost     = contract.base_monthly_cost or 0
    excess_rate   = contract.excess_km_rate or 0
    evening_bonus = contract.evening_fixed_bonus_amount or 0
    overnight_fee = contract.overnight_fee or 300000
    ot_rate_wd    = contract.overtime_rate_weekday or 50000
    std_start     = contract.standard_start_time or "07:00"
    std_end       = contract.standard_end_time or "18:00"

    for col_c in range(28):
        ws.write_blank(10, col_c, "", y_fn)

    ws.write(10, 4, km_allowance, y_fn)
    ws.write(10, 5, base_cost, y_fn)
    ws.write(10, 7, excess_rate, y_fn)
    ws.write_formula(10, 8, "=G11*H11", y_fn)
    ws.write(10, 10, std_start, y_ftm)
    ws.write(10, 11, std_end, y_ftm)
    ws.write_formula(10, 27, "=F11+I11+Q11+R11+T11+X11+Z11+AA11", y_fn)

    DR = 11
    for idx, d_str in enumerate(days):
        r0 = DR + idx
        try:
            is_sunday = (datetime.strptime(d_str, "%Y-%m-%d").weekday() == 6)
        except ValueError:
            is_sunday = False

        fc, fn, fdt, ftm = (y_fc, y_fn, y_fdt, y_ftm) if is_sunday else (w_fc, w_fn, w_fdt, w_ftm)

        for col_c in range(28):
            ws.write_blank(r0, col_c, "", fn)

        ws.write(r0, 0, d_str, fdt)

        trips = daily_map.get(d_str, [])
        if trips:
            trips_s = sorted(trips, key=lambda t: (t.pickup_time or "00:00", t.id))
            ft = trips_s[0]
            lt = trips_s[-1]
            s_km = ft.odometer_km or ft.start_km
            e_km = lt.end_km or lt.odometer_km

            if s_km is not None:
                ws.write(r0, 1, s_km, fn)
            if e_km is not None:
                ws.write(r0, 2, e_km, fn)
            ws.write_formula(r0, 3, f"=+C{r0+1}-B{r0+1}", fn)

            if ft.pickup_time:
                ws.write(r0, 10, ft.pickup_time, ftm)
            if lt.return_time or lt.pickup_time:
                ws.write(r0, 11, lt.return_time or lt.pickup_time, ftm)

            ws.write_formula(r0, 14, f'=IF(OR(AND(K{r0+1}<>"",K{r0+1}<$K$11),AND(L{r0+1}<>"",L{r0+1}>$L$11)),1,0)', fn)
            ws.write(r0, 15, evening_bonus or ot_rate_wd, fn)
            ws.write_formula(r0, 16, f"=O{r0+1}*P{r0+1}", fn)

            day_toll     = sum(getattr(t, "toll_fee", 0.0) or 0.0 for t in trips)
            day_meal     = sum(getattr(t, "meal_count", 0) or 0 for t in trips)
            day_overnight= sum(getattr(t, "overnight_count", 0) or 0 for t in trips)

            if day_overnight > 0:
                ws.write(r0, 17, day_overnight * overnight_fee, fn)
            if day_meal > 0:
                ws.write(r0, 24, day_meal, fc)
                ws.write_formula(r0, 25, f"=Y{r0+1}*50000", fn)
            if day_toll > 0:
                ws.write(r0, 26, day_toll, fn)

            ws.write_formula(r0, 27, f"=SUM(I{r0+1}+N{r0+1}+Q{r0+1}+R{r0+1}+X{r0+1}+Z{r0+1}+AA{r0+1}+U{r0+1})", fn)
        else:
            ws.write_formula(r0, 3, f"=+C{r0+1}-B{r0+1}", fn)
            ws.write_formula(r0, 14, f'=IF(OR(AND(K{r0+1}<>"",K{r0+1}<$K$11),AND(L{r0+1}<>"",L{r0+1}>$L$11)),1,0)', fn)
            ws.write_formula(r0, 16, f"=O{r0+1}*P{r0+1}", fn)
            ws.write_formula(r0, 27, f"=SUM(I{r0+1}+N{r0+1}+Q{r0+1}+R{r0+1}+X{r0+1}+Z{r0+1}+AA{r0+1}+U{r0+1})", fn)

    tr0 = DR + len(days)
    fd1 = DR + 1

    for col_c in range(28):
        ws.write_blank(tr0, col_c, "", t_fn)

    ws.write(tr0, 0, "TỔNG", t_fc)
    ws.write_formula(tr0, 3, f"=+SUM(D{fd1}:D{tr0})", t_fn)
    ws.write_formula(tr0, 4, f"=SUM(E{fd1}:E{tr0})", t_fn)
    ws.write_formula(tr0, 5, f"=SUM(F{fd1}:F{tr0})", t_fn)
    ws.write(tr0, 6, 0, t_fn)
    ws.write_formula(tr0, 7, f"=SUM(H{fd1}:H{tr0})", t_fn)
    ws.write_formula(tr0, 8, f"=+G{tr0+1}*H{tr0+1}", t_fn)
    ws.write_formula(tr0, 12, f"=SUM(M{fd1}:M{tr0})", t_fn)
    ws.write_formula(tr0, 13, f"=SUM(N{fd1}:N{tr0})", t_fn)
    ws.write_formula(tr0, 14, f"=SUM(O{fd1}:O{tr0})", t_fn)
    ws.write_formula(tr0, 16, f"=SUM(Q{fd1}:Q{tr0})", t_fn)
    ws.write_formula(tr0, 17, f"=SUM(R{fd1}:R{tr0})", t_fn)
    ws.write_formula(tr0, 18, f"=SUM(S{fd1}:S{tr0})", t_fn)
    ws.write_formula(tr0, 20, f"=SUM(U{fd1}:U{tr0})", t_fn)
    ws.write_formula(tr0, 21, f"=SUM(V{fd1}:V{tr0})", t_fn)
    ws.write_formula(tr0, 24, f"=SUM(Y{fd1}:Y{tr0})", t_fn)
    ws.write_formula(tr0, 25, f"=SUM(Z{fd1}:Z{tr0})", t_fn)
    ws.write_formula(tr0, 26, f"=SUM(AA{fd1}:AA{tr0})", t_fn)
    ws.write_formula(tr0, 27, f"=SUM(AB{fd1}:AB{tr0})", t_fn)

    sig_r0 = tr0 + 2
    ws.merge_range(sig_r0, 0, sig_r0, 13, "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_sig_l)
    ws.merge_range(sig_r0, 14, sig_r0, 27, "                    CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_sig_r)


def write_dntt_sheet(
    wb: xlsxwriter.Workbook,
    contract: MonthlyVehicleContract,
    v: object,
    month_str: str,
    year_str: str,
    days: list[str],
    daily_map: dict[str, list[VehicleDispatch]],
) -> None:
    """Write Sheet 2: ĐNTT (Đối Nợ Thanh Toán)."""
    ws = wb.add_worksheet("ĐNTT")
    MAIN = "'BẢNG KÊ CHI TIẾT XUẤT VAT 07'"
    total_row = 11 + len(days) + 1

    def fmt(**kw: object) -> xlsxwriter.format.Format:
        base = {"font_name": "Times New Roman", "font_size": 12, "valign": "vcenter"}
        base.update(kw)
        return wb.add_format(base)

    f_title      = fmt(bold=True, font_size=14, align="center", text_wrap=True)
    f_company_l  = fmt(bold=True, font_size=12, align="left")
    f_sub        = fmt(font_size=11, align="left")
    f_bên        = fmt(bold=True, font_size=11, align="left")
    f_label_vi   = fmt(font_size=11, align="left")
    f_label_cn   = fmt(font_size=11, align="left")
    f_qty        = fmt(font_size=11, align="center", border=1)
    f_amount     = fmt(font_size=11, num_format="#,##0", align="right", border=1)
    f_hdr        = fmt(bold=True, font_size=11, align="center", border=1, bg_color=YELLOW_HEADER)
    f_total_amt  = fmt(bold=True, font_size=12, num_format="#,##0", align="right")
    f_sig        = fmt(bold=True, font_size=11, align="center")
    f_date_sig   = fmt(font_size=11, align="right")
    f_sig_title  = fmt(bold=True, font_size=11, align="center")

    ws.set_column(0, 0, 36)
    ws.set_column(1, 1, 29)
    ws.set_column(2, 2, 12)
    ws.set_column(3, 3, 23)

    plate_display = getattr(v, "license_plate", "") or ""
    base_cost     = contract.base_monthly_cost or 0
    excess_rate   = contract.excess_km_rate or 0
    ot_rate_wd    = contract.overtime_rate_weekday or 100000

    ws.set_row(0, 22)
    ws.merge_range(0, 0, 0, 3, "CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_company_l)
    ws.set_row(1, 16)
    ws.merge_range(1, 0, 1, 3, "Địa chỉ : Số 7, Tổ dân phố Hoàng Mai 1, Phường Nếnh, Tỉnh Bắc Ninh, Việt Nam", f_sub)
    ws.set_row(2, 16)
    ws.merge_range(2, 0, 2, 3, "MST: (mã số thuế công ty)", f_sub)
    ws.set_row(3, 16)
    ws.merge_range(3, 0, 3, 3, "Số tài khoản: __________ tại ngân hàng __________ - Chi nhánh __________", f_sub)

    ws.set_row(4, 35)
    ws.merge_range(4, 0, 4, 3, f"ĐỐI NỢ THANH TOÁN THÁNG {month_str}/{year_str}\n{year_str} 年{month_str}月 对账单", f_title)

    ws.set_row(5, 18)
    ws.merge_range(5, 0, 5, 3, "BÊN VẬN CHUYỂN: CÔNG TY TNHH KINH DOANH DỊCH VỤ VẬN TẢI ĐỨC ANH", f_bên)
    ws.set_row(6, 18)
    ws.merge_range(6, 0, 6, 3, "BÊN THUÊ VẬN CHUYỂN: CÔNG TY TNHH CÔNG NGHIỆP NIENYI VIỆT NAM", f_bên)
    ws.set_row(7, 16)
    ws.merge_range(7, 0, 7, 3, "Địa chỉ : Nhà xưởng CN-09-08, CN-09-09, Lô CN-09, Khu công nghiệp Quang Châu", f_sub)
    ws.set_row(8, 16)
    ws.merge_range(8, 0, 8, 3, f"Phí vận chuyển người bằng xe 7 chỗ: {plate_display}", fmt(bold=True, font_size=11, align="left"))

    ws.set_row(9, 30)
    ws.write(9, 0, "内容 Nội dung", f_hdr)
    ws.write(9, 1, "", f_hdr)
    ws.write(9, 2, "数量               Số lượng", f_hdr)
    ws.write(9, 3, " 金额                        Số tiền", f_hdr)

    def row(r0: int, vi: str, cn: str, qty, amt, h: int = 25) -> None:
        ws.set_row(r0, h)
        ws.write(r0, 0, " " + vi, f_label_vi)
        ws.write(r0, 1, cn, f_label_cn)
        if qty is not None:
            if isinstance(qty, str):
                ws.write_formula(r0, 2, qty, f_qty)
            else:
                ws.write(r0, 2, qty, f_qty)
        if amt is not None:
            if isinstance(amt, str):
                ws.write_formula(r0, 3, amt, f_amount)
            else:
                ws.write(r0, 3, amt, f_amount)

    day_count = len([d for d in days if daily_map.get(d)])
    row(10, "Số Km thực tế", "实际公里数", f"={MAIN}!D{total_row}", None)
    row(11, "Số ngày thực tế", "实际天数", day_count, base_cost, 25)
    row(12, "Số giờ phát sinh", "生成的小时数", f"={MAIN}!M{total_row}", f"=C13*{ot_rate_wd}")
    row(13, "Làm từ 18h đến trước 22h", "从18h到晚上22h", f"={MAIN}!O{total_row}", f"=C14*{ot_rate_wd}")
    row(14, "Số giờ ngày Chủ nhật, Ngày lễ", "礼拜天的数量时间", f"={MAIN}!S{total_row}", f"={MAIN}!U{total_row}")
    row(15, "Số KM phát sinh", "出现的KM号码", f"={MAIN}!G{total_row}", f"=C16*{excess_rate}")
    row(16, "Số KM phát sinh CN", "产生的公里数", None, None)
    row(17, "Ngày chủ nhật đi làm", "产生的公里数", None, None)
    row(18, "Lưu đêm", "一夜之间", None, f"={MAIN}!R{total_row}")
    row(19, "Nội bài (ngày nghỉ) / 1 lần", "机场（假日）/ 1次", None, None)
    row(20, "Vé cầu đường, phí gửi xe", "路票，停车费", None, f"={MAIN}!AA{total_row}")
    row(21, "Khác ( Ăn trưa)", "其他（午餐）", f"={MAIN}!Y{total_row}", f"={MAIN}!Z{total_row}")
    row(22, "Giờ phụ trội ngày chủ nhật / lễ", "礼拜天或节日超过时间", None, f"={MAIN}!X{total_row}")

    sub_r0 = 23
    ws.set_row(sub_r0, 25)
    ws.write(sub_r0, 0, " Cộng tiền hàng", fmt(bold=True, font_size=11, align="left"))
    ws.write(sub_r0, 1, "金额", fmt(bold=True, font_size=11, align="left"))
    ws.write_formula(sub_r0, 3, "=SUM(D11:D23)", f_total_amt)

    tax_r0 = 24
    ws.set_row(tax_r0, 22)
    ws.write(tax_r0, 0, " Thuế GTGT 0%", f_label_vi)
    ws.write(tax_r0, 1, "0％增值税", f_label_cn)
    ws.write(tax_r0, 3, 0, f_amount)

    grand_r0 = 25
    ws.set_row(grand_r0, 28)
    ws.write(grand_r0, 0, "Tổng tiền thanh toán", fmt(bold=True, font_size=13, align="left"))
    ws.write(grand_r0, 1, "合计", fmt(bold=True, font_size=13, align="left"))
    ws.write_formula(grand_r0, 3, "=D24+D25", fmt(bold=True, font_size=13, num_format="#,##0", align="right"))

    bchu_r0 = 26
    ws.set_row(bchu_r0, 22)
    ws.merge_range(bchu_r0, 0, bchu_r0, 3, "Bằng chữ: ", fmt(font_size=11, italic=True, align="left"))

    date_r0 = 27
    ws.set_row(date_r0, 22)
    ws.merge_range(date_r0, 1, date_r0, 3, f"Bắc Ninh, ngày 25 tháng {month_str} năm {year_str}", f_date_sig)

    sig_r0 = 28
    ws.set_row(sig_r0, 22)
    ws.write(sig_r0, 0, "承租人Người mua hàng", f_sig_title)
    ws.write(sig_r0, 1, "出租人 Người bán hàng", f_sig_title)

    ws.set_row(sig_r0 + 1, 22)
    ws.write(sig_r0 + 1, 0, "签名(Ký, ghi rõ họ tên)", f_sig)
    ws.write(sig_r0 + 1, 1, "签名(Ký, ghi rõ họ tên)", f_sig)
