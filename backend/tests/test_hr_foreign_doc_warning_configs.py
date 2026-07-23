from __future__ import annotations

import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base
from features.hr_foreign.models import ForeignEmployee, Stay, Visa, WorkPermit
from features.hr_foreign.service import (
    get_warning_configs,
    update_warning_configs,
    get_expiring_documents,
)
from features.hr_foreign.schemas import DocWarningConfigUpdateItem



@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_get_default_warning_configs_seeds_defaults(db_session):
    """Test get_warning_configs auto-seeds 5 document types with 30 DAYS default."""
    configs = get_warning_configs(db_session)
    assert len(configs) == 5

    config_map = {c.doc_type: c for c in configs}
    expected_doc_types = ["VISA", "TAM_TRU", "GPLD", "CONTRACT", "PASSPORT"]

    for doc_type in expected_doc_types:
        assert doc_type in config_map
        assert config_map[doc_type].warning_value == 30
        assert config_map[doc_type].warning_unit == "DAY"


def test_update_warning_configs(db_session):
    """Test updating warning threshold values and units for specific document types."""
    updates = [
        DocWarningConfigUpdateItem(doc_type="VISA", warning_value=1, warning_unit="MONTH"),
        DocWarningConfigUpdateItem(doc_type="GPLD", warning_value=60, warning_unit="DAY"),
    ]
    updated = update_warning_configs(db_session, updates)
    config_map = {c.doc_type: c for c in updated}

    assert config_map["VISA"].warning_value == 1
    assert config_map["VISA"].warning_unit == "MONTH"
    assert config_map["GPLD"].warning_value == 60
    assert config_map["GPLD"].warning_unit == "DAY"
    # Unmodified doc types should retain defaults
    assert config_map["TAM_TRU"].warning_value == 30
    assert config_map["TAM_TRU"].warning_unit == "DAY"


def test_get_expiring_documents_with_per_doc_type_configs(db_session):
    """Test get_expiring_documents calculates cutoff individually for each doc type including passport."""
    today = datetime.date(2026, 7, 23)

    # Configure thresholds:
    # VISA: 15 DAYS
    # GPLD: 60 DAYS
    # PASSPORT: 2 MONTHS (60 DAYS)
    updates = [
        DocWarningConfigUpdateItem(doc_type="VISA", warning_value=15, warning_unit="DAY"),
        DocWarningConfigUpdateItem(doc_type="GPLD", warning_value=60, warning_unit="DAY"),
        DocWarningConfigUpdateItem(doc_type="PASSPORT", warning_value=2, warning_unit="MONTH"),
    ]
    update_warning_configs(db_session, updates)

    # Create employee with Passport expiring in 45 days (2026-09-06)
    emp = ForeignEmployee(
        name_latin="TEST WORKER",
        gender="Nam",
        passport_number="E999888",
        passport_expiry=today + datetime.timedelta(days=45),
    )
    db_session.add(emp)
    db_session.flush()

    stay = Stay(
        employee_id=emp.id,
        accommodation_type="KTX",
        stay_type="CO_DINH",
        has_meals=True,
        start_date=today - datetime.timedelta(days=10),
    )
    db_session.add(stay)
    db_session.flush()

    # Visa expiring in 20 days (2026-08-12) -> > 15 days cutoff, so should NOT be in expiring_visas
    v = Visa(
        stay_id=stay.id,
        visa_type="LĐ2",
        expiry_date=today + datetime.timedelta(days=20),
    )
    # GPLD expiring in 50 days (2026-09-11) -> <= 60 days cutoff, so SHOULD be in expiring_gpl_ds
    wp = WorkPermit(
        employee_id=emp.id,
        permit_number="GPLD123",
        valid_from=today - datetime.timedelta(days=100),
        valid_to=today + datetime.timedelta(days=50),
    )
    db_session.add_all([v, wp])
    db_session.flush()

    result = get_expiring_documents(db_session, today=today)

    # Visa: 20 days remaining > 15 days threshold -> 0 expiring visas
    assert len(result.expiring_visas) == 0

    # GPLD: 50 days remaining <= 60 days threshold -> 1 expiring GPLD
    assert len(result.expiring_gpl_ds) == 1
    assert result.expiring_gpl_ds[0].employee_id == emp.id
    assert result.expiring_gpl_ds[0].days_remaining == 50

    # Passport: 45 days remaining <= 60 days threshold -> 1 expiring passport
    assert len(result.expiring_passports) == 1
    assert result.expiring_passports[0].employee_id == emp.id
    assert result.expiring_passports[0].days_remaining == 45


def test_doc_warning_configs_router_endpoints(db_session):
    """Test GET and PUT /api/hr-foreign/doc-warning-configs via FastAPI TestClient."""
    from fastapi.testclient import TestClient
    from main import app
    from core.database import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # 1. GET configs (auto-seed)
    res = client.get("/api/hr-foreign/doc-warning-configs")
    assert res.status_code == 200
    data = res.json()
    assert "configs" in data
    assert len(data["configs"]) == 5

    # 2. PUT configs
    payload = [
        {"doc_type": "VISA", "warning_value": 2, "warning_unit": "MONTH"},
        {"doc_type": "PASSPORT", "warning_value": 180, "warning_unit": "DAY"},
    ]
    res = client.put("/api/hr-foreign/doc-warning-configs", json=payload)
    assert res.status_code == 200
    data = res.json()
    cfg_map = {c["doc_type"]: c for c in data["configs"]}
    assert cfg_map["VISA"]["warning_value"] == 2
    assert cfg_map["VISA"]["warning_unit"] == "MONTH"
    app.dependency_overrides.clear()


def test_get_expiring_documents_warns_missing_info(db_session):
    """Test get_expiring_documents flags missing document numbers or expiry dates."""
    today = datetime.date(2026, 7, 23)

    # Employee 1: Missing passport expiry and passport number
    emp1 = ForeignEmployee(
        name_latin="NO PASSPORT EMP",
        gender="Nam",
        passport_number=None,
        passport_expiry=None,
    )
    db_session.add(emp1)
    db_session.flush()

    # Employee 2: Active stay with no Visa and no TamTru
    emp2 = ForeignEmployee(
        name_latin="NO VISA EMP",
        gender="Nữ",
        passport_number="E777666",
        passport_expiry=today + datetime.timedelta(days=365),
    )
    db_session.add(emp2)
    db_session.flush()

    stay2 = Stay(
        employee_id=emp2.id,
        accommodation_type="KTX",
        stay_type="CO_DINH",
        has_meals=True,
        start_date=today - datetime.timedelta(days=5),
    )
    db_session.add(stay2)
    db_session.flush()

    result = get_expiring_documents(db_session, today=today)

    # 1. Emp1 should be in expiring_passports as missing info
    missing_passports = [p for p in result.expiring_passports if p.is_missing_info]
    assert len(missing_passports) >= 1
    assert any(p.employee_id == emp1.id for p in missing_passports)

    # 2. Emp2 has an active stay with no visa & no tam tru -> should be in expiring_visas and expiring_tam_trus as missing info
    missing_visas = [v for v in result.expiring_visas if v.is_missing_info]
    assert any(v.employee_id == emp2.id for v in missing_visas)

    missing_tam_trus = [tt for tt in result.expiring_tam_trus if tt.is_missing_info]
    assert any(tt.employee_id == emp2.id for tt in missing_tam_trus)

    # 3. Both emp1 and emp2 have no GPLD and no Contract -> should be flagged as missing GPLD & Contract
    missing_gplds = [g for g in result.expiring_gpl_ds if g.is_missing_info]
    assert any(g.employee_id == emp1.id for g in missing_gplds)

    missing_contracts = [c for c in result.expiring_contracts if c.is_missing_info]
    assert any(c.employee_id == emp1.id for c in missing_contracts)




