from __future__ import annotations
import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import Hotel, Room, Stay, TravelRecord
from features.hr_foreign.schemas import (
    ResidentInfo,
    RoomOccupancyRead,
    StayCreate,
    StayUpdate,
)


def get_active_stay_for_employee(
    db: Session, employee_id: int, target_date: datetime.date, exclude_stay_id: int | None = None
) -> Stay | None:
    query = db.query(Stay).filter(
        Stay.employee_id == employee_id,
        or_(Stay.end_date.is_(None), Stay.end_date > target_date),
    )
    if exclude_stay_id:
        query = query.filter(Stay.id != exclude_stay_id)
    return query.first()


def get_stay_by_id(db: Session, stay_id: int) -> Stay | None:
    return db.query(Stay).filter(Stay.id == stay_id).first()


def get_stays(
    db: Session, employee_id: int | None = None, status: str | None = None
) -> list[Stay]:
    query = db.query(Stay)
    if employee_id:
        query = query.filter(Stay.employee_id == employee_id)
    if status == "active":
        today = datetime.date.today()
        query = query.filter(or_(Stay.end_date.is_(None), Stay.end_date > today))
    return query.all()


def create_stay(db: Session, payload: StayCreate) -> Stay:
    stay = Stay(**payload.model_dump())
    db.add(stay)
    db.flush()
    db.commit()
    db.refresh(stay)
    return stay


def _sync_stay_checkout_with_travel_record(db: Session, stay: Stay, end_date: datetime.date) -> None:
    emp = stay.employee
    if not emp:
        return
    emp.actual_exit_date = end_date
    latest_tr = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == emp.id, TravelRecord.actual_exit_date.is_(None))
        .order_by(TravelRecord.entry_date.desc(), TravelRecord.id.desc())
        .first()
    )
    if latest_tr:
        latest_tr.actual_exit_date = end_date
    elif emp.entry_date:
        latest_tr = TravelRecord(
            employee_id=emp.id,
            entry_date=emp.entry_date,
            expected_exit_date=emp.expected_exit_date,
            actual_exit_date=end_date,
        )
        db.add(latest_tr)


def update_stay(db: Session, stay: Stay, payload: StayUpdate) -> Stay:
    previous_end_date = stay.end_date
    for key, value in payload.model_dump().items():
        setattr(stay, key, value)
    if stay.end_date and stay.end_date != previous_end_date:
        _sync_stay_checkout_with_travel_record(db, stay, stay.end_date)
    db.commit()
    db.refresh(stay)
    return stay


def checkout_stay(db: Session, stay: Stay, end_date: datetime.date) -> Stay:
    stay.end_date = end_date
    _sync_stay_checkout_with_travel_record(db, stay, end_date)
    db.commit()
    db.refresh(stay)
    return stay


def get_room_occupancy(db: Session) -> list[RoomOccupancyRead]:
    today = datetime.date.today()
    result: list[RoomOccupancyRead] = []

    # 1. KTX Rooms
    rooms = db.query(Room).all()
    for room in rooms:
        active_stays = (
            db.query(Stay)
            .filter(
                Stay.room_id == room.id,
                Stay.accommodation_type == "KTX",
                or_(Stay.end_date.is_(None), Stay.end_date > today),
            )
            .all()
        )
        residents: list[ResidentInfo] = []
        for stay in active_stays:
            emp = stay.employee
            if emp:
                residents.append(
                    ResidentInfo(
                        employee_id=emp.id,
                        name_latin=emp.name_latin,
                        name_chinese=emp.name_chinese,
                        passport_number=emp.passport_number,
                        stay_id=stay.id,
                        stay_type=stay.stay_type,
                        has_meals=stay.has_meals,
                        invoice_amount=stay.invoice_amount,
                        bed_location=stay.bed_location,
                        start_date=stay.start_date,
                        end_date=stay.end_date,
                    )
                )

        result.append(
            RoomOccupancyRead(
                accommodation_type="KTX",
                unit_id=room.id,
                unit_name=room.room_number,
                room_id=room.id,
                room_number=room.room_number,
                notes=room.notes,
                active_residents=residents,
            )
        )

    # 2. Hotels
    hotels = db.query(Hotel).all()
    for hotel in hotels:
        active_stays = (
            db.query(Stay)
            .filter(
                Stay.hotel_id == hotel.id,
                Stay.accommodation_type == "HOTEL",
                or_(Stay.end_date.is_(None), Stay.end_date > today),
            )
            .all()
        )
        hotel_residents: list[ResidentInfo] = []
        for stay in active_stays:
            emp = stay.employee
            if emp:
                bed_loc = (
                    f"{stay.hotel_room_number} ({stay.bed_location})"
                    if stay.hotel_room_number and stay.bed_location
                    else (stay.hotel_room_number or stay.bed_location)
                )
                hotel_residents.append(
                    ResidentInfo(
                        employee_id=emp.id,
                        name_latin=emp.name_latin,
                        name_chinese=emp.name_chinese,
                        passport_number=emp.passport_number,
                        stay_id=stay.id,
                        stay_type=stay.stay_type,
                        has_meals=stay.has_meals,
                        invoice_amount=stay.invoice_amount,
                        bed_location=bed_loc,
                        start_date=stay.start_date,
                        end_date=stay.end_date,
                    )
                )

        result.append(
            RoomOccupancyRead(
                accommodation_type="HOTEL",
                unit_id=hotel.id,
                unit_name=hotel.name,
                address=hotel.address,
                notes=hotel.notes,
                active_residents=hotel_residents,
            )
        )

    return result
