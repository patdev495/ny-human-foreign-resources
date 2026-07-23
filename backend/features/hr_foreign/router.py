from __future__ import annotations

import os
import datetime
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign import models, service, excel_exporter
from features.hr_foreign.schemas import (
    DocumentAttachmentResponse,
    EmployeeHistoryResponse,
    ExitDateActionRequest,
    ContractCreate,
    ContractRead,
    ContractUpdate,
    DailyPresenceReportResponse,
    EventDayCreate,
    EventDayRead,
    ExpiringDocumentsResponse,
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
    HotelCreate,
    HotelRead,
    HotelUpdate,
    MealAbsenceCreate,
    MealAbsenceRead,
    MealExpenseReportResponse,
    MealPriceConfigCreate,
    MealPriceConfigRead,
    RoomCreate,
    RoomOccupancyRead,
    RoomRead,
    RoomUpdate,
    StayCheckout,
    StayCreate,
    StayRead,
    StayUpdate,
    TamTruCreate,
    TamTruRead,
    TamTruUpdate,
    TravelRecordCreate,
    TravelRecordRead,
    TravelRecordUpdate,
    VisaCreate,
    VisaRead,
    VisaUpdate,
    WorkPermitCreate,
    WorkPermitRead,
    WorkPermitUpdate,
)

router = APIRouter()


# --- FOREIGN EMPLOYEES ENDPOINTS ---

@router.get("/employees", response_model=list[ForeignEmployeeRead])
def list_employees(
    q: str | None = Query(default=None), db: Session = Depends(get_db)
) -> list[ForeignEmployeeRead]:
    return service.get_employees_read(db, q=q)


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


# --- TRAVEL RECORDS ENDPOINTS ---

@router.get("/employees/{emp_id}/travel-records", response_model=list[TravelRecordRead])
def list_travel_records(emp_id: int, db: Session = Depends(get_db)) -> list[TravelRecordRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.list_travel_records(db, emp_id)


@router.post(
    "/employees/{emp_id}/travel-records",
    response_model=TravelRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_travel_record(
    emp_id: int, payload: TravelRecordCreate, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_travel_record(db, emp, payload)


@router.put("/employees/{emp_id}/travel-records/{record_id}", response_model=TravelRecordRead)
def update_travel_record(
    emp_id: int, record_id: int, payload: TravelRecordUpdate, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    record = service.get_travel_record_by_id(db, record_id)
    if not record or record.employee_id != emp_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel record not found")
    return service.update_travel_record(db, record, payload)


@router.post("/employees/{emp_id}/record-exit", response_model=TravelRecordRead)
def record_employee_exit(
    emp_id: int, payload: ExitDateActionRequest, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.record_employee_exit(db, emp, payload)



# --- CONTRACTS ENDPOINTS ---

@router.get("/employees/{emp_id}/contracts", response_model=list[ContractRead])
def list_contracts(emp_id: int, db: Session = Depends(get_db)) -> list[ContractRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_contracts_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/contracts",
    response_model=ContractRead,
    status_code=status.HTTP_201_CREATED,
)
def create_contract(
    emp_id: int, payload: ContractCreate, db: Session = Depends(get_db)
) -> ContractRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_contract(db, emp_id, payload)


@router.put("/contracts/{contract_id}", response_model=ContractRead)
def update_contract(
    contract_id: int, payload: ContractUpdate, db: Session = Depends(get_db)
) -> ContractRead:
    c = service.get_contract_by_id(db, contract_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return service.update_contract(db, c, payload)


@router.delete("/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(contract_id: int, db: Session = Depends(get_db)) -> None:
    c = service.get_contract_by_id(db, contract_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    service.delete_contract(db, c)


# --- WORK PERMITS ENDPOINTS ---

@router.get("/employees/{emp_id}/work-permits", response_model=list[WorkPermitRead])
def list_work_permits(emp_id: int, db: Session = Depends(get_db)) -> list[WorkPermitRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_work_permits_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/work-permits",
    response_model=WorkPermitRead,
    status_code=status.HTTP_201_CREATED,
)
def create_work_permit(
    emp_id: int, payload: WorkPermitCreate, db: Session = Depends(get_db)
) -> WorkPermitRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_work_permit(db, emp_id, payload)


@router.put("/work-permits/{permit_id}", response_model=WorkPermitRead)
def update_work_permit(
    permit_id: int, payload: WorkPermitUpdate, db: Session = Depends(get_db)
) -> WorkPermitRead:
    permit = service.get_work_permit_by_id(db, permit_id)
    if not permit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work permit not found")
    return service.update_work_permit(db, permit, payload)


@router.delete("/work-permits/{permit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_permit(permit_id: int, db: Session = Depends(get_db)) -> None:
    permit = service.get_work_permit_by_id(db, permit_id)
    if not permit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work permit not found")
    service.delete_work_permit(db, permit)


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


# --- STAYS ENDPOINTS ---

def _to_stay_read(stay: models.Stay) -> StayRead:
    res = StayRead.model_validate(stay)
    if stay.room:
        res.room_number = stay.room.room_number
    if stay.hotel:
        res.hotel_name = stay.hotel.name
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


# --- DAILY PRESENCE REPORTS ENDPOINT ---

@router.get("/reports/daily-presence", response_model=DailyPresenceReportResponse)
def get_daily_presence_report(
    target_date: datetime.date = Query(default_factory=datetime.date.today),
    db: Session = Depends(get_db),
) -> DailyPresenceReportResponse:
    return service.get_daily_presence_report(db, target_date=target_date)


# --- DOCUMENT ATTACHMENTS ENDPOINTS ---

@router.post("/attachments", response_model=DocumentAttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    db: Session = Depends(get_db),
) -> DocumentAttachmentResponse:
    return service.save_attachment(db, file=file, entity_type=entity_type, entity_id=entity_id)


@router.get("/attachments", response_model=list[DocumentAttachmentResponse])
def list_attachments(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
) -> list[DocumentAttachmentResponse]:
    return service.list_attachments(db, entity_type=entity_type, entity_id=entity_id)


@router.get("/attachments/{attachment_id}/preview")
def preview_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    attachment = service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")
    return FileResponse(
        path=attachment.file_path,
        media_type=attachment.mime_type,
        headers={"Content-Disposition": f'inline; filename="{attachment.file_name}"'},
    )


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    attachment = service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")
    return FileResponse(
        path=attachment.file_path,
        media_type=attachment.mime_type,
        filename=attachment.file_name,
    )


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> None:
    success = service.delete_attachment(db, attachment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")


# --- EXPORT REPORTS ENDPOINTS ---

@router.get("/exports/legal-profile")
def export_legal_profile(
    include_attachments: bool = Query(False),
    db: Session = Depends(get_db),
) -> Response:
    excel_buf = excel_exporter.generate_legal_profile_excel(db)

    if include_attachments:
        # Collect attachment files from DB
        attachments_list = []
        all_attachments = db.query(models.DocumentAttachment).all()
        for att in all_attachments:
            if att.file_path and os.path.exists(att.file_path):
                # Resolve owner employee
                emp_code = None
                emp_name = None
                if att.entity_type == "PASSPORT":
                    emp = db.query(models.ForeignEmployee).filter(models.ForeignEmployee.id == att.entity_id).first()
                    if emp:
                        emp_code = emp.employee_code
                        emp_name = emp.name_latin
                elif att.entity_type in ("VISA", "TAM_TRU"):
                    if att.entity_type == "VISA":
                        v = db.query(models.Visa).filter(models.Visa.id == att.entity_id).first()
                        stay = v.stay if v else None
                    else:
                        tt = db.query(models.TamTru).filter(models.TamTru.id == att.entity_id).first()
                        stay = tt.stay if tt else None
                    emp = stay.employee if stay else None
                    if emp:
                        emp_code = emp.employee_code
                        emp_name = emp.name_latin
                elif att.entity_type == "WORK_PERMIT":
                    wp = db.query(models.WorkPermit).filter(models.WorkPermit.id == att.entity_id).first()
                    emp = wp.employee if wp else None
                    if emp:
                        emp_code = emp.employee_code
                        emp_name = emp.name_latin
                elif att.entity_type == "CONTRACT":
                    ct = db.query(models.Contract).filter(models.Contract.id == att.entity_id).first()
                    emp = ct.employee if ct else None
                    if emp:
                        emp_code = emp.employee_code
                        emp_name = emp.name_latin

                with open(att.file_path, "rb") as f:
                    content = f.read()

                attachments_list.append({
                    "employee_code": emp_code or "NV_KHONG_MA",
                    "employee_name": emp_name or "NHAN_VIEN",
                    "file_name": att.file_name,
                    "content": content,
                })

        zip_buf = excel_exporter.create_report_zip_package(
            excel_bytes=excel_buf,
            excel_filename="Bao_Cao_Ho_So_Phap_Ly.xlsx",
            attachments=attachments_list,
        )
        return Response(
            content=zip_buf.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Ho_So_Phap_Ly.zip"'},
        )

    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Ho_So_Phap_Ly.xlsx"'},
    )


@router.get("/exports/presence-accommodation")
def export_presence_accommodation(
    db: Session = Depends(get_db),
) -> Response:
    excel_buf = excel_exporter.generate_presence_accommodation_excel(db)
    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Hien_Dien_Cho_O.xlsx"'},
    )



