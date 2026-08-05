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

    # Re-seed or update routes to ensure exact bilingual text matching HD_BinhAn.pdf contract
    db.query(VendorRoute).filter(VendorRoute.provider_id == p_binh_an.id).delete()

    binh_an_routes_data = [
        # CNV đi làm và tan làm / 員工上下班車
        ("CNV đi làm và tan làm (員工上下班車)", "Ký Túc (宿舍)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "Ký Túc (宿舍)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "7 chỗ", 130000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "Ký Túc (宿舍)", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "Ký Túc (宿舍)", "7 chỗ", 130000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Đình Trám (DINH TRAM 工业区)", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Đình Trám (DINH TRAM 工业区)", "7 chỗ", 120000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Vân Trung (VAN TRUNG 工业区)", "4 chỗ", 100000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Vân Trung (VAN TRUNG 工业区)", "7 chỗ", 120000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Quang Châu (QUANG CHAU 工业区)", "4 chỗ", 120000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi (NienYi 公司)", "KCN Quang Châu (QUANG CHAU 工业区)", "7 chỗ", 150000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "TP Bắc Giang (北江市)", "4 chỗ", 180000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "TP Bắc Giang (北江市)", "7 chỗ", 220000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "TP Bắc Ninh (北宁市)", "4 chỗ", 250000.0),
        ("CNV đi làm và tan làm (員工上下班車)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "TP Bắc Ninh (北宁市)", "7 chỗ", 300000.0),

        # Đi tiếp khách / 去客人
        ("Đi tiếp khách (去客人)", "Ký Túc (宿舍)", "TP Bắc Giang (北江市区)", "4 chỗ", 180000.0),
        ("Đi tiếp khách (去客人)", "Ký Túc (宿舍)", "TP Bắc Giang (北江市区)", "7 chỗ", 220000.0),
        ("Đi tiếp khách (去客人)", "Ký Túc (宿舍)", "TP Bắc Ninh (北宁市区)", "4 chỗ", 180000.0),
        ("Đi tiếp khách (去客人)", "Ký Túc (宿舍)", "TP Bắc Ninh (北宁市区)", "7 chỗ", 220000.0),

        # Gửi hàng / Phản cung / 发送样品/返空
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "HẠP LĨNH SLP (SLP)", "4 chỗ", 300000.0),
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "HẠP LĨNH SLP (SLP)", "7 chỗ", 350000.0),
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "TIÊN DU BN (仙游北宁)", "4 chỗ", 380000.0),
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "HÒA PHÚ BN (华富北宁)", "4 chỗ", 380000.0),
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "QUẾ VÕ 1,3 (北宁桂武)", "4 chỗ", 270000.0),
        ("Gửi hàng / Phản cung (发送样品/返空)", "NienYi CN09,CN15 (NienYi 公司 CN09_CN15)", "QUẾ VÕ 1,3 (北宁桂武)", "7 chỗ", 300000.0),

        # Xe đi HNQ (Hữu Nghị Quan) / 繞關車
        ("Xe đi HNQ (繞關車)", "NienYi (NienYi 公司)", "Hữu Nghị Quan (友谊关)", "4 chỗ", 1300000.0),
        ("Xe đi HNQ (繞關車)", "NienYi (NienYi 公司)", "Hữu Nghị Quan (友谊关)", "7 chỗ", 1500000.0),
        ("Xe đi HNQ (繞關車)", "Ký túc (宿舍)", "Hữu Nghị Quan (友谊关)", "4 chỗ", 1300000.0),
        ("Xe đi HNQ (繞關車)", "Ký túc (宿舍)", "Hữu Nghị Quan (友谊关)", "7 chỗ", 1500000.0),
        ("Xe đi HNQ (繞關車)", "TP Bắc Ninh (北宁市区)", "Hữu Nghị Quan (友谊关)", "4 chỗ", 1300000.0),
        ("Xe đi HNQ (繞關車)", "TP Bắc Ninh (北宁市区)", "Hữu Nghị Quan (友谊关)", "7 chỗ", 1600000.0),

        # Đưa đón sân bay / Hà Nội / 接送機/河内
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "Ký túc (宿舍)", "Sân bay Nội Bài (内排机场)", "4 chỗ", 650000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "Ký túc (宿舍)", "Sân bay Nội Bài (内排机场)", "7 chỗ", 700000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "Sân bay Nội Bài (内排机场)", "4 chỗ", 650000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "NienYi CN09_CN15 (NienYi 公司 CN09_CN15)", "Sân bay Nội Bài (内排机场)", "7 chỗ", 700000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "Sân bay Nội Bài (内排机场)", "Trung tâm Hà Nội (河内中心)", "4 chỗ", 500000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "Sân bay Nội Bài (内排机场)", "Trung tâm Hà Nội (河内中心)", "7 chỗ", 550000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "TP Bắc Ninh (北宁市区)", "Sân bay Nội Bài (内排机场)", "4 chỗ", 550000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "TP Bắc Ninh (北宁市区)", "Sân bay Nội Bài (内排机场)", "7 chỗ", 650000.0),
        ("Đưa đón sân bay / Hà Nội (接送機/河内)", "NienYi (NienYi 公司)", "Hồ Hoàn Kiếm Hà Nội (还剑湖河内)", "4 chỗ", 700000.0),

        # Phản cung / 返空
        ("Phản cung (返空)", "NienYi (NienYi 公司)", "KCN Đồng Văn 3 Hà Nam (河南省同文3工业区)", "4 chỗ", 1300000.0),
        ("Phản cung (返空)", "NienYi (NienYi 公司)", "Đồng Văn 3 Hà Nam - NienYi (河南省同文3工业区 - NienYi)", "4 chỗ", 1800000.0),
        ("Phản cung (返空)", "NienYi (NienYi 公司)", "Hải Phòng (海防)", "4 chỗ", 1500000.0),
        ("Phản cung (返空)", "NienYi (NienYi 公司)", "VĨNH PHÚC (永福)", "4 chỗ", 1000000.0),
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
