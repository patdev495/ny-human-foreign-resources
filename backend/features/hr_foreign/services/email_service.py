from __future__ import annotations

import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session

from core.config import settings
from features.hr_foreign.models import EmailDeliveryLog
from features.hr_foreign.services.email_config_service import (
    create_email_delivery_log,
    get_email_notification_config,
)
from features.hr_foreign.services.legal_doc_service import get_expiring_documents


def send_smtp_email(
    to_emails: list[str], subject: str, html_content: str
) -> tuple[bool, str | None]:
    if not to_emails:
        return False, "Danh sách email nhận trống"

    if not settings.smtp_host or not settings.smtp_port:
        return False, "Chưa cấu hình máy chủ SMTP Server (SMTP_HOST / SMTP_PORT)"

    from_addr = settings.smtp_from_email or settings.smtp_user or "noreply-hr@company.com"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = ", ".join(to_emails)

    html_part = MIMEText(html_content, "html", "utf-8")
    msg.attach(html_part)

    try:
        if settings.smtp_use_tls and settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
            server.ehlo()
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
            server.ehlo()
            if settings.smtp_use_tls:
                server.starttls()
                server.ehlo()

        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)

        server.sendmail(from_addr, to_emails, msg.as_string())
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)


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
                        <th style="padding: 10px;">Lý do thiếu</th>
                    </tr>
                </thead>
                <tbody>
                    {missing_table_rows}
                </tbody>
            </table>
        </div>
        """

    no_docs_notice = ""
    if not expired_docs and not expiring_docs and not missing_docs:
        no_docs_notice = """
        <div style="padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 14px; text-align: center;">
            ✅ Tất cả giấy tờ pháp lý của Nhân viên nước ngoài hiện tại đều nằm trong thời hạn an toàn. Không có giấy tờ nào quá hạn hoặc sắp hết hạn.
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Cảnh báo giấy tờ pháp lý - NY HR System</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 850px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                    📋 BẢN TIN CẢNH BÁO GIẤY TỜ PHÁP LÝ NHÂN VIÊN NƯỚC NGOÀI
                </h2>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">
                    Hệ thống NY Human Resources System • Thời gian phát hành: {now_str}
                </p>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">
                <p style="font-size: 14px; color: #334155; margin-top: 0; margin-bottom: 20px;">
                    Kính gửi <strong>Bộ phận Nhân sự (HR)</strong>,<br>
                    Hệ thống gửi đến Anh/Chị bản tin tổng hợp tình trạng giấy tờ pháp lý (Visa, Tạm trú, GPLĐ, HĐLĐ, Hộ chiếu) của Nhân viên nước ngoài cần xử lý gia hạn:
                </p>

                {expired_section}
                {expiring_section}
                {missing_section}
                {no_docs_notice}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
                        Anh/Chị vui lòng truy cập phần mềm để cập nhật hồ sơ giấy tờ mới nhất:
                    </p>
                    <a href="{system_url or '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 10px 20px; border-radius: 6px;">
                        🔗 Mở Phần Mềm Quản Lý HR
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                Email này được tự động gửi từ hệ thống <strong>NY Human Resources System</strong>.<br>
                Vui lòng không trả lời trực tiếp email này.
            </div>
        </div>
    </body>
    </html>
    """
    return html


def send_daily_doc_warning_digest(
    db: Session, trigger_type: str = "AUTO"
) -> tuple[bool, str, EmailDeliveryLog | None]:
    cfg = get_email_notification_config(db)
    if not cfg.is_enabled and trigger_type == "AUTO":
        return False, "Tính năng gửi email cảnh báo tự động đang bị tắt", None

    if not cfg.recipient_emails or not cfg.recipient_emails.strip():
        log = create_email_delivery_log(
            db,
            trigger_type=trigger_type,
            recipients="",
            total_expired_docs=0,
            total_expiring_docs=0,
            status="FAILED",
            error_message="Chưa cài đặt danh sách email nhận cảnh báo",
        )
        return False, "Chưa cài đặt danh sách email nhận cảnh báo", log

    recipients_list = [
        email.strip() for email in cfg.recipient_emails.split(",") if email.strip()
    ]

    expiring_resp = get_expiring_documents(db)

    # Flatten all doc lists from response
    all_doc_items = (
        expiring_resp.expiring_visas
        + expiring_resp.expiring_tam_trus
        + expiring_resp.expiring_gpl_ds
        + expiring_resp.expiring_contracts
        + expiring_resp.expiring_passports
    )

    doc_type_names = {
        "VISA": "Visa",
        "TAM_TRU": "Tạm trú",
        "GPLD": "GPLĐ",
        "CONTRACT": "HĐLĐ",
        "PASSPORT": "Hộ chiếu",
    }

    expired_docs = []
    expiring_docs = []
    missing_docs = []

    for item in all_doc_items:
        if item.is_missing_info or item.days_remaining is None:
            missing_docs.append({
                "employee_code": "",
                "name_latin": item.employee_name or "",
                "nationality": "",
                "doc_type": doc_type_names.get(item.doc_type, item.doc_type),
                "missing_reason": item.missing_reason or "Thiếu thông tin hoặc ngày hết hạn",
            })
            continue

        doc_dict = {
            "employee_code": "",
            "name_latin": item.employee_name or "",
            "nationality": "",
            "doc_type": doc_type_names.get(item.doc_type, item.doc_type),
            "doc_number": item.type_name or item.passport_number or "",
            "expiry_date": item.expiry_date.strftime("%d/%m/%Y") if item.expiry_date else "",
            "days_diff": item.days_remaining,
        }

        if item.days_remaining < 0:
            expired_docs.append(doc_dict)
        else:
            expiring_docs.append(doc_dict)

    subject = f"[CẢNH BÁO HR] Bản tin Giấy tờ Pháp lý Nhân viên nước ngoài ({datetime.date.today().strftime('%d/%m/%Y')})"
    html_content = build_doc_warning_email_html(expired_docs, expiring_docs, missing_docs)

    success, error_msg = send_smtp_email(recipients_list, subject, html_content)

    status_str = "SUCCESS" if success else "FAILED"
    log = create_email_delivery_log(
        db,
        trigger_type=trigger_type,
        recipients=", ".join(recipients_list),
        total_expired_docs=len(expired_docs),
        total_expiring_docs=len(expiring_docs),
        status=status_str,
        error_message=error_msg,
    )

    if success:
        cfg.last_sent_at = datetime.datetime.now()
        db.commit()

    return success, error_msg or "Gửi email cảnh báo thành công", log


def send_test_email(to_email: str) -> tuple[bool, str]:
    if not to_email or not to_email.strip():
        return False, "Địa chỉ email không được để trống"

    subject = "[TEST] Kiểm tra Cấu hình Kết nối Email SMTP - NY HR System"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h3 style="color: #2563eb;">✅ Thử nghiệm Kết nối Email Thành Công!</h3>
        <p>Email này được gửi từ <strong>NY Human Resources System</strong> để kiểm tra cấu hình máy chủ SMTP.</p>
        <p>Hệ thống của bạn đã sẵn sàng tự động gửi email cảnh báo giấy tờ tới <strong>Foxmail</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <small style="color: #64748b;">Thời gian thử nghiệm: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</small>
    </div>
    """
    success, error_msg = send_smtp_email([to_email.strip()], subject, html_content)
    if success:
        return True, "Gửi email thử nghiệm thành công! Vui lòng kiểm tra Foxmail."
    return False, f"Gửi email thử nghiệm thất bại: {error_msg}"
