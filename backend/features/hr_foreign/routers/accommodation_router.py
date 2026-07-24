from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import service
from features.hr_foreign.schemas import (
    HotelCreate,
    HotelRead,
    HotelUpdate,
    RoomCreate,
    RoomOccupancyRead,
    RoomRead,
    RoomUpdate,
)

router = APIRouter()


# --- ROOMS & OCCUPANCY ENDPOINTS ---

@router.get("/rooms/occupancy", response_model=list[RoomOccupancyRead])
@router.get("/room-occupancy", response_model=list[RoomOccupancyRead])
def get_room_occupancy(db: Session = Depends(get_db)) -> list[RoomOccupancyRead]:
    return service.get_room_occupancy(db)


@router.get("/rooms", response_model=list[RoomRead])
def list_rooms(db: Session = Depends(get_db)) -> list[RoomRead]:
    return service.get_rooms(db)


@router.post("/rooms", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)) -> RoomRead:
    existing = service.get_room_by_number(db, payload.room_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists"
        )
    return service.create_room(db, payload)


@router.put("/rooms/{room_id}", response_model=RoomRead)
def update_room(
    room_id: int, payload: RoomUpdate, db: Session = Depends(get_db)
) -> RoomRead:
    room = service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if payload.room_number != room.room_number:
        existing = service.get_room_by_number(db, payload.room_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists"
            )
    return service.update_room(db, room, payload)


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)) -> None:
    room = service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    service.delete_room(db, room)


# --- HOTELS ENDPOINTS ---

@router.get("/hotels", response_model=list[HotelRead])
def list_hotels(db: Session = Depends(get_db)) -> list[HotelRead]:
    return service.get_hotels(db)


@router.get("/hotels/{hotel_id}", response_model=HotelRead)
def get_hotel(hotel_id: int, db: Session = Depends(get_db)) -> HotelRead:
    hotel = service.get_hotel_by_id(db, hotel_id)
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return hotel


@router.post("/hotels", response_model=HotelRead, status_code=status.HTTP_201_CREATED)
def create_hotel(payload: HotelCreate, db: Session = Depends(get_db)) -> HotelRead:
    return service.create_hotel(db, payload)


@router.put("/hotels/{hotel_id}", response_model=HotelRead)
def update_hotel(
    hotel_id: int, payload: HotelUpdate, db: Session = Depends(get_db)
) -> HotelRead:
    hotel = service.get_hotel_by_id(db, hotel_id)
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return service.update_hotel(db, hotel, payload)


@router.delete("/hotels/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)) -> None:
    hotel = service.get_hotel_by_id(db, hotel_id)
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    service.delete_hotel(db, hotel)
