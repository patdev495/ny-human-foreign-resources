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
    TamTruCreate,
    TamTruRead,
    TamTruUpdate,
    VisaCreate,
    VisaRead,
    VisaUpdate,
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



# --- VISAS ENDPOINTS ---

@router.get("/stays/{stay_id}/visas", response_model=list[VisaRead])
def list_visas(stay_id: int, db: Session = Depends(get_db)) -> list[VisaRead]:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.get_visas_by_stay(db, stay_id)


@router.post(
    "/stays/{stay_id}/visas", response_model=VisaRead, status_code=status.HTTP_201_CREATED
)
def create_visa(
    stay_id: int, payload: VisaCreate, db: Session = Depends(get_db)
) -> VisaRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.create_visa(db, stay_id, payload)


@router.delete("/visas/{visa_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visa(visa_id: int, db: Session = Depends(get_db)) -> None:
    visa = service.get_visa_by_id(db, visa_id)
    if not visa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visa not found")
    service.delete_visa(db, visa)


@router.put("/visas/{visa_id}", response_model=VisaRead)
def update_visa(
    visa_id: int, payload: VisaUpdate, db: Session = Depends(get_db)
) -> VisaRead:
    visa = service.get_visa_by_id(db, visa_id)
    if not visa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visa not found")
    return service.update_visa(db, visa, payload)


# --- TAM TRU ENDPOINTS ---

@router.get("/stays/{stay_id}/tam-trus", response_model=list[TamTruRead])
def list_tam_trus(stay_id: int, db: Session = Depends(get_db)) -> list[TamTruRead]:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.get_tam_trus_by_stay(db, stay_id)


@router.post(
    "/stays/{stay_id}/tam-trus", response_model=TamTruRead, status_code=status.HTTP_201_CREATED
)
def create_tam_tru(
    stay_id: int, payload: TamTruCreate, db: Session = Depends(get_db)
) -> TamTruRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.create_tam_tru(db, stay_id, payload)


@router.delete("/tam-trus/{tam_tru_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tam_tru(tam_tru_id: int, db: Session = Depends(get_db)) -> None:
    tam_tru = service.get_tam_tru_by_id(db, tam_tru_id)
    if not tam_tru:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tam tru not found")
    service.delete_tam_tru(db, tam_tru)


@router.put("/tam-trus/{tam_tru_id}", response_model=TamTruRead)
def update_tam_tru(
    tam_tru_id: int, payload: TamTruUpdate, db: Session = Depends(get_db)
) -> TamTruRead:
    tam_tru = service.get_tam_tru_by_id(db, tam_tru_id)
    if not tam_tru:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tam tru not found")
    return service.update_tam_tru(db, tam_tru, payload)
