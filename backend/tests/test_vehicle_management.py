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
    # Test contract PDF endpoint
    res_pdf = client.get("/api/vehicle-management/contracts/pdf/7_seater")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"

    # 1. Get initial vehicles (should trigger seed data with A Ngọc, A Đại, etc.)
    res = client.get("/api/vehicle-management/vehicles")
    assert res.status_code == 200, res.json()
    vehicles = res.json()
    assert len(vehicles) >= 5

    company_vehicles = [v for v in vehicles if v["ownership_group"] == "COMPANY_OWNED"]
    outsourced_vehicles = [v for v in vehicles if v["ownership_group"] == "OUTSOURCED"]

    company_drivers = {v["driver_name"] for v in company_vehicles if v.get("driver_name")}
    assert "Anh Ngọc" in company_drivers
    assert "Chú Đại" in company_drivers

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
        "driver_phone": "0972290559",
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
    assert d_data["driver_phone"] == "0972290559"
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


def test_vehicle_providers_and_seed_data(client: TestClient) -> None:
    # Get initial providers (should seed Bình An & Đội xe Công ty)
    res = client.get("/api/vehicle-management/providers")
    assert res.status_code == 200, res.json()
    providers = res.json()
    names = {p["name"] for p in providers}
    assert "Bình An" in names
    assert "Hương Giang" not in names
    assert "Đội xe Công ty" in names


def test_vendor_routes_and_cost_calculation(client: TestClient) -> None:
    # 1. Get providers to find Bình An ID
    res = client.get("/api/vehicle-management/providers")
    providers = res.json()
    binh_an = next(p for p in providers if p["name"] == "Bình An")
    p_id = binh_an["id"]

    # 2. Get routes for Bình An
    res = client.get(f"/api/vehicle-management/vendor-routes?provider_id={p_id}")
    assert res.status_code == 200, res.json()
    routes = res.json()
    assert len(routes) >= 20

    noi_bai_7_seat = next(
        r for r in routes if "Sân bay Nội Bài" in r["dropoff_location"] and r["seat_type"] == "7 chỗ"
    )
    assert noi_bai_7_seat["fixed_price"] == 700000.0

    # 3. Calculate cost for fixed route (700k + 2 hours waiting @ 30k/h = 760k)
    calc_payload = {
        "provider_id": p_id,
        "vendor_route_id": noi_bai_7_seat["id"],
        "route_type": "FIXED_ROUTE",
        "seat_type": "7 chỗ",
        "distance_km": 0.0,
        "waiting_hours": 2.0,
    }
    res = client.post("/api/vehicle-management/calculate-cost", json=calc_payload)
    assert res.status_code == 200, res.json()
    calc_res = res.json()
    assert calc_res["base_cost"] == 700000.0
    assert calc_res["waiting_cost"] == 60000.0
    assert calc_res["total_calculated_cost"] == 760000.0

    # 4. Calculate cost for KM based route (50 km @ 14k/km = 700k + 1 hour waiting = 730k)
    calc_km_payload = {
        "provider_id": p_id,
        "route_type": "KM_BASED",
        "seat_type": "4 chỗ",
        "distance_km": 50.0,
        "waiting_hours": 1.0,
    }
    res = client.post("/api/vehicle-management/calculate-cost", json=calc_km_payload)
    assert res.status_code == 200, res.json()
    calc_res = res.json()
    assert calc_res["base_cost"] == 700000.0
    assert calc_res["waiting_cost"] == 30000.0
    assert calc_res["total_calculated_cost"] == 730000.0


def test_vehicle_dispatch_billing_month_filter(client: TestClient) -> None:
    # Billing cycle for 2026-05 is 2026-04-26 to 2026-05-25
    dispatches_data = [
        {"dispatch_date": "2026-04-25", "vehicle_name": "Out of cycle (Before)", "cost": 100000},
        {"dispatch_date": "2026-04-26", "vehicle_name": "In cycle (Start)", "cost": 200000},
        {"dispatch_date": "2026-05-15", "vehicle_name": "In cycle (Middle)", "cost": 300000},
        {"dispatch_date": "2026-05-25", "vehicle_name": "In cycle (End)", "cost": 400000},
        {"dispatch_date": "2026-05-26", "vehicle_name": "Out of cycle (After)", "cost": 500000},
    ]

    for d in dispatches_data:
        client.post("/api/vehicle-management/dispatches", json=d)

    res = client.get("/api/vehicle-management/dispatches?billing_month=2026-05")
    assert res.status_code == 200, res.json()
    items = res.json()
    names = [i["vehicle_name"] for i in items]

    assert "In cycle (Start)" in names
    assert "In cycle (Middle)" in names
    assert "In cycle (End)" in names
    assert "Out of cycle (Before)" not in names
    assert "Out of cycle (After)" not in names


def test_duc_anh_vehicles_seed_and_contracts(client: TestClient) -> None:
    # 1. Fetch vehicles to ensure Đức Anh vehicles are seeded
    res = client.get("/api/vehicle-management/vehicles")
    assert res.status_code == 200, res.json()
    vehicles = res.json()
    license_plates = {v["license_plate"] for v in vehicles if v.get("license_plate")}

    assert "98A-369.00" in license_plates
    assert "98A-819.88" in license_plates
    assert "99H-103.78" in license_plates

    # 2. Fetch monthly contract configs
    res = client.get("/api/vehicle-management/contracts")
    assert res.status_code == 200, res.json()
    contracts = res.json()
    assert len(contracts) >= 3

    innova_contract = next(c for c in contracts if c["license_plate"] == "98A-369.00")
    assert innova_contract["base_monthly_cost"] == 25000000.0
    assert innova_contract["km_allowance"] == 3000
    assert innova_contract["excess_km_rate"] == 6500.0
    assert innova_contract["standard_start_time"] == "07:00"
    assert innova_contract["standard_end_time"] == "18:00"

    truck_contract = next(c for c in contracts if c["license_plate"] == "99H-103.78")
    assert truck_contract["base_monthly_cost"] == 42000000.0
    assert truck_contract["km_allowance"] == 3000
    assert truck_contract["excess_km_rate"] == 10000.0
    assert truck_contract["standard_start_time"] == "08:00"
    assert truck_contract["standard_end_time"] == "18:00"


def test_daily_odometer_log_crud_and_billing_month(client: TestClient) -> None:
    # 1. Get vehicle ID for 98A-369.00
    res = client.get("/api/vehicle-management/vehicles")
    vehicles = res.json()
    innova_v = next(v for v in vehicles if v.get("license_plate") == "98A-369.00")
    v_id = innova_v["id"]

    # 2. Create Odometer Log
    log_payload = {
        "vehicle_id": v_id,
        "log_date": "2026-05-10",
        "start_km": 50000.0,
        "end_km": 50120.0,
        "notes": "Chạy đưa đón cán bộ Bắc Ninh",
    }
    res = client.post("/api/vehicle-management/odometer-logs", json=log_payload)
    assert res.status_code == 201, res.json()
    log_data = res.json()
    assert log_data["daily_km"] == 120.0
    assert log_data["license_plate"] == "98A-369.00"

    # 3. Update Odometer Log (Same vehicle and date updates existing entry)
    update_payload = {
        "vehicle_id": v_id,
        "log_date": "2026-05-10",
        "start_km": 50000.0,
        "end_km": 50150.0,
        "notes": "Cập nhật lại số km chốt chặng tối",
    }
    res = client.post("/api/vehicle-management/odometer-logs", json=update_payload)
    assert res.status_code == 201, res.json()
    updated_data = res.json()
    assert updated_data["daily_km"] == 150.0

    # 4. Fetch logs by billing_month 2026-05 (range 2026-04-26 to 2026-05-25)
    res = client.get(f"/api/vehicle-management/odometer-logs?vehicle_id={v_id}&billing_month=2026-05")
    assert res.status_code == 200, res.json()
    logs = res.json()
    assert len(logs) == 1
    assert logs[0]["daily_km"] == 150.0


def test_monthly_reconciliation_report(client: TestClient) -> None:
    # Get vehicles for 98A-369.00 and 99H-103.78
    res = client.get("/api/vehicle-management/vehicles")
    vehicles = res.json()
    v_innova = next(v for v in vehicles if v.get("license_plate") == "98A-369.00")
    v_truck = next(v for v in vehicles if v.get("license_plate") == "99H-103.78")

    # Log odometer readings in cycle 2026-05 (2026-04-26 to 2026-05-25)
    # Innova 1: 3,200 km total (200 km excess @ 6,500 = 1,300,000)
    client.post(
        "/api/vehicle-management/odometer-logs",
        json={"vehicle_id": v_innova["id"], "log_date": "2026-05-01", "start_km": 1000.0, "end_km": 4200.0},
    )

    # Truck: 3,500 km total (500 km excess @ 10,000 = 5,000,000)
    client.post(
        "/api/vehicle-management/odometer-logs",
        json={"vehicle_id": v_truck["id"], "log_date": "2026-05-01", "start_km": 10000.0, "end_km": 13500.0},
    )

    # Call monthly reconciliation report endpoint
    res = client.get("/api/vehicle-management/reports/monthly-reconciliation?billing_month=2026-05")
    assert res.status_code == 200, res.json()
    items = res.json()
    assert len(items) >= 3

    r_innova = next(i for i in items if i["license_plate"] == "98A-369.00")
    assert r_innova["base_monthly_cost"] == 25000000.0
    assert r_innova["total_month_km"] == 3200.0
    assert r_innova["excess_km"] == 200.0
    assert r_innova["excess_km_cost"] == 1300000.0
    assert r_innova["total_cost"] == 26300000.0

    r_truck = next(i for i in items if i["license_plate"] == "99H-103.78")
    assert r_truck["base_monthly_cost"] == 42000000.0
    assert r_truck["total_month_km"] == 3500.0
    assert r_truck["excess_km"] == 500.0
    assert r_truck["excess_km_cost"] == 5000000.0
    assert r_truck["total_cost"] == 47000000.0


def test_get_contract_pdf(client: TestClient) -> None:
    res = client.get("/api/vehicle-management/contracts/pdf/7_seater")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "inline" in res.headers.get("content-disposition", "")


def test_export_vehicle_excel(client: TestClient) -> None:
    # 1. Export Excel for COMPANY_OWNED (Đức Anh - 3 vehicles packaged in ZIP file)
    res_company = client.get("/api/vehicle-management/export-excel?provider_type=COMPANY_OWNED&from_date=2026-05-01&to_date=2026-05-31")
    assert res_company.status_code == 200
    assert "zip" in res_company.headers["content-type"]
    assert "Bao_Cao_3_Xe_Duc_Anh" in res_company.headers["content-disposition"]
    assert res_company.headers["content-disposition"].endswith('.zip"') or "zip" in res_company.headers["content-disposition"]
    assert len(res_company.content) > 1000

    import zipfile, io, openpyxl
    z = zipfile.ZipFile(io.BytesIO(res_company.content))
    namelist = z.namelist()
    assert len(namelist) == 3
    assert any("98A819.88" in name or "98A-819.88" in name for name in namelist)
    assert any("98A8369.00" in name or "98A-369.00" in name for name in namelist)
    assert any("99H103.78" in name or "99H-103.78" in name for name in namelist)

    # Check each file inside zip
    for fname in namelist:
        data = z.read(fname)
        wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True)
        assert len(wb.sheetnames) >= 1

    # 2. Export Excel for OUTSOURCED (Bình An)
    res_outsourced = client.get("/api/vehicle-management/export-excel?provider_type=OUTSOURCED&from_date=2026-05-01&to_date=2026-05-31")
    assert res_outsourced.status_code == 200
    assert "spreadsheetml" in res_outsourced.headers["content-type"]
    assert "Bang_Ke_Chuyen_Xe_Binh_An" in res_outsourced.headers["content-disposition"]
    assert len(res_outsourced.content) > 1000


def test_vehicle_dispatch_extra_expense_fields(client: TestClient) -> None:
    # Test creating dispatch with toll_fee, meal_count, overnight_count
    payload = {
        "dispatch_date": "2026-07-15",
        "vehicle_name": "Xe tải 8 tấn",
        "ownership_group": "COMPANY_OWNED",
        "pickup_location": "Kho Vân Trung",
        "dropoff_location": "Nienyi",
        "pickup_time": "08:00",
        "return_time": "21:00",
        "toll_fee": 70000.0,
        "meal_count": 1,
        "overnight_count": 1,
    }
    res = client.post("/api/vehicle-management/dispatches", json=payload)
    assert res.status_code == 201, res.json()
    d = res.json()
    assert d["toll_fee"] == 70000.0
    assert d["meal_count"] == 1
    assert d["overnight_count"] == 1







