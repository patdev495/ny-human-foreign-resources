from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import (
    MonthlyVehicleContract,
    OwnershipGroup,
    Vehicle,
    VehicleDispatch,
    VehicleProvider,
)
from features.vehicle_management.schemas import VehicleCreate, VehicleUpdate
from features.vehicle_management.services.provider_service import seed_default_providers_and_routes


def seed_default_vehicles(db: Session) -> None:
    seed_default_providers_and_routes(db)
    all_vehicles = db.query(Vehicle).all()
    corrupted_v_ids = [
        v.id for v in all_vehicles if "?" in (v.name or "") or "?" in (v.driver_name or "")
    ]
    if corrupted_v_ids:
        db.query(Vehicle).filter(Vehicle.id.in_(corrupted_v_ids)).delete(synchronize_session=False)
        db.commit()

    all_dispatches = db.query(VehicleDispatch).all()
    corrupted_d_ids = [
        d.id for d in all_dispatches if "?" in (d.vehicle_name or "") or "?" in (d.driver_name or "")
    ]
    if corrupted_d_ids:
        db.query(VehicleDispatch).filter(VehicleDispatch.id.in_(corrupted_d_ids)).delete(synchronize_session=False)
        db.commit()

    defaults = [
        Vehicle(
            ownership_group=OwnershipGroup.COMPANY_OWNED,
            name="A Ngọc",
            driver_name="A Ngọc",
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.COMPANY_OWNED,
            name="A Đại",
            driver_name="A Đại",
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.OUTSOURCED,
            name="Xe 4 chỗ",
            driver_name=None,
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
        Vehicle(
            ownership_group=OwnershipGroup.OUTSOURCED,
            name="Xe 7 chỗ",
            driver_name=None,
            license_plate=None,
            driver_phone=None,
            default_cost=0.0,
            is_active=True,
        ),
    ]
    if db.query(Vehicle).count() == 0:
        for v in defaults:
            db.add(v)
        db.commit()

    seed_duc_anh_vehicles_and_contracts(db)


def seed_duc_anh_vehicles_and_contracts(db: Session) -> None:
    p_company = db.query(VehicleProvider).filter(VehicleProvider.name == "Đội xe Công ty").first()
    provider_id = p_company.id if p_company else None

    duc_anh_data = [
        {
            "name": "Xe 7 chỗ - Innova 98A-369.00 (Anh Ngọc)",
            "driver_name": "Anh Ngọc",
            "license_plate": "98A-369.00",
            "driver_phone": "0972290559",
            "contract": {
                "contract_name": "HĐ Thuê xe 7 chỗ (Xe 98A-369.00 - Anh Ngọc)",
                "base_monthly_cost": 25000000.0,
                "km_allowance": 3000.0,
                "excess_km_rate": 6500.0,
                "standard_start_time": "07:00",
                "standard_end_time": "18:00",
                "sunday_standard_start_time": "07:30",
                "sunday_standard_end_time": "18:00",
                "evening_fixed_bonus_start": "18:00",
                "evening_fixed_bonus_end": "22:00",
                "evening_fixed_bonus_amount": 100000.0,
                "overtime_rate_weekday": 50000.0,
                "overtime_rate_weekend": 50000.0,
                "sunday_daily_rate": 1000000.0,
                "holiday_daily_rate": 1200000.0,
                "overnight_fee": 300000.0,
                "meal_allowance_fee": 0.0,
                "notes": "Xe TOYOTA INNOVA 7 chỗ màu Bạc 98A-369.00 (Lái xe: Anh Ngọc)",
            },
        },
        {
            "name": "Xe 7 chỗ - Innova 98A-819.88 (Chú Đại)",
            "driver_name": "Chú Đại",
            "license_plate": "98A-819.88",
            "driver_phone": "0972290559",
            "contract": {
                "contract_name": "HĐ Thuê xe 7 chỗ (Xe 98A-819.88 - Chú Đại)",
                "base_monthly_cost": 25000000.0,
                "km_allowance": 3000.0,
                "excess_km_rate": 6500.0,
                "standard_start_time": "07:00",
                "standard_end_time": "18:00",
                "sunday_standard_start_time": "07:30",
                "sunday_standard_end_time": "18:00",
                "evening_fixed_bonus_start": "18:00",
                "evening_fixed_bonus_end": "22:00",
                "evening_fixed_bonus_amount": 100000.0,
                "overtime_rate_weekday": 50000.0,
                "overtime_rate_weekend": 50000.0,
                "sunday_daily_rate": 1000000.0,
                "holiday_daily_rate": 1200000.0,
                "overnight_fee": 300000.0,
                "meal_allowance_fee": 0.0,
                "notes": "Xe TOYOTA INNOVA 7 chỗ màu Nâu đồng 98A-819.88 (Lái xe: Chú Đại)",
            },
        },
        {
            "name": "Xe tải 8 tấn - CNHTC 99H-103.78",
            "driver_name": "Nguyễn Văn Ngọc",
            "license_plate": "99H-103.78",
            "driver_phone": "0972290559",
            "contract": {
                "contract_name": "HĐ Thuê xe tải 8 tấn (99H-103.78)",
                "base_monthly_cost": 42000000.0,
                "km_allowance": 3000.0,
                "excess_km_rate": 10000.0,
                "standard_start_time": "08:00",
                "standard_end_time": "18:00",
                "sunday_standard_start_time": "08:00",
                "sunday_standard_end_time": "18:00",
                "evening_fixed_bonus_start": None,
                "evening_fixed_bonus_end": None,
                "evening_fixed_bonus_amount": 0.0,
                "overtime_rate_weekday": 50000.0,
                "overtime_rate_weekend": 100000.0,
                "sunday_daily_rate": 1000000.0,
                "holiday_daily_rate": 1200000.0,
                "overnight_fee": 300000.0,
                "meal_allowance_fee": 50000.0,
                "notes": "Xe tải thùng kín CNHTC 7.4 tấn / 8 tấn 99H-103.78",
            },
        },
    ]

    legacy_placeholders = (
        db.query(Vehicle)
        .filter(
            Vehicle.ownership_group == OwnershipGroup.COMPANY_OWNED,
            Vehicle.license_plate == None,
            Vehicle.name.in_(["A Ngọc", "A Đại", "Xe Đức Anh"]),
        )
        .all()
    )
    for lp in legacy_placeholders:
        db.delete(lp)
    if legacy_placeholders:
        db.flush()

    for item in duc_anh_data:
        existing_v = (
            db.query(Vehicle)
            .filter(Vehicle.license_plate == item["license_plate"])
            .first()
        )
        if not existing_v:
            existing_v = Vehicle(
                provider_id=provider_id,
                ownership_group=OwnershipGroup.COMPANY_OWNED,
                name=item["name"],
                driver_name=item["driver_name"],
                license_plate=item["license_plate"],
                driver_phone=item["driver_phone"],
                default_cost=0.0,
                is_active=True,
            )
            db.add(existing_v)
            db.flush()
        else:
            existing_v.name = item["name"]
            existing_v.driver_name = item["driver_name"]
            if item["driver_phone"]:
                existing_v.driver_phone = item["driver_phone"]

        existing_c = (
            db.query(MonthlyVehicleContract)
            .filter(MonthlyVehicleContract.vehicle_id == existing_v.id)
            .first()
        )
        if not existing_c:
            c_data = item["contract"]
            if isinstance(c_data, dict):
                contract = MonthlyVehicleContract(
                    vehicle_id=existing_v.id,
                    **c_data
                )
                db.add(contract)
        else:
            c_data = item["contract"]
            if isinstance(c_data, dict):
                existing_c.contract_name = c_data["contract_name"]

    db.commit()


def get_vehicles(db: Session, ownership_group: Optional[OwnershipGroup] = None) -> List[Vehicle]:
    seed_default_vehicles(db)
    query = db.query(Vehicle).filter(Vehicle.is_active == True)
    if ownership_group:
        query = query.filter(Vehicle.ownership_group == ownership_group)
    return query.order_by(Vehicle.ownership_group, Vehicle.id).all()


def get_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def create_vehicle(db: Session, vehicle_in: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.flush()
    db.refresh(vehicle)
    db.commit()
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, vehicle_in: VehicleUpdate) -> Optional[Vehicle]:
    vehicle = get_vehicle(db, vehicle_id)
    if not vehicle:
        return None
    for key, value in vehicle_in.model_dump().items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> bool:
    vehicle = get_vehicle(db, vehicle_id)
    if not vehicle:
        return False
    vehicle.is_active = False
    db.commit()
    return True
