from __future__ import annotations

import datetime
import pytest
from sqlalchemy.orm import Session

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from core.config import settings
from core.database import Base, engine, get_db
from features.hr_foreign import models, service


@pytest.fixture
def db_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_smtp_settings_exist():

    assert hasattr(settings, "smtp_host")
    assert hasattr(settings, "smtp_port")
    assert hasattr(settings, "smtp_user")
    assert hasattr(settings, "smtp_password")
    assert hasattr(settings, "smtp_from_email")
    assert hasattr(settings, "smtp_use_tls")


def test_email_notification_config_crud(db_session: Session):
    # Test getting email config (default should be initialized if not present)
    cfg = service.get_email_notification_config(db_session)
    assert cfg is not None
    assert cfg.config_key == "DOC_WARNING"
    assert cfg.is_enabled is True
    assert cfg.scheduled_time == "08:00"

    # Test updating email config
    updated = service.update_email_notification_config(
        db_session,
        recipient_emails="hr1@company.com, hr2@company.com",
        is_enabled=True,
        scheduled_time="08:30",
    )
    assert updated.recipient_emails == "hr1@company.com, hr2@company.com"
    assert updated.scheduled_time == "08:30"


def test_email_delivery_log_creation(db_session: Session):
    log_entry = service.create_email_delivery_log(
        db_session,
        trigger_type="AUTO",
        recipients="hr@company.com",
        total_expired_docs=2,
        total_expiring_docs=5,
        status="SUCCESS",
        error_message=None,
    )
    assert log_entry.id is not None
    assert log_entry.trigger_type == "AUTO"
    assert log_entry.total_expired_docs == 2
    assert log_entry.total_expiring_docs == 5

    logs = service.get_email_delivery_logs(db_session, limit=10)
    assert len(logs) >= 1
    assert logs[0].id == log_entry.id


def test_build_doc_warning_email_html():
    from features.hr_foreign.services.email_service import build_doc_warning_email_html

    expired = [
        {
            "employee_code": "NY001",
            "name_latin": "ZHANG WEI",
            "nationality": "Trung Quốc",
            "doc_type": "Visa",
            "doc_number": "DN1-99",
            "expiry_date": "2026-07-20",
            "days_diff": -7,
        }
    ]
    expiring = [
        {
            "employee_code": "NY002",
            "name_latin": "LI WEI",
            "nationality": "Trung Quốc",
            "doc_type": "GPLĐ",
            "doc_number": "WP-123",
            "expiry_date": "2026-08-15",
            "days_diff": 19,
        }
    ]

    html = build_doc_warning_email_html(expired, expiring)
    assert "ĐÃ HẾT HẠN" in html
    assert "SẮP HẾT HẠN" in html
    assert "ZHANG WEI" in html
    assert "NY001" in html
    assert "LI WEI" in html
    assert "WP-123" in html


def test_send_daily_doc_warning_digest_mock(db_session: Session, monkeypatch):
    from features.hr_foreign.services import email_service

    # Mock send_smtp_email
    sent_emails = []

    def mock_send_smtp_email(to_emails, subject, html_content):
        sent_emails.append({"to": to_emails, "subject": subject, "html": html_content})
        return True, None

    monkeypatch.setattr(email_service, "send_smtp_email", mock_send_smtp_email)

    # Set recipient email
    service.update_email_notification_config(db_session, recipient_emails="hr@company.com")

    # Add expired and expiring data
    emp = models.ForeignEmployee(
        employee_code="NY888",
        name_latin="WANG FANG",
        gender="Nữ",
        passport_number="E999999",
        passport_expiry=datetime.date(2026, 7, 10),
    )
    db_session.add(emp)
    db_session.commit()

    success, msg, log = email_service.send_daily_doc_warning_digest(db_session, trigger_type="MANUAL")
    assert success is True
    assert log is not None
    assert log.status == "SUCCESS"
    assert len(sent_emails) == 1
    assert "hr@company.com" in sent_emails[0]["to"]


def test_email_api_endpoints(monkeypatch):
    from fastapi.testclient import TestClient
    from main import app
    from features.hr_foreign.services import email_service

    client = TestClient(app)

    # 1. GET /api/hr-foreign/email-config
    res = client.get("/api/hr-foreign/email-config")
    assert res.status_code == 200
    data = res.json()
    assert "recipient_emails" in data
    assert data["is_enabled"] is True

    # 2. PUT /api/hr-foreign/email-config
    res = client.put(
        "/api/hr-foreign/email-config",
        json={
            "recipient_emails": "test1@company.com, test2@company.com",
            "is_enabled": True,
            "scheduled_time": "08:00",
        },
    )
    assert res.status_code == 200
    assert res.json()["recipient_emails"] == "test1@company.com, test2@company.com"

    # Mock send_smtp_email
    monkeypatch.setattr(email_service, "send_smtp_email", lambda to, subj, body: (True, None))

    # 3. POST /api/hr-foreign/email-config/send-test
    res = client.post(
        "/api/hr-foreign/email-config/send-test",
        json={"to_email": "test1@company.com"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 4. POST /api/hr-foreign/email-config/trigger-now
    res = client.post("/api/hr-foreign/email-config/trigger-now")
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 5. GET /api/hr-foreign/email-delivery-logs
    res = client.get("/api/hr-foreign/email-delivery-logs")
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1


