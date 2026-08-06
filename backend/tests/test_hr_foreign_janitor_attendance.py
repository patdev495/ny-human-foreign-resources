from __future__ import annotations

import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db
from features.hr_foreign.models import ForeignEmployee
from features.hr_foreign.services.janitor_service import (
    get_daily_janitor_sheet,
    upsert_janitor_absence,
    delete_janitor_absence,
    bulk_create_janitor_range_absence,
)
from features.hr_foreign.schemas.janitor_schemas import (
    JanitorAttendanceCreate,
    JanitorAttendanceRangeCreate,
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


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_upsert_and_get_janitor_daily_attendance(db_session) -> None:
    janitor = ForeignEmployee(
        name_latin="Nguyen Van A",
        employee_code="JV001",
        employee_type="JANITORIAL",
        gender="Nam",
        workplace_location="DORMITORY",
        salary=7000000.0,
        salary_unit="MONTH",
    )
    db_session.add(janitor)
    db_session.commit()
    db_session.refresh(janitor)

    test_date = datetime.date(2026, 8, 1)

    # 1. Fetch sheet when no absence is recorded -> default PRESENT
    sheet_before = get_daily_janitor_sheet(db_session, test_date)
    assert len(sheet_before.items) >= 1
    item = next(i for i in sheet_before.items if i.employee_id == janitor.id)
    assert item.status == "PRESENT"
    assert item.absence_type is None

    # 2. Record full day absence
    absence_payload = JanitorAttendanceCreate(
        employee_id=janitor.id,
        attendance_date=test_date,
        absence_type="FULL_DAY",
        reason="Nghỉ phép",
    )
    rec = upsert_janitor_absence(db_session, absence_payload)
    assert rec.absence_type == "FULL_DAY"

    sheet_after = get_daily_janitor_sheet(db_session, test_date)
    item_after = next(i for i in sheet_after.items if i.employee_id == janitor.id)
    assert item_after.status == "ABSENT"
    assert item_after.absence_type == "FULL_DAY"
    assert item_after.reason == "Nghỉ phép"

    # 3. Delete absence -> revert to PRESENT
    delete_janitor_absence(db_session, janitor.id, test_date)
    sheet_reverted = get_daily_janitor_sheet(db_session, test_date)
    item_reverted = next(i for i in sheet_reverted.items if i.employee_id == janitor.id)
    assert item_reverted.status == "PRESENT"


def test_bulk_create_janitor_range_absence(db_session) -> None:
    janitor = ForeignEmployee(
        name_latin="Tran Thi B",
        employee_code="JV002",
        employee_type="JANITORIAL",
        gender="Nữ",
        workplace_location="DORMITORY",
    )
    db_session.add(janitor)
    db_session.commit()

    # Mon (2026-08-03) to Sun (2026-08-09) -> 6 workdays (Mon-Sat), Sunday skipped
    range_payload = JanitorAttendanceRangeCreate(
        employee_id=janitor.id,
        start_date=datetime.date(2026, 8, 3),
        end_date=datetime.date(2026, 8, 9),
        absence_type="HALF_DAY",
        reason="Việc gia đình",
    )
    records = bulk_create_janitor_range_absence(db_session, range_payload)
    assert len(records) == 6

    # Verify Sunday is not in records
    dates = [r.attendance_date for r in records]
    assert datetime.date(2026, 8, 9) not in dates


def test_janitor_attendance_api_endpoints(client, db_session) -> None:
    janitor = ForeignEmployee(
        name_latin="Le Van C",
        employee_code="JV003",
        employee_type="JANITORIAL",
        gender="Nam",
        workplace_location="DORMITORY",
    )
    db_session.add(janitor)
    db_session.commit()
    db_session.refresh(janitor)

    # 1. GET attendance sheet
    res = client.get("/api/hr-foreign/janitors/attendance?target_date=2026-08-10")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] >= 1

    # 2. POST single absence
    post_res = client.post(
        "/api/hr-foreign/janitors/attendance",
        json={
            "employee_id": janitor.id,
            "attendance_date": "2026-08-10",
            "absence_type": "FULL_DAY",
            "reason": "Nghỉ bệnh",
        },
    )
    assert post_res.status_code == 200
    assert post_res.json()["absence_type"] == "FULL_DAY"

    # Verify sheet updated
    sheet_res = client.get("/api/hr-foreign/janitors/attendance?target_date=2026-08-10")
    item = next(i for i in sheet_res.json()["items"] if i["employee_id"] == janitor.id)
    assert item["status"] == "ABSENT"
    assert item["absence_type"] == "FULL_DAY"

    # 3. DELETE absence
    del_res = client.delete(f"/api/hr-foreign/janitors/attendance/{janitor.id}?target_date=2026-08-10")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. POST range absence
    range_res = client.post(
        "/api/hr-foreign/janitors/attendance/range",
        json={
            "employee_id": janitor.id,
            "start_date": "2026-08-11",
            "end_date": "2026-08-12",
            "absence_type": "HALF_DAY",
            "reason": "Nghỉ cá nhân",
        },
    )
    assert range_res.status_code == 200
    assert len(range_res.json()) == 2


def test_janitor_absence_impacts_meal_forecast(db_session) -> None:
    from features.hr_foreign.service import get_daily_meal_forecast

    j1 = ForeignEmployee(
        name_latin="Janitor KTX 1",
        gender="Nữ",
        employee_type="JANITORIAL",
        workplace_location="DORMITORY",
    )
    j2 = ForeignEmployee(
        name_latin="Janitor KTX 2",
        gender="Nữ",
        employee_type="JANITORIAL",
        workplace_location="DORMITORY",
    )
    db_session.add_all([j1, j2])
    db_session.commit()

    test_date = datetime.date(2026, 8, 15)

    # Before absence: 2 KTX janitors
    fc_before = get_daily_meal_forecast(db_session, test_date)
    assert fc_before.lunch.calculated_meal_count == 2

    # Mark j1 as absent on test_date
    upsert_janitor_absence(
        db_session,
        JanitorAttendanceCreate(
            employee_id=j1.id,
            attendance_date=test_date,
            absence_type="FULL_DAY",
            reason="Nghỉ phép",
        ),
    )

    # After absence: 2 - 1 = 1 KTX janitor
    fc_after = get_daily_meal_forecast(db_session, test_date)
    assert fc_after.lunch.calculated_meal_count == 1


def test_janitor_resignation_filtering_and_excel_export(db_session) -> None:
    from features.hr_foreign.service import get_daily_meal_forecast
    from features.hr_foreign.exporters.janitor_payroll_exporter import generate_janitor_payroll_excel
    from openpyxl import load_workbook


    j_resigned = ForeignEmployee(
        name_latin="Hoang Van Resigned",
        gender="Nam",
        employee_code="JV999",
        employee_type="JANITORIAL",
        workplace_location="DORMITORY",
        status="RESIGNED",
        resignation_date=datetime.date(2026, 8, 15),
    )
    db_session.add(j_resigned)
    db_session.commit()
    db_session.refresh(j_resigned)

    # 1. Daily attendance sheet before resignation (2026-08-14) -> Included
    sheet_before = get_daily_janitor_sheet(db_session, datetime.date(2026, 8, 14))
    emp_ids_before = [item.employee_id for item in sheet_before.items]
    assert j_resigned.id in emp_ids_before

    # 2. Daily attendance sheet on/after resignation (2026-08-15) -> Hidden
    sheet_after = get_daily_janitor_sheet(db_session, datetime.date(2026, 8, 15))
    emp_ids_after = [item.employee_id for item in sheet_after.items]
    assert j_resigned.id not in emp_ids_after

    # 3. KTX Meal Forecast on resignation date -> Excluded from count
    fc = get_daily_meal_forecast(db_session, datetime.date(2026, 8, 15))
    assert fc.lunch.calculated_meal_count == 0

    # 4. Excel Payroll export for Aug 2026 -> Included with days 1-14 filled, days 15+ empty
    start_date = datetime.date(2026, 8, 1)
    end_date = datetime.date(2026, 8, 31)
    stream = generate_janitor_payroll_excel(db_session, start_date, end_date)
    wb = load_workbook(stream)
    ws = wb.active

    # Find row for j_resigned
    resigned_row = None
    for r in range(8, ws.max_row + 1):
        if ws.cell(row=r, column=3).value == "JV999":
            resigned_row = r
            break

    assert resigned_row is not None
    # Check Aug 14 (Mon-Sat, col 11 + 13 = col 24) is 'N', Aug 15 (col 25) is None
    # 2026-08-14 is Fri (col 11 + 13 = 24), 2026-08-15 is Sat (col 25)
    val_aug14 = ws.cell(row=resigned_row, column=11 + 13).value
    val_aug15 = ws.cell(row=resigned_row, column=11 + 14).value

    assert val_aug14 == "N"
    assert val_aug15 == "TV"






def test_janitor_payroll_excel_export_with_attendance(db_session) -> None:
    from openpyxl import load_workbook
    from features.hr_foreign.exporters.janitor_payroll_exporter import generate_janitor_payroll_excel

    j1 = ForeignEmployee(
        name_latin="Pham Van D",
        gender="Nam",
        employee_code="JV004",
        employee_type="JANITORIAL",
        workplace_location="DORMITORY",
        entry_date=datetime.date(2025, 1, 1),
    )

    db_session.add(j1)
    db_session.commit()

    # Mark FULL_DAY absence on 2026-08-03 (Mon) and HALF_DAY absence on 2026-08-04 (Tue)
    upsert_janitor_absence(
        db_session,
        JanitorAttendanceCreate(
            employee_id=j1.id,
            attendance_date=datetime.date(2026, 8, 3),
            absence_type="FULL_DAY",
            reason="Vắng 1 ngày",
        ),
    )
    upsert_janitor_absence(
        db_session,
        JanitorAttendanceCreate(
            employee_id=j1.id,
            attendance_date=datetime.date(2026, 8, 4),
            absence_type="HALF_DAY",
            reason="Vắng 0.5 ngày",
        ),
    )

    start_date = datetime.date(2026, 8, 1)
    end_date = datetime.date(2026, 8, 31)
    stream = generate_janitor_payroll_excel(db_session, start_date, end_date)

    wb = load_workbook(stream)
    ws = wb.active

    # Check date cells row 8 for j1 (Mon 2026-08-03 is col 11 + 2 = col 13, Tue is col 14)
    # Aug 1 is Sat (col 11), Aug 2 is Sun (col 12 -> None), Aug 3 is Mon (col 13 -> 'X'), Aug 4 is Tue (col 14 -> '0.5')
    val_aug3 = ws.cell(row=8, column=13).value
    val_aug4 = ws.cell(row=8, column=14).value
    val_aug5 = ws.cell(row=8, column=15).value

    assert val_aug3 == "X"
    assert val_aug4 == "N/2"
    assert val_aug5 == "N"


