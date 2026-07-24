from __future__ import annotations
from sqlalchemy.orm import Session

from features.hr_foreign.models import Hotel, Room
from features.hr_foreign.schemas import (
    HotelCreate,
    HotelUpdate,
    RoomCreate,
    RoomUpdate,
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
    for key, value in payload.model_dump().items():
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
    for key, value in payload.model_dump().items():
        setattr(hotel, key, value)
    db.commit()
    db.refresh(hotel)
    return hotel


def delete_hotel(db: Session, hotel: Hotel) -> None:
    db.delete(hotel)
    db.commit()
