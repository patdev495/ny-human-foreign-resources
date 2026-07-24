from __future__ import annotations

import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from core.database import Base
from features.hr_foreign.models import (
    ForeignEmployee,
    Room,
    Stay,
    Visa,
    TamTru,
    MealAbsence,
    EventDay,
    MealPriceConfig,
)
from features.hr_foreign.service import seed_default_meal_prices


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


def test_models_creation(db_session: Session) -> None:
    # 1. Foreign Employee
    emp = ForeignEmployee(
        name_latin="NGUYEN VAN A",
        name_chinese="阮文A",
        gender="Nam",
        nationality="Trung Quoc",
        date_of_birth=datetime.date(1990, 1, 1),
        passport_number="E12345678",
        passport_expiry=datetime.date(2030, 1, 1),
        phone="0901234567",
        department="San Xuat",
        role="Chuyen Gia",
        notes="Ghi chu nhan su",
    )
    db_session.add(emp)
    db_session.flush()
    db_session.refresh(emp)

    assert emp.id is not None
    assert emp.name_latin == "NGUYEN VAN A"
    assert emp.work_type == "CO_DINH"

    # 2. Room
    room = Room(room_number="101", notes="Phong tang 1")
    db_session.add(room)
    db_session.flush()
    db_session.refresh(room)

    assert room.id is not None
    assert room.room_number == "101"

    # 3. Stay
    stay = Stay(
        employee_id=emp.id,
        accommodation_type="KTX",
        room_id=room.id,
        stay_type="CO_DINH",
        has_meals=True,
        start_date=datetime.date(2026, 1, 1),
        end_date=None,
        notes="Dot luu tru 1",
    )
    db_session.add(stay)
    db_session.flush()
    db_session.refresh(stay)

    assert stay.id is not None
    assert stay.employee_id == emp.id
    assert stay.room_id == room.id

    # 4. Visa
    visa = Visa(
        stay_id=stay.id,
        visa_type="DN1",
        entry_date=datetime.date(2026, 1, 1),
        expiry_date=datetime.date(2026, 3, 31),
        notes="Visa 3 thang",
    )
    db_session.add(visa)

    # 5. TamTru
    tamtru = TamTru(
        stay_id=stay.id,
        registration_date=datetime.date(2026, 1, 2),
        expiry_date=datetime.date(2026, 3, 30),
        notes="Tam tru CA xa",
    )
    db_session.add(tamtru)

    # 6. MealAbsence
    absence = MealAbsence(
        stay_id=stay.id,
        absence_date=datetime.date(2026, 1, 15),
        reason="Ve nuoc an têt",
    )
    db_session.add(absence)

    # 7. EventDay
    event = EventDay(
        event_date=datetime.date(2026, 2, 10),
        event_type="PRESIDENT_VISIT",
        notes="Chu tich sang tham",
    )
    db_session.add(event)

    db_session.commit()

    assert visa.id is not None
    assert tamtru.id is not None
    assert absence.id is not None
    assert event.id is not None


def test_seed_default_meal_prices(db_session: Session) -> None:
    seed_default_meal_prices(db_session)
    configs = db_session.query(MealPriceConfig).all()
    assert len(configs) == 2
    types = {c.day_type: c.price_per_meal for c in configs}
    assert types["NORMAL"] == 30000
    assert types["PRESIDENT_VISIT"] == 50000
