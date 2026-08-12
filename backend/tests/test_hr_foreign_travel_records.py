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


@pytest.fixture
def emp_id(client: TestClient) -> int:
    """Create a base employee and return its id."""
    res = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "ZHANG WEI", "gender": "Nam"},
    )
    assert res.status_code == 201, res.json()
    return res.json()["id"]


# ---------------------------------------------------------------------------
# Behavior 1: list travel records — empty list when no records exist
# ---------------------------------------------------------------------------
def test_list_travel_records_empty(client: TestClient, emp_id: int) -> None:
    res = client.get(f"/api/hr-foreign/employees/{emp_id}/travel-records")
    assert res.status_code == 200
    assert res.json() == []


# ---------------------------------------------------------------------------
# Behavior 2: add first trip — always succeeds (no prior open trip)
# ---------------------------------------------------------------------------
def test_add_first_travel_record(client: TestClient, emp_id: int) -> None:
    payload = {
        "entry_date": "2026-05-10",
        "expected_exit_date": "2026-08-10",
        "actual_exit_date": None,
    }
    res = client.post(f"/api/hr-foreign/employees/{emp_id}/travel-records", json=payload)
    assert res.status_code == 201, res.json()
    data = res.json()
    assert data["entry_date"] == "2026-05-10"
    assert data["expected_exit_date"] == "2026-08-10"
    assert data["actual_exit_date"] is None
    assert data["employee_id"] == emp_id

    # List should now return 1 record
    res = client.get(f"/api/hr-foreign/employees/{emp_id}/travel-records")
    assert len(res.json()) == 1


# ---------------------------------------------------------------------------
# Behavior 3: add new trip while old trip still open → HTTP 400
# ---------------------------------------------------------------------------
def test_reject_new_trip_when_open_trip_exists(client: TestClient, emp_id: int) -> None:
    # Add first open trip (no actual_exit_date)
    client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )
    # Attempt to add a second trip without closing the first
    res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-06-01", "expected_exit_date": "2026-11-01"},
    )
    assert res.status_code == 400
    assert "chưa có Ngày về thực tế" in res.json()["detail"]


# ---------------------------------------------------------------------------
# Behavior 4: add new trip after closing previous one → HTTP 201
# ---------------------------------------------------------------------------
def test_add_trip_after_closed_previous(client: TestClient, emp_id: int) -> None:
    # First trip — closed
    client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={
            "entry_date": "2026-05-10",
            "expected_exit_date": "2026-08-10",
            "actual_exit_date": "2026-06-01",
        },
    )
    # Second trip — should succeed
    res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-07-01", "expected_exit_date": "2026-11-01"},
    )
    assert res.status_code == 201, res.json()
    assert res.json()["entry_date"] == "2026-07-01"

    res = client.get(f"/api/hr-foreign/employees/{emp_id}/travel-records")
    assert len(res.json()) == 2


# ---------------------------------------------------------------------------
# Behavior 5: edit expected_exit_date of open trip → success
# ---------------------------------------------------------------------------
def test_edit_travel_record(client: TestClient, emp_id: int) -> None:
    # Create open trip
    r = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )
    rid = r.json()["id"]

    res = client.put(
        f"/api/hr-foreign/employees/{emp_id}/travel-records/{rid}",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-09-01"},
    )
    assert res.status_code == 200
    assert res.json()["expected_exit_date"] == "2026-09-01"


# ---------------------------------------------------------------------------
# Behavior 6: edit actual_exit_date < entry_date → HTTP 400
# ---------------------------------------------------------------------------
def test_reject_exit_before_entry(client: TestClient, emp_id: int) -> None:
    r = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )
    rid = r.json()["id"]

    res = client.put(
        f"/api/hr-foreign/employees/{emp_id}/travel-records/{rid}",
        json={"entry_date": "2026-05-10", "actual_exit_date": "2026-04-01"},
    )
    assert res.status_code == 400
    assert "không thể nhỏ hơn ngày đến" in res.json()["detail"]


# ---------------------------------------------------------------------------
# Behavior 7: Record exit date with CHECK_OUT option -> checks out active Stay
# ---------------------------------------------------------------------------
def test_record_exit_with_checkout(client: TestClient, emp_id: int) -> None:
    # 1. Create open travel record
    client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )

    # 2. Assign employee to a KTX room (Create active Stay)
    # First create a room
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1601"})
    assert room_res.status_code == 201
    room_id = room_res.json()["id"]

    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-05-10",
        },
    )
    assert stay_res.status_code == 201
    stay_id = stay_res.json()["id"]

    # 3. Record exit date with CHECK_OUT action
    exit_res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/record-exit",
        json={
            "actual_exit_date": "2026-07-20",
            "action_type": "CHECK_OUT",
            "notes": "Về nước kết thúc đợt",
        },
    )
    assert exit_res.status_code == 200, exit_res.json()

    # 4. Verify employee master actual_exit_date synced
    emp_res = client.get(f"/api/hr-foreign/employees/{emp_id}")
    assert emp_res.json()["actual_exit_date"] == "2026-07-20"

    # 5. Verify active Stay end_date updated to actual_exit_date
    history_res = client.get(f"/api/hr-foreign/employees/{emp_id}/history")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert len(history_data["stays"]) == 1
    assert history_data["stays"][0]["end_date"] == "2026-07-20"


# ---------------------------------------------------------------------------
# Behavior 8: Record exit date with KEEP_ROOM_ABSENCE -> keeps Stay active
# ---------------------------------------------------------------------------
def test_record_exit_with_keep_room_absence(client: TestClient, emp_id: int) -> None:
    # 1. Create open travel record
    client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )

    # 2. Create active Stay in KTX
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "1602"})
    room_id = room_res.json()["id"]

    client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-05-10",
        },
    )

    # 3. Record exit date with KEEP_ROOM_ABSENCE
    exit_res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/record-exit",
        json={
            "actual_exit_date": "2026-07-20",
            "action_type": "KEEP_ROOM_ABSENCE",
            "notes": "Về nước ngắn hạn, giữ phòng",
        },
    )
    assert exit_res.status_code == 200, exit_res.json()

    # 4. Verify employee master updated
    emp_res = client.get(f"/api/hr-foreign/employees/{emp_id}")
    assert emp_res.json()["actual_exit_date"] == "2026-07-20"

    # 5. Verify Stay is STILL ACTIVE (end_date remains null)
    history_res = client.get(f"/api/hr-foreign/employees/{emp_id}/history")
    history_data = history_res.json()
    assert history_data["stays"][0]["end_date"] is None


# ---------------------------------------------------------------------------
# Behavior 9: Record exit with optional actual_exit_date updates expected dates without exiting
# ---------------------------------------------------------------------------
def test_record_exit_optional_actual_exit_date_updates_expected_dates(
    client: TestClient, emp_id: int
) -> None:
    # 1. Create open travel record
    client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-05-10", "expected_exit_date": "2026-08-10"},
    )

    # 2. Call record-exit updating only expected_exit_date
    res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/record-exit",
        json={"expected_exit_date": "2026-09-15"},
    )
    assert res.status_code == 200, res.json()
    tr = res.json()
    assert tr["actual_exit_date"] is None
    assert tr["expected_exit_date"] == "2026-09-15"

    # 3. Verify employee master updated and remains in VN
    emp = client.get(f"/api/hr-foreign/employees/{emp_id}").json()
    assert emp["actual_exit_date"] is None
    assert emp["expected_exit_date"] == "2026-09-15"
    assert emp["is_in_vietnam"] is True


def test_reject_future_actual_dates(client: TestClient, emp_id: int) -> None:
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()

    # Reject future entry_date
    res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": future_date},
    )
    assert res.status_code == 400
    assert "khuyến nghị" in res.json()["detail"].lower() or "tương lai" in res.json()["detail"].lower()

    # Reject future actual_exit_date
    res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/record-exit",
        json={"actual_exit_date": future_date},
    )
    assert res.status_code == 400
    assert "tương lai" in res.json()["detail"].lower()


def test_delete_travel_record_cascades_to_stays(client: TestClient, emp_id: int) -> None:
    # 1. Create open travel record
    tr_res = client.post(
        f"/api/hr-foreign/employees/{emp_id}/travel-records",
        json={"entry_date": "2026-06-01", "expected_exit_date": "2026-09-01"},
    )
    assert tr_res.status_code == 201
    tr_id = tr_res.json()["id"]

    # 2. Create stay bound to this travel record
    room_res = client.post("/api/hr-foreign/rooms", json={"room_number": "909"})
    room_id = room_res.json()["id"]
    stay_res = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp_id,
            "accommodation_type": "KTX",
            "room_id": room_id,
            "stay_type": "CO_DINH",
            "start_date": "2026-06-01",
        },
    )
    assert stay_res.status_code == 201

    # 3. Verify history has 1 travel record and 1 stay
    hist_before = client.get(f"/api/hr-foreign/employees/{emp_id}/history").json()
    assert len(hist_before["travel_records"]) == 1
    assert len(hist_before["stays"]) == 1

    # 4. Delete Travel Record
    del_res = client.delete(f"/api/hr-foreign/employees/{emp_id}/travel-records/{tr_id}")
    assert del_res.status_code == 204

    # 5. Verify travel record AND stay are deleted
    hist_after = client.get(f"/api/hr-foreign/employees/{emp_id}/history").json()
    assert len(hist_after["travel_records"]) == 0
    assert len(hist_after["stays"]) == 0




