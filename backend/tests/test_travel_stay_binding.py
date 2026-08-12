from __future__ import annotations

import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_cannot_assign_stay_when_employee_abroad(client: TestClient) -> None:
    """Cycle 1: Thử xếp chỗ ở cho nhân sự chưa có đợt nhập cảnh active -> Phải trả về lỗi 400."""
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "LI WEI",
            "gender": "Nam",
            "nationality": "Trung Quốc",
            "passport_number": "E12345678",
        },
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1601"})
    assert room_res.status_code == 201
    room_id = room_res.json()["id"]

    # Xếp phòng KTX khi nhân sự chưa có đợt nhập cảnh nào (Đang ở nước ngoài)
    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-08-12",
        },
    )
    assert stay_res.status_code == 400
    assert "nước ngoài" in stay_res.json()["detail"].lower()


def test_assign_stay_success_and_binds_travel_record_id(client: TestClient) -> None:
    """Cycle 2: Khi nhân sự đã có Đợt nhập cảnh -> Xếp phòng thành công và tự động gán travel_record_id."""
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "ZHANG WEI",
            "gender": "Nam",
            "nationality": "Trung Quốc",
            "passport_number": "E88889999",
        },
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    # 1. Tạo đợt nhập cảnh cho nhân sự ZHANG WEI
    tr_res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={
            "entry_date": "2026-08-01",
            "expected_exit_date": "2026-08-30",
            "notes": "Đợt công tác 1",
        },
    )
    assert tr_res.status_code == 201
    tr_id = tr_res.json()["id"]

    # 2. Xếp phòng KTX
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1607"})
    assert room_res.status_code == 201
    room_id = room_res.json()["id"]

    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-08-01",
        },
    )
    assert stay_res.status_code == 201
    stay_data = stay_res.json()
    assert stay_data["travel_record_id"] == tr_id


def test_update_travel_record_actual_exit_closes_active_stay(client: TestClient) -> None:
    """Cycle 3: Khi chốt Ngày thực tế đã về nước trên TravelRecord -> Tự động đóng đợt Stay active (end_date = actual_exit_date)."""
    emp_res = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "CHEN MIN",
            "gender": "Nữ",
            "nationality": "Trung Quốc",
            "passport_number": "E77776666",
        },
    )
    emp_id = emp_res.json()["id"]

    # 1. Tạo đợt nhập cảnh
    tr_res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={
            "entry_date": "2026-08-01",
            "expected_exit_date": "2026-08-30",
        },
    )
    tr_id = tr_res.json()["id"]

    # 2. Xếp phòng KTX
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1608"})
    room_id = room_res.json()["id"]

    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-08-01",
        },
    )
    stay_id = stay_res.json()["id"]

    # 3. Cập nhật ngày về nước thực tế
    update_tr_res = client.put(
        f"/api/hr-foreign/employees/{emp_id}/travel-records/{tr_id}",
        json={
            "entry_date": "2026-08-01",
            "expected_exit_date": "2026-08-30",
            "actual_exit_date": "2026-08-10",
        },
    )
    assert update_tr_res.status_code == 200

    # 4. Kiểm tra đợt Stay đã được tự động chốt end_date = 2026-08-10
    get_stays_res = client.get(f"/api/hr-foreign/stays?employee_id={emp_id}")
    assert get_stays_res.status_code == 200
    stays = get_stays_res.json()
    assert len(stays) == 1
    assert stays[0]["end_date"] == "2026-08-10"


