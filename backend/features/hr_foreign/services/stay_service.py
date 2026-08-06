from __future__ import annotations
import datetime
from collections import defaultdict
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import Hotel, Room, Stay, TravelRecord
from features.hr_foreign.schemas import (
    HotelCreate,
    HotelUpdate,
    ResidentInfo,
    RoomCreate,
    RoomOccupancyRead,
    RoomUpdate,
    StayCreate,
    StayUpdate,
)


# --- ROOMS ---

def get_rooms(db: Session) -> list[Room]:
    return db.query(Room).all()


def get_room_by_id(db: Session, room_id: int) -> Room | None:
    return db.query(Room).filter(Room.id == room_id).first()


def get_room_by_number(db: Session, room_number: str) -> Room | None:
    return db.query(Room).filter(Room.room_number == room_number).first()


def create_room(db: Session, payload: RoomCreate) -> Room:
    room = Room(**payload.model_dump())
    db.add(room)
    db.flush()
    db.commit()
    db.refresh(room)
    return room


def update_room(db: Session, room: Room, payload: RoomUpdate) -> Room:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, key, value)
    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room: Room) -> None:
    db.delete(room)
    db.commit()


# --- HOTELS ---

def get_hotels(db: Session) -> list[Hotel]:
    return db.query(Hotel).all()


def get_hotel_by_id(db: Session, hotel_id: int) -> Hotel | None:
    return db.query(Hotel).filter(Hotel.id == hotel_id).first()


def create_hotel(db: Session, payload: HotelCreate) -> Hotel:
    hotel = Hotel(**payload.model_dump())
    db.add(hotel)
    db.flush()
    db.commit()
    db.refresh(hotel)
    return hotel


def update_hotel(db: Session, hotel: Hotel, payload: HotelUpdate) -> Hotel:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(hotel, key, value)
    db.commit()
    db.refresh(hotel)
    return hotel


def delete_hotel(db: Session, hotel: Hotel) -> None:
    db.delete(hotel)
    db.commit()


# --- STAYS ---

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
    for key, value in payload.model_dump(exclude_unset=True).items():
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

    # Single bulk query for all active stays to eliminate N+1 queries
    all_active_stays = (
        db.query(Stay)
        .filter(or_(Stay.end_date.is_(None), Stay.end_date > today))
        .all()
    )

    ktx_stays_by_room: dict[int, list[Stay]] = defaultdict(list)
    hotel_stays_by_hotel: dict[int, list[Stay]] = defaultdict(list)

    for stay in all_active_stays:
        if stay.accommodation_type == "KTX" and stay.room_id:
            ktx_stays_by_room[stay.room_id].append(stay)
        elif stay.accommodation_type == "HOTEL" and stay.hotel_id:
            hotel_stays_by_hotel[stay.hotel_id].append(stay)

    # 1. KTX Rooms
    rooms = db.query(Room).all()
    for room in rooms:
        active_stays = ktx_stays_by_room.get(room.id, [])
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
        active_stays = hotel_stays_by_hotel.get(hotel.id, [])
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

