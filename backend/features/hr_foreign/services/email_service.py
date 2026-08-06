from __future__ import annotations

import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session

from core.config import settings
from features.hr_foreign.models import EmailDeliveryLog, EmailNotificationConfig
from features.hr_foreign.services.email_template_builder import build_doc_warning_email_html
from features.hr_foreign.services.legal_doc_service import get_expiring_documents


# --- EMAIL NOTIFICATION CONFIG & LOGS ---

def get_email_notification_config(
    db: Session, config_key: str = "DOC_WARNING"
) -> EmailNotificationConfig:
    cfg = (
        db.query(EmailNotificationConfig)
        .filter(EmailNotificationConfig.config_key == config_key)
        .first()
    )
    if not cfg:
        cfg = EmailNotificationConfig(
            config_key=config_key,
            recipient_emails="",
            is_enabled=True,
            scheduled_time="08:00",
        )
        db.add(cfg)
        db.flush()
        db.commit()
        db.refresh(cfg)
    return cfg


def update_email_notification_config(
    db: Session,
    recipient_emails: str | None = None,
    is_enabled: bool | None = None,
    scheduled_time: str | None = None,
    config_key: str = "DOC_WARNING",
) -> EmailNotificationConfig:
    cfg = get_email_notification_config(db, config_key=config_key)
    if recipient_emails is not None:
        cfg.recipient_emails = recipient_emails
    if is_enabled is not None:
        cfg.is_enabled = is_enabled
    if scheduled_time is not None:
        cfg.scheduled_time = scheduled_time
    db.commit()
    db.refresh(cfg)
    return cfg


def create_email_delivery_log(
    db: Session,
    trigger_type: str = "AUTO",
    recipients: str | None = None,
    total_expired_docs: int = 0,
    total_expiring_docs: int = 0,
    status: str = "SUCCESS",
    error_message: str | None = None,
) -> EmailDeliveryLog:
    log_entry = EmailDeliveryLog(
        sent_at=datetime.datetime.now(),
        trigger_type=trigger_type,
        recipients=recipients,
        total_expired_docs=total_expired_docs,
        total_expiring_docs=total_expiring_docs,
        status=status,
        error_message=error_message,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def get_email_delivery_logs(db: Session, limit: int = 20) -> list[EmailDeliveryLog]:
    return (
        db.query(EmailDeliveryLog)
        .order_by(EmailDeliveryLog.sent_at.desc())
        .limit(limit)
        .all()
    )


# --- SMTP DISPATCH & DIGEST ---

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
