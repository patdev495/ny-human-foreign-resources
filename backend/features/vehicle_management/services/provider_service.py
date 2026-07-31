from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session

from features.vehicle_management.models import OwnershipGroup, VehicleProvider, VendorRoute
from features.vehicle_management.schemas import VehicleProviderCreate, VehicleProviderUpdate


def seed_default_providers_and_routes(db: Session) -> None:
    existing_providers = {p.name: p for p in db.query(VehicleProvider).all()}

    p_binh_an = existing_providers.get("Bình An")
    if not p_binh_an:
        p_binh_an = VehicleProvider(
            name="Bình An",
            provider_type=OwnershipGroup.OUTSOURCED,
            phone="0981281892",
            notes="Công ty CP Thương mại Đầu tư và Phát triển Dịch vụ Du lịch Vận tải Bình An",
            is_active=True,
        )
        db.add(p_binh_an)

    p_huong_giang = existing_providers.get("Hương Giang")
    if p_huong_giang:
        db.delete(p_huong_giang)

    p_company = existing_providers.get("Đội xe Công ty")
    if not p_company:
        p_company = VehicleProvider(
            name="Đội xe Công ty",
            provider_type=OwnershipGroup.COMPANY_OWNED,
            phone=None,
            notes="Nhóm xe công ty (Chú Ngọc, Chú Đại, Xe Đức Anh)",
            is_active=True,
        )
        db.add(p_company)

    db.flush()

    if db.query(VendorRoute).filter(VendorRoute.provider_id == p_binh_an.id).count() > 0:
        db.commit()
        return

    binh_an_routes_data = [
        ("CNV đi làm và tan làm", "Ký Túc", "NienYi CN09_CN15", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm", "Ký Túc", "NienYi CN09_CN15", "7 chỗ", 130000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "Ký Túc", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "Ký Túc", "7 chỗ", 130000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Đình Trám", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Đình Trám", "7 chỗ", 120000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Vân Trung", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Vân Trung", "7 chỗ", 120000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Quang Châu", "4 chỗ", 120000.0),
        ("CNV đi làm và tan làm", "NienYi", "KCN Quang Châu", "7 chỗ", 150000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "TP Bắc Giang", "4 chỗ", 180000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "TP Bắc Giang", "7 chỗ", 220000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "TP Bắc Ninh", "4 chỗ", 250000.0),
        ("CNV đi làm và tan làm", "NienYi CN09_CN15", "TP Bắc Ninh", "7 chỗ", 300000.0),
        ("Đi tiếp khách", "Ký Túc", "TP Bắc Giang", "4 chỗ", 180000.0),
        ("Đi tiếp khách", "Ký Túc", "TP Bắc Giang", "7 chỗ", 220000.0),
        ("Đi tiếp khách", "Ký Túc", "TP Bắc Ninh", "4 chỗ", 180000.0),
        ("Đi tiếp khách", "Ký Túc", "TP Bắc Ninh", "7 chỗ", 220000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "HẠP LĨNHSLP", "4 chỗ", 300000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "HẠP LĨNHSLP", "7 chỗ", 350000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "TIÊN DU BN", "4 chỗ", 380000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "HÒA PHÚ BN", "4 chỗ", 380000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "QUANG CHÂU", "4 chỗ", 200000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "VÂN TRUNG", "4 chỗ", 150000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "ĐÌNH TRÁM", "4 chỗ", 150000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "SONG KHÊ NỘI HOÀNG", "4 chỗ", 200000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "HÀ NỘI", "4 chỗ", 500000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09_CN15", "Sân bay Nội Bài", "4 chỗ", 500000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09_CN15", "Sân bay Nội Bài", "7 chỗ", 700000.0),
        ("Gửi hàng / Phản cung", "NienYi CN09,CN15", "HẢI PHÒNG / CẢNG", "4 chỗ", 130000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Thuận Thành BN", "4 chỗ", 450000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Thuận Thành BN", "7 chỗ", 550000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Quế Võ BN", "4 chỗ", 350000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Quế Võ BN", "7 chỗ", 400000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Yên Phong BN", "4 chỗ", 350000.0),
        ("Chuyên gia đi công tác", "NienYi CN09_CN15", "KCN Yên Phong BN", "7 chỗ", 400000.0),
    ]

    for category, p_loc, d_loc, seat, price in binh_an_routes_data:
        r = VendorRoute(
            provider_id=p_binh_an.id,
            purpose=category,
            pickup_location=p_loc,
            dropoff_location=d_loc,
            seat_type=seat,
            fixed_price=price,
            waiting_fee_per_hour=30000.0,
            is_two_way_same_price=True,
        )
        db.add(r)
    db.commit()


def get_providers(db: Session, provider_type: Optional[OwnershipGroup] = None) -> List[VehicleProvider]:
    seed_default_providers_and_routes(db)
    query = db.query(VehicleProvider).filter(VehicleProvider.is_active == True)
    if provider_type:
        query = query.filter(VehicleProvider.provider_type == provider_type)
    return query.order_by(VehicleProvider.id).all()


def get_provider(db: Session, provider_id: int) -> Optional[VehicleProvider]:
    return db.query(VehicleProvider).filter(VehicleProvider.id == provider_id).first()


def create_provider(db: Session, p_in: VehicleProviderCreate) -> VehicleProvider:
    provider = VehicleProvider(**p_in.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


def update_provider(db: Session, provider_id: int, p_in: VehicleProviderUpdate) -> Optional[VehicleProvider]:
    provider = get_provider(db, provider_id)
    if not provider:
        return None
    for key, val in p_in.model_dump(exclude_unset=True).items():
        setattr(provider, key, val)
    db.commit()
    db.refresh(provider)
    return provider


def delete_provider(db: Session, provider_id: int) -> bool:
    provider = get_provider(db, provider_id)
    if not provider:
        return False
    provider.is_active = False
    db.commit()
    return True
