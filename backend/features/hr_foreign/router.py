from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import models, service
from features.hr_foreign.schemas import (
    EmployeeHistoryResponse,
    EventDayCreate,
    EventDayRead,
    ExpiringDocumentsResponse,
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
    MealAbsenceCreate,
    MealAbsenceRead,
    MealExpenseReportResponse,
    MealPriceConfigCreate,
    MealPriceConfigRead,
    RoomCreate,
    RoomOccupancyRead,
    RoomRead,
    RoomUpdate,
    StayCreate,
    StayRead,
    StayUpdate,
    TamTruCreate,
    TamTruRead,
    VisaCreate,
    VisaRead,
)

router = APIRouter()


# --- FOREIGN EMPLOYEES ENDPOINTS ---

@router.get("/employees", response_model=list[ForeignEmployeeRead])
def list_employees(
    q: str | None = Query(default=None), db: Session = Depends(get_db)
) -> list[ForeignEmployeeRead]:
    employees = service.get_employees(db, q=q)
    return [service.to_employee_read(db, emp) for emp in employees]


@router.get("/employees/{emp_id}", response_model=ForeignEmployeeRead)
def get_employee(emp_id: int, db: Session = Depends(get_db)) -> ForeignEmployeeRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.to_employee_read(db, emp)


@router.get("/employees/{emp_id}/history", response_model=EmployeeHistoryResponse)
def get_employee_history(emp_id: int, db: Session = Depends(get_db)) -> EmployeeHistoryResponse:
    history = service.get_employee_history(db, emp_id)
    if not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return history


@router.post(
    "/employees", response_model=ForeignEmployeeRead, status_code=status.HTTP_201_CREATED
)
def create_employee(
    payload: ForeignEmployeeCreate, db: Session = Depends(get_db)
) -> ForeignEmployeeRead:
    emp = service.create_employee(db, payload)
    return service.to_employee_read(db, emp)


@router.put("/employees/{emp_id}", response_model=ForeignEmployeeRead)
def update_employee(
    emp_id: int, payload: ForeignEmployeeUpdate, db: Session = Depends(get_db)
) -> ForeignEmployeeRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    updated_emp = service.update_employee(db, emp, payload)
    return service.to_employee_read(db, updated_emp)


@router.delete("/employees/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(emp_id: int, db: Session = Depends(get_db)) -> None:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    service.delete_employee(db, emp)


# --- ROOMS & OCCUPANCY ENDPOINTS ---

@router.get("/rooms/occupancy", response_model=list[RoomOccupancyRead])
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


# --- STAYS ENDPOINTS ---

def _to_stay_read(stay: models.Stay) -> StayRead:
    res = StayRead.model_validate(stay)
    if stay.room:
        res.room_number = stay.room.room_number
    return res


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

    active_stay = service.get_active_stay_for_employee(
        db, payload.employee_id, target_date=payload.start_date
    )
    if active_stay:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nhân sự này hiện Đã có đợt lưu trú đang hoạt động.",
        )

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

    return service.update_stay(db, stay, payload)


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


# --- EXPIRING DOCUMENTS ENDPOINT ---

@router.get("/expiring-documents", response_model=ExpiringDocumentsResponse)
def get_expiring_documents(
    days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)
) -> ExpiringDocumentsResponse:
    return service.get_expiring_documents(db, days=days)


# --- MEAL ABSENCES ENDPOINTS ---

@router.get("/stays/{stay_id}/meal-absences", response_model=list[MealAbsenceRead])
def list_meal_absences(stay_id: int, db: Session = Depends(get_db)) -> list[MealAbsenceRead]:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.get_meal_absences_by_stay(db, stay_id)


@router.post(
    "/stays/{stay_id}/meal-absences",
    response_model=MealAbsenceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_meal_absence(
    stay_id: int, payload: MealAbsenceCreate, db: Session = Depends(get_db)
) -> MealAbsenceRead:
    stay = service.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stay not found")
    return service.create_meal_absence(db, stay_id, payload)


@router.delete("/meal-absences/{abs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_absence(abs_id: int, db: Session = Depends(get_db)) -> None:
    absence = service.get_meal_absence_by_id(db, abs_id)
    if not absence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence not found")
    service.delete_meal_absence(db, absence)


# --- EVENT DAYS ENDPOINTS ---

@router.get("/event-days", response_model=list[EventDayRead])
def list_event_days(db: Session = Depends(get_db)) -> list[EventDayRead]:
    return service.get_event_days(db)


@router.post(
    "/event-days", response_model=EventDayRead, status_code=status.HTTP_201_CREATED
)
def create_event_day(
    payload: EventDayCreate, db: Session = Depends(get_db)
) -> EventDayRead:
    existing = service.get_event_day_by_date(db, payload.event_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Event day already registered for this date"
        )
    return service.create_event_day(db, payload)


@router.delete("/event-days/{ev_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_day(ev_id: int, db: Session = Depends(get_db)) -> None:
    ev = service.get_event_day_by_id(db, ev_id)
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event day not found")
    service.delete_event_day(db, ev)


# --- MEAL PRICE CONFIGS ENDPOINTS ---

@router.get("/meal-price-configs", response_model=list[MealPriceConfigRead])
def list_meal_price_configs(db: Session = Depends(get_db)) -> list[MealPriceConfigRead]:
    return service.get_meal_price_configs(db)


@router.post(
    "/meal-price-configs",
    response_model=MealPriceConfigRead,
    status_code=status.HTTP_201_CREATED,
)
def create_meal_price_config(
    payload: MealPriceConfigCreate, db: Session = Depends(get_db)
) -> MealPriceConfigRead:
    return service.create_meal_price_config(db, payload)


# --- MEAL EXPENSE REPORTS ENDPOINT ---

@router.get("/reports/meal-expenses", response_model=MealExpenseReportResponse)
def get_meal_expense_report(
    start_date: datetime.date = Query(...),
    end_date: datetime.date = Query(...),
    db: Session = Depends(get_db),
) -> MealExpenseReportResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="start_date cannot be after end_date"
        )
    return service.calculate_meal_expenses(db, start_date=start_date, end_date=end_date)
