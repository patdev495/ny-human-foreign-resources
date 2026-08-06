from __future__ import annotations

import datetime


def build_doc_warning_email_html(
    expired_docs: list[dict],
    expiring_docs: list[dict],
    missing_docs: list[dict] | None = None,
    system_url: str = "",
) -> str:
    now_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")

    expired_table_rows = ""
    for idx, item in enumerate(expired_docs, 1):
        days_overdue = abs(item.get("days_diff", 0))
        expired_table_rows += f"""
        <tr style="border-bottom: 1px solid #fee2e2; background-color: #fff5f5;">
            <td style="padding: 10px; text-align: center; color: #991b1b; font-weight: bold;">{idx}</td>
            <td style="padding: 10px; color: #1e293b; font-weight: bold;">{item.get("employee_code") or "-"}</td>
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">{item.get("name_latin", "")}</td>
            <td style="padding: 10px; color: #475569;">{item.get("nationality") or "-"}</td>
            <td style="padding: 10px; color: #991b1b; font-weight: bold;">{item.get("doc_type", "")}</td>
            <td style="padding: 10px; color: #334155; font-family: monospace;">{item.get("doc_number") or "-"}</td>
            <td style="padding: 10px; color: #991b1b; font-weight: bold;">{item.get("expiry_date", "")}</td>
            <td style="padding: 10px; text-align: center; color: #dc2626; font-weight: bold;">Quá {days_overdue} ngày</td>
        </tr>
        """

    expiring_table_rows = ""
    for idx, item in enumerate(expiring_docs, 1):
        days_left = item.get("days_diff", 0)
        expiring_table_rows += f"""
        <tr style="border-bottom: 1px solid #fef3c7; background-color: #fffbeb;">
            <td style="padding: 10px; text-align: center; color: #92400e; font-weight: bold;">{idx}</td>
            <td style="padding: 10px; color: #1e293b; font-weight: bold;">{item.get("employee_code") or "-"}</td>
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">{item.get("name_latin", "")}</td>
            <td style="padding: 10px; color: #475569;">{item.get("nationality") or "-"}</td>
            <td style="padding: 10px; color: #b45309; font-weight: bold;">{item.get("doc_type", "")}</td>
            <td style="padding: 10px; color: #334155; font-family: monospace;">{item.get("doc_number") or "-"}</td>
            <td style="padding: 10px; color: #b45309; font-weight: bold;">{item.get("expiry_date", "")}</td>
            <td style="padding: 10px; text-align: center; color: #d97706; font-weight: bold;">Còn {days_left} ngày</td>
        </tr>
        """

    # --- Missing info section rows ---
    missing_docs = missing_docs or []
    missing_table_rows = ""
    for idx, item in enumerate(missing_docs, 1):
        missing_table_rows += f"""
        <tr style="border-bottom: 1px solid #e0e7ff; background-color: #f5f7ff;">
            <td style="padding: 10px; text-align: center; color: #3730a3; font-weight: bold;">{idx}</td>
            <td style="padding: 10px; color: #1e293b; font-weight: bold;">{item.get("employee_code") or "-"}</td>
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">{item.get("name_latin", "")}</td>
            <td style="padding: 10px; color: #475569;">{item.get("nationality") or "-"}</td>
            <td style="padding: 10px; color: #4338ca; font-weight: bold;">{item.get("doc_type", "")}</td>
            <td style="padding: 10px; color: #64748b; font-style: italic;">{item.get("missing_reason", "Thiếu thông tin")}</td>
        </tr>
        """

    expired_section = ""
    if expired_docs:
        expired_section = f"""
        <div style="margin-bottom: 24px;">
            <h3 style="color: #dc2626; margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                🔴 DANH SÁCH GIẤY TỜ ĐÃ HẾT HẠN ({len(expired_docs)} giấy tờ)
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border: 1px solid #fca5a5;">
                <thead>
                    <tr style="background-color: #fee2e2; color: #991b1b;">
                        <th style="padding: 10px; text-align: center;">STT</th>
                        <th style="padding: 10px;">Mã NV</th>
                        <th style="padding: 10px;">Họ và tên</th>
                        <th style="padding: 10px;">Quốc tịch</th>
                        <th style="padding: 10px;">Loại giấy tờ</th>
                        <th style="padding: 10px;">Số giấy tờ</th>
                        <th style="padding: 10px;">Ngày hết hạn</th>
                        <th style="padding: 10px; text-align: center;">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {expired_table_rows}
                </tbody>
            </table>
        </div>
        """

    expiring_section = ""
    if expiring_docs:
        expiring_section = f"""
        <div style="margin-bottom: 24px;">
            <h3 style="color: #d97706; margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                🟡 DANH SÁCH GIẤY TỜ SẮP HẾT HẠN ({len(expiring_docs)} giấy tờ)
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border: 1px solid #fde68a;">
                <thead>
                    <tr style="background-color: #fef3c7; color: #92400e;">
                        <th style="padding: 10px; text-align: center;">STT</th>
                        <th style="padding: 10px;">Mã NV</th>
                        <th style="padding: 10px;">Họ và tên</th>
                        <th style="padding: 10px;">Quốc tịch</th>
                        <th style="padding: 10px;">Loại giấy tờ</th>
                        <th style="padding: 10px;">Số giấy tờ</th>
                        <th style="padding: 10px;">Ngày hết hạn</th>
                        <th style="padding: 10px; text-align: center;">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {expiring_table_rows}
                </tbody>
            </table>
        </div>
        """

    missing_section = ""
    if missing_docs:
        missing_section = f"""
        <div style="margin-bottom: 24px;">
            <h3 style="color: #4338ca; margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                ⚠️ DANH SÁCH GIẤY TỜ THIẾU THÔNG TIN ({len(missing_docs)} mục)
            </h3>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0; font-style: italic;">
                * Các nhân viên dưới đây đang thiếu thông tin giấy tờ trong hệ thống. Vui lòng bổ sung để theo dõi hạn hiệu lực.
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border: 1px solid #c7d2fe;">
                <thead>
                    <tr style="background-color: #e0e7ff; color: #3730a3;">
                        <th style="padding: 10px; text-align: center;">STT</th>
                        <th style="padding: 10px;">Mã NV</th>
                        <th style="padding: 10px;">Họ và tên</th>
                        <th style="padding: 10px;">Quốc tịch</th>
                        <th style="padding: 10px;">Loại giấy tờ</th>
                        <th style="padding: 10px;">Lý do / Tình trạng</th>
                    </tr>
                </thead>
                <tbody>
                    {missing_table_rows}
                </tbody>
            </table>
        </div>
        """

    system_link_btn = ""
    if system_url:
        system_link_btn = f"""
        <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="{system_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Mở Hệ Thống Quản Lý HR Phía Nam
            </a>
        </div>
        """

    total_alert = len(expired_docs) + len(expiring_docs)
    total_missing = len(missing_docs)

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Bản tin Cảnh báo Giấy tờ Hết hạn</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
                <h2 style="color: #1e3a8a; margin: 0 0 8px 0; font-size: 20px;">
                    📋 BẢN TIN CẢNH BÁO GIẤY TỜ PHÁP LÝ NHÂN VIÊN NƯỚC NGOÀI
                </h2>
                <p style="color: #64748b; margin: 0; font-size: 13px;">
                    Thời gian phát hành: <strong>{now_str}</strong> | Tổng số cảnh báo: <strong style="color: #dc2626;">{total_alert}</strong> (Hết hạn: {len(expired_docs)}, Sắp hết hạn: {len(expiring_docs)})
                    {" | Thiếu thông tin: <strong style='color: #4338ca;'>" + str(total_missing) + "</strong>" if total_missing else ""}
                </p>
            </div>

            {expired_section}
            {expiring_section}
            {missing_section}

            {system_link_btn}

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0 0 4px 0;">Email tự động phát ra từ Hệ thống Quản lý Nhân sự Nước ngoài (NY HR System).</p>
                <p style="margin: 0;">Vui lòng không trả lời trực tiếp email này.</p>
            </div>
        </div>
    </body>
    </html>
    """
