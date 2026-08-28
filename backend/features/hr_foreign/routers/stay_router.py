from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import models, service
from features.hr_foreign.schemas import (
    StayCheckout,
    StayCreate,
    StayRead,
    StayUpdate,
)

router = APIRouter()


def _to_stay_read(stay: models.Stay) -> StayRead:
    res = StayRead.model_validate(stay)
    if stay.room:
        res.room_number = stay.room.room_number
    if stay.hotel:
        res.hotel_name = stay.hotel.name
    return res


# --- STAYS ENDPOINTS ---

@router.get("/stays", response_model=list[StayRead])
def list_stays(
    employee_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> list[StayRead]:
    stays = service.get_stays(db, employee_id=employee_id, status=status_filter)
    return [_to_stay_read(s) for s in stays]


@router.get("/stays/{stay_id}", response_model=StayRead)
def get_stay(stay_id: int, db: Session = Depends(get_db)) -> StayRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return _to_stay_read(stay)


@router.post("/stays", response_model=StayRead, status_code=status.HTTP_201_CREATED)
def create_stay(payload: StayCreate, db: Session = Depends(get_db)) -> StayRead:
    emp = service.get_employee_by_id(db, payload.employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if payload.accommodation_type == "KTX" and payload.room_id:
        room = service.get_room_by_id(db, payload.room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    elif payload.accommodation_type == "HOTEL" and payload.hotel_id:
        hotel = service.get_hotel_by_id(db, payload.hotel_id)
        if not hotel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    active_stay = service.get_active_stay_for_employee(
        db, payload.employee_id, target_date=payload.start_date
    )
    if active_stay and (active_stay.room_id is not None or active_stay.hotel_id is not None):
        loc = f"Phòng {active_stay.room.room_number}" if active_stay.room else (f"Khách sạn {active_stay.hotel.name}" if active_stay.hotel else "chỗ ở cũ")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nhân sự này hiện đang có chỗ ở tại {loc}. Vui lòng làm thủ tục Trả phòng cũ trước khi xếp chỗ ở mới.",
        )
    elif active_stay and active_stay.room_id is None and active_stay.hotel_id is None:
        stay = service.update_stay(db, active_stay, payload)
        return _to_stay_read(stay)

    stay = service.create_stay(db, payload)
    return _to_stay_read(stay)


@router.put("/stays/{stay_id}", response_model=StayRead)
def update_stay(
    stay_id: int, payload: StayUpdate, db: Session = Depends(get_db)
) -> StayRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")

    if payload.accommodation_type == "KTX" and payload.room_id:
        room = service.get_room_by_id(db, payload.room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    elif payload.accommodation_type == "HOTEL" and payload.hotel_id:
        hotel = service.get_hotel_by_id(db, payload.hotel_id)
        if not hotel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    return service.update_stay(db, stay, payload)


@router.post("/stays/{stay_id}/checkout", response_model=StayRead)
def checkout_stay(
    stay_id: int, payload: StayCheckout, db: Session = Depends(get_db)
) -> StayRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    if stay.start_date and payload.end_date < stay.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngày trả phòng không thể nhỏ hơn ngày bắt đầu ở",
        )
    checkout_stay_obj = service.checkout_stay(db, stay, payload.end_date)
    return _to_stay_read(checkout_stay_obj)


@router.delete("/stays/{stay_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stay(stay_id: int, db: Session = Depends(get_db)) -> None:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    service.delete_stay(db, stay)

