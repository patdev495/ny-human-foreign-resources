from __future__ import annotations

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


def test_vehicle_catalog_and_seed_data(client: TestClient) -> None:
    # 1. Get initial vehicles (should trigger seed data with A Ngọc, A Đại, etc.)
    res = client.get("/api/vehicle-management/vehicles")
    assert res.status_code == 200, res.json()
    vehicles = res.json()
    assert len(vehicles) >= 5

    company_vehicles = [v for v in vehicles if v["ownership_group"] == "COMPANY_OWNED"]
    outsourced_vehicles = [v for v in vehicles if v["ownership_group"] == "OUTSOURCED"]

    company_names = {v["name"] for v in company_vehicles}
    assert "A Ngọc" in company_names
    assert "A Đại" in company_names

    outsourced_names = {v["name"] for v in outsourced_vehicles}
    assert "Xe 4 chỗ" in outsourced_names
    assert "Xe 7 chỗ" in outsourced_names

    # 2. Create new Vehicle
    new_vehicle_payload = {
        "ownership_group": "COMPANY_OWNED",
        "name": "A Hùng",
        "driver_name": "Nguyễn Văn Hùng",
        "license_plate": "29B-999.99",
        "driver_phone": "0912345678",
        "default_cost": 0,
    }
    res = client.post("/api/vehicle-management/vehicles", json=new_vehicle_payload)
    assert res.status_code == 201, res.json()
    v_data = res.json()
    v_id = v_data["id"]
    assert v_data["name"] == "A Hùng"
    assert v_data["ownership_group"] == "COMPANY_OWNED"

    # 3. Update Vehicle
    update_payload = {
        "ownership_group": "COMPANY_OWNED",
        "name": "A Hùng (Xe Fortuner)",
        "driver_name": "Nguyễn Văn Hùng",
        "license_plate": "29B-999.99",
        "driver_phone": "0912345678",
        "default_cost": 100000,
    }
    res = client.put(f"/api/vehicle-management/vehicles/{v_id}", json=update_payload)
    assert res.status_code == 200, res.json()
    assert res.json()["name"] == "A Hùng (Xe Fortuner)"
    assert res.json()["default_cost"] == 100000

    # 4. Delete Vehicle
    res = client.delete(f"/api/vehicle-management/vehicles/{v_id}")
    assert res.status_code == 200

    # Verify deleted
    res = client.get("/api/vehicle-management/vehicles")
    assert not any(v["id"] == v_id for v in res.json())


def test_vehicle_dispatch_crud_and_overrides(client: TestClient) -> None:
    # 1. Create a Vehicle Dispatch record
    dispatch_payload = {
        "dispatch_date": "2026-07-27",
        "vehicle_id": 1,
        "vehicle_name": "A Ngọc",
        "ownership_group": "COMPANY_OWNED",
        "driver_name": "A Ngọc",
        "license_plate": "29A-111.11",
        "pickup_location": "KTX Nhà máy NY",
        "dropoff_location": "Sân bay Nội Bài",
        "pickup_time": "08:30",
        "passenger_name": "WANG LEI (王伟)",
        "passenger_count": 2,
        "cost": 350000.0,
        "notes": "Đón chuyên gia đi sân bay",
    }
    res = client.post("/api/vehicle-management/dispatches", json=dispatch_payload)
    assert res.status_code == 201, res.json()
    d_data = res.json()
    d_id = d_data["id"]
    assert d_data["vehicle_name"] == "A Ngọc"
    assert d_data["pickup_location"] == "KTX Nhà máy NY"
    assert d_data["dropoff_location"] == "Sân bay Nội Bài"
    assert d_data["cost"] == 350000.0

    # 2. List dispatches
    res = client.get("/api/vehicle-management/dispatches")
    assert res.status_code == 200
    dispatches = res.json()
    assert len(dispatches) == 1
    assert dispatches[0]["id"] == d_id

    # 3. Update dispatch (HR changes cost and dropoff location later)
    update_payload = {
        **dispatch_payload,
        "dropoff_location": "Khách sạn Mường Thanh",
        "cost": 400000.0,
        "notes": "Thay đổi điểm đến sang Khách sạn Mường Thanh",
    }
    res = client.put(f"/api/vehicle-management/dispatches/{d_id}", json=update_payload)
    assert res.status_code == 200, res.json()
    updated = res.json()
    assert updated["dropoff_location"] == "Khách sạn Mường Thanh"
    assert updated["cost"] == 400000.0

    # 4. Delete dispatch
    res = client.delete(f"/api/vehicle-management/dispatches/{d_id}")
    assert res.status_code == 200

    res = client.get("/api/vehicle-management/dispatches")
    assert len(res.json()) == 0


def test_vehicle_dispatch_filtering(client: TestClient) -> None:
    # Seed 2 dispatches on different dates and ownership groups
    d1 = {
        "dispatch_date": "2026-07-20",
        "vehicle_name": "A Đại",
        "ownership_group": "COMPANY_OWNED",
        "driver_name": "A Đại",
        "pickup_location": "Công ty",
        "dropoff_location": "KTX",
        "passenger_name": "ZHANG WEI",
        "cost": 0,
    }
    d2 = {
        "dispatch_date": "2026-07-25",
        "vehicle_name": "Xe 7 chỗ",
        "ownership_group": "OUTSOURCED",
        "driver_name": "Bình",
        "pickup_location": "Sân bay Nội Bài",
        "dropoff_location": "Công ty",
        "passenger_name": "LI NA",
        "cost": 500000.0,
    }
    client.post("/api/vehicle-management/dispatches", json=d1)
    client.post("/api/vehicle-management/dispatches", json=d2)

    # Filter by date range
    res = client.get("/api/vehicle-management/dispatches?from_date=2026-07-24&to_date=2026-07-27")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["vehicle_name"] == "Xe 7 chỗ"

    # Filter by ownership group
    res = client.get("/api/vehicle-management/dispatches?ownership_group=COMPANY_OWNED")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["vehicle_name"] == "A Đại"

    # Filter by search
    res = client.get("/api/vehicle-management/dispatches?search=Nội Bài")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["vehicle_name"] == "Xe 7 chỗ"
