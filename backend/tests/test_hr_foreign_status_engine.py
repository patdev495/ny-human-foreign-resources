from __future__ import annotations

import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base
from features.hr_foreign.models import (
    Contract,
    ForeignEmployee,
    Room,
    Stay,
    TamTru,
    Visa,
    WorkPermit,
)

from features.hr_foreign.status_engine import (
    evaluate_employee_statuses,
    get_expiring_documents,
)


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


def test_evaluate_employee_statuses_batch(db_session):
    today = datetime.date(2026, 7, 22)

    # 1. Create 2 employees
    emp1 = ForeignEmployee(
        name_latin="ZHANG WEI",
        name_chinese="张伟",
        gender="Nam",
        passport_number="E1111111",
    )
    emp2 = ForeignEmployee(
        name_latin="WANG FANG",
        name_chinese="王芳",
        gender="Nữ",
        passport_number="E2222222",
    )
    db_session.add_all([emp1, emp2])
    db_session.flush()

    # 2. Create room & active stay for emp1 in KTX Room 1601
    room = Room(room_number="1601")
    db_session.add(room)
    db_session.flush()

    stay1 = Stay(
        employee_id=emp1.id,
        accommodation_type="KTX",
        room_id=room.id,
        start_date=datetime.date(2026, 1, 1),
        end_date=None,  # Active
    )
    db_session.add(stay1)
    db_session.flush()

    # Add Visa, TamTru, WorkPermit, Contract for emp1
    visa1 = Visa(
        stay_id=stay1.id,
        visa_type="DN1",
        entry_date=datetime.date(2026, 1, 1),
        expiry_date=datetime.date(2026, 8, 15),
    )
    tamtru1 = TamTru(
        stay_id=stay1.id,
        registration_date=datetime.date(2026, 1, 1),
        expiry_date=datetime.date(2026, 8, 20),
    )
    wp1 = WorkPermit(
        employee_id=emp1.id,
        permit_number="WP-001",
        valid_from=datetime.date(2026, 1, 1),
        valid_to=datetime.date(2027, 1, 1),
    )
    contract1 = Contract(
        employee_id=emp1.id,
        contract_type="Cấp mới",
        start_date=datetime.date(2026, 1, 1),
        end_date=datetime.date(2027, 1, 1),
    )
    db_session.add_all([visa1, tamtru1, wp1, contract1])
    db_session.commit()

    # 3. Call evaluate_employee_statuses batch
    reads = evaluate_employee_statuses(db_session, [emp1, emp2], today=today)

    assert len(reads) == 2
    r1 = next(r for r in reads if r.id == emp1.id)
    r2 = next(r for r in reads if r.id == emp2.id)

    # Verify emp1 computed status & document expiries
    assert r1.is_in_vietnam is True
    assert r1.current_room_number == "1601"
    assert r1.latest_visa_expiry == datetime.date(2026, 8, 15)
    assert r1.latest_visa_type == "DN1"
    assert r1.latest_tamtru_expiry == datetime.date(2026, 8, 20)
    assert r1.latest_gpld_expiry == datetime.date(2027, 1, 1)
    assert r1.latest_contract_expiry == datetime.date(2027, 1, 1)

    # Verify emp2 has no active stay or documents
    assert r2.is_in_vietnam is False
    assert r2.current_room_number is None
    assert r2.latest_visa_expiry is None


def test_get_expiring_documents_all_types(db_session):
    today = datetime.date(2026, 7, 22)

    emp = ForeignEmployee(
        name_latin="LI NA",
        gender="Nữ",
        passport_number="E3333333",
    )
    db_session.add(emp)
    db_session.flush()

    stay = Stay(employee_id=emp.id, start_date=datetime.date(2026, 1, 1))
    db_session.add(stay)
    db_session.flush()

    # Visa expiring in 10 days
    visa = Visa(stay_id=stay.id, visa_type="LĐ2", expiry_date=datetime.date(2026, 8, 1))
    # Tam tru expiring in 15 days
    tam_tru = TamTru(stay_id=stay.id, expiry_date=datetime.date(2026, 8, 6))
    # Work permit expiring in 20 days
    wp = WorkPermit(employee_id=emp.id, permit_number="WP-002", valid_to=datetime.date(2026, 8, 11))
    # Contract expiring in 25 days
    contract = Contract(employee_id=emp.id, contract_type="Hợp đồng thử việc", end_date=datetime.date(2026, 8, 16))

    db_session.add_all([visa, tam_tru, wp, contract])
    db_session.commit()

    resp = get_expiring_documents(db_session, days=30, today=today)

    assert len(resp.expiring_visas) == 1
    assert resp.expiring_visas[0].days_remaining == 10
    assert len(resp.expiring_tam_trus) == 1
    assert resp.expiring_tam_trus[0].days_remaining == 15
    assert len(resp.expiring_gpl_ds) == 1
    assert resp.expiring_gpl_ds[0].days_remaining == 20
    assert len(resp.expiring_contracts) == 1
    assert resp.expiring_contracts[0].days_remaining == 25
