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


def test_visa_tamtru_and_expiring_alerts(client: TestClient) -> None:
    # Setup Employee and Stay
    emp = client.post(
        "/api/hr-foreign/employees",
        json={
            "name_latin": "ZHANG SAN",
            "gender": "Nam",
            "nationality": "Trung Quoc",
            "passport_number": "Z99887766",
            "entry_date": "2026-01-01",
        },
    ).json()

    stay = client.post(
        "/api/hr-foreign/stays",
        json={
            "employee_id": emp["id"],
            "accommodation_type": "HOTEL",
            "stay_type": "CONG_TAC",
            "has_meals": False,
            "start_date": "2026-01-01",
        },
    ).json()

    emp_id = emp["id"]

    # 1. Add Visas (1 expired/normal, 1 expiring within 30 days)
    today = datetime.date.today()
    expiring_date = (today + datetime.timedelta(days=10)).isoformat()

    v1 = client.post(
        f"/api/hr-foreign/employees/{emp_id}/visas",
        json={
            "visa_type": "DN1",
            "issue_date": "2026-01-01",
            "expiry_date": expiring_date,
            "notes": "Visa sap het han",
        },
    )
    assert v1.status_code == 201, v1.json()

    # List visas
    v_list = client.get(f"/api/hr-foreign/employees/{emp_id}/visas")
    assert len(v_list.json()) == 1

    # 2. Add TamTru (expiring within 15 days)
    tt1 = client.post(
        f"/api/hr-foreign/employees/{emp_id}/tam-trus",
        json={
            "registration_date": "2026-01-02",
            "expiry_date": (today + datetime.timedelta(days=15)).isoformat(),
            "notes": "Tam tru cap xa",
        },
    )
    assert tt1.status_code == 201, tt1.json()

    # List tamtrus
    tt_list = client.get(f"/api/hr-foreign/employees/{emp_id}/tam-trus")
    assert len(tt_list.json()) == 1

    # 3. Check Expiring Documents Endpoint
    exp_res = client.get("/api/hr-foreign/expiring-documents?days=30")
    assert exp_res.status_code == 200, exp_res.json()
    exp_data = exp_res.json()

    assert len(exp_data["expiring_visas"]) == 1
    assert exp_data["expiring_visas"][0]["employee_name"] == "ZHANG SAN"
    assert exp_data["expiring_visas"][0]["type_name"] == "DN1"

    assert len(exp_data["expiring_tam_trus"]) == 1
    assert exp_data["expiring_tam_trus"][0]["employee_name"] == "ZHANG SAN"

    # 4. Delete Visa & TamTru
    del_v = client.delete(f"/api/hr-foreign/visas/{v1.json()['id']}")
    assert del_v.status_code == 204

    del_tt = client.delete(f"/api/hr-foreign/tam-trus/{tt1.json()['id']}")
    assert del_tt.status_code == 204


def test_contract_crud_with_contract_number(client: TestClient) -> None:
    emp = client.post(
        "/api/hr-foreign/employees",
        json={"name_latin": "LI WEI", "gender": "Nam", "passport_number": "P12345678"},
    ).json()

    # Create contract with contract_number
    res = client.post(
        f"/api/hr-foreign/employees/{emp['id']}/contracts",
        json={
            "contract_number": "HD-2026-001",
            "contract_type": "CẤP MỚI",
            "start_date": "2026-01-01",
            "end_date": "2027-01-01",
            "notes": "Hợp đồng thử nghiệm",
        },
    )
    assert res.status_code == 201, res.json()
    c_data = res.json()
    assert c_data["contract_number"] == "HD-2026-001"

    # Update contract number
    res_up = client.put(
        f"/api/hr-foreign/contracts/{c_data['id']}",
        json={
            "contract_number": "HD-2026-001-REV1",
            "contract_type": "GIA HẠN",
            "start_date": "2026-01-01",
            "end_date": "2028-01-01",
        },
    )
    assert res_up.status_code == 200, res_up.json()
    assert res_up.json()["contract_number"] == "HD-2026-001-REV1"

