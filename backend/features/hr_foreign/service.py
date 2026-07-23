from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from features.hr_foreign.schemas import TravelRecordCreate, TravelRecordUpdate

from features.hr_foreign.status_engine import (
    evaluate_employee_statuses,
    get_expiring_documents as status_engine_get_expiring_documents,
    get_warning_configs as status_engine_get_warning_configs,
    update_warning_configs as status_engine_update_warning_configs,
)


import datetime
import os
import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy import case, or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    Contract,
    DocumentAttachment,
    EventDay,
    ForeignEmployee,
    Hotel,
    MealAbsence,
    MealPriceConfig,
    Room,
    Stay,
    TamTru,
    TravelRecord,
    Visa,
    WorkPermit,
)

UPLOAD_DIR = os.path.join("uploads", "documents")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}

from features.hr_foreign.schemas import (
    ContractCreate,
    ContractRead,
    ContractUpdate,
    DailyPresenceGroup,
    DailyPresenceItem,
    DailyPresenceReportResponse,
    DailyPresenceSummary,
    EventDayCreate,
    ExpiringDocumentItem,
    ExpiringDocumentsResponse,
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
    EmployeeHistoryResponse,
    HotelCreate,
    HotelRead,
    HotelUpdate,
    MealAbsenceCreate,
    MealExpenseReportItem,
    MealExpenseReportResponse,
    MealPriceConfigCreate,
    ResidentInfo,
    RoomCreate,
    RoomOccupancyRead,
    RoomUpdate,
    StayCreate,
    StayRead,
    StayUpdate,
    TamTruCreate,
    TamTruRead,
    TamTruUpdate,
    ExitDateActionRequest,
    TravelRecordRead,
    VisaCreate,
    VisaRead,
    VisaUpdate,
    WorkPermitCreate,
    WorkPermitRead,
    WorkPermitUpdate,
)


def seed_default_meal_prices(db: Session) -> None:
    normal_exists = (
        db.query(MealPriceConfig).filter(MealPriceConfig.day_type == "NORMAL").first()
    )
    if not normal_exists:
        db.add(
            MealPriceConfig(
                day_type="NORMAL",
                price_per_meal=35000,
                effective_from=datetime.date(2020, 1, 1),
            )
        )

    president_exists = (
        db.query(MealPriceConfig)
        .filter(MealPriceConfig.day_type == "PRESIDENT_VISIT")
        .first()
    )
    if not president_exists:
        db.add(
            MealPriceConfig(
                day_type="PRESIDENT_VISIT",
                price_per_meal=50000,
                effective_from=datetime.date(2020, 1, 1),
            )
        )
    db.commit()


# --- FOREIGN EMPLOYEES ---

def get_employees(db: Session, q: str | None = None) -> list[ForeignEmployee]:
    query = db.query(ForeignEmployee)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                ForeignEmployee.name_latin.ilike(search_pattern),
                ForeignEmployee.name_chinese.ilike(search_pattern),
                ForeignEmployee.passport_number.ilike(search_pattern),
                ForeignEmployee.department.ilike(search_pattern),
            )
        )
    return query.all()


def get_employees_read(db: Session, q: str | None = None) -> list[ForeignEmployeeRead]:
    employees = get_employees(db, q=q)
    return evaluate_employee_statuses(db, employees)


def to_employee_read(db: Session, emp: ForeignEmployee) -> ForeignEmployeeRead:
    results = evaluate_employee_statuses(db, [emp])
    return results[0]



def _validate_travel_dates(
    payload_entry: datetime.date | None,
    payload_expected_exit: datetime.date | None,
    payload_actual_exit: datetime.date | None,
    existing_entry: datetime.date | None = None,
    existing_actual_exit: datetime.date | None = None,
) -> None:
    """Validate business rules around travel date cycle:

    1. actual_exit_date and expected_exit_date must be >= entry_date.
    2. If HR tries to set a NEW entry_date while the existing trip is still open
       (existing entry_date set, existing actual_exit_date not set, and the new
       entry_date differs from the existing one), that is rejected until the
       previous trip is closed first.
    """
    entry = payload_entry
    expected_exit = payload_expected_exit
    actual_exit = payload_actual_exit

    # Rule 1: chronological validity within a trip
    if entry:
        if actual_exit and actual_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày về thực tế ({actual_exit}) không thể nhỏ hơn ngày đến "
                    f"Việt Nam ({entry})."
                ),
            )
        if expected_exit and expected_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày dự kiến về ({expected_exit}) không thể nhỏ hơn ngày đến "
                    f"Việt Nam ({entry})."
                ),
            )

    # Rule 2: trip cycle integrity — must close previous trip before opening new one
    if (
        existing_entry is not None               # there is a previous trip
        and existing_actual_exit is None         # previous trip is still open
        and entry is not None                    # new payload has an entry date
        and entry != existing_entry              # it's a different (new) entry date
        and actual_exit is None                  # and the new payload doesn't close it
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Nhân sự chưa có Ngày về thực tế cho đợt sang "
                f"{existing_entry}. Vui lòng cập nhật Ngày về thực tế cho đợt cũ "
                f"trước khi nhập đợt đến mới, hoặc chỉnh sửa Ngày đến của đợt hiện tại."
            ),
        )


def get_employee_by_id(db: Session, emp_id: int) -> ForeignEmployee | None:
    return db.query(ForeignEmployee).filter(ForeignEmployee.id == emp_id).first()


def create_employee(db: Session, payload: ForeignEmployeeCreate) -> ForeignEmployee:
    _validate_travel_dates(
        payload_entry=payload.entry_date,
        payload_expected_exit=payload.expected_exit_date,
        payload_actual_exit=payload.actual_exit_date,
    )
    emp = ForeignEmployee(**payload.model_dump())
    db.add(emp)
    db.flush()
    db.commit()
    db.refresh(emp)
    return emp


def update_employee(
    db: Session, emp: ForeignEmployee, payload: ForeignEmployeeUpdate
) -> ForeignEmployee:
    _validate_travel_dates(
        payload_entry=payload.entry_date,
        payload_expected_exit=payload.expected_exit_date,
        payload_actual_exit=payload.actual_exit_date,
        existing_entry=emp.entry_date,
        existing_actual_exit=emp.actual_exit_date,
    )
    for key, value in payload.model_dump().items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp


def delete_employee(db: Session, emp: ForeignEmployee) -> None:
    db.delete(emp)
    db.commit()


# ---------------------------------------------------------------------------
# TravelRecord CRUD
# ---------------------------------------------------------------------------

def _validate_travel_record_dates(
    entry: datetime.date | None,
    expected_exit: datetime.date | None,
    actual_exit: datetime.date | None,
) -> None:
    """Rule: exit dates must not be before entry_date."""
    if entry:
        if actual_exit and actual_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày về thực tế ({actual_exit}) không thể nhỏ hơn ngày đến ({entry})."
                ),
            )
        if expected_exit and expected_exit < entry:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày dự kiến về ({expected_exit}) không thể nhỏ hơn ngày đến ({entry})."
                ),
            )


def list_travel_records(db: Session, emp_id: int) -> list[TravelRecord]:
    records = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == emp_id)
        .all()
    )
    # Sort newest first (in-memory, SQL Server 2008 R2 compat)
    return sorted(records, key=lambda r: r.entry_date or datetime.date.min, reverse=True)


def create_travel_record(
    db: Session,
    emp: ForeignEmployee,
    payload: TravelRecordCreate,
) -> TravelRecord:

    _validate_travel_record_dates(
        entry=payload.entry_date,
        expected_exit=payload.expected_exit_date,
        actual_exit=payload.actual_exit_date,
    )

    # Block new trip if there is already an open trip (no actual_exit_date)
    open_trip = (
        db.query(TravelRecord)
        .filter(
            TravelRecord.employee_id == emp.id,
            TravelRecord.actual_exit_date.is_(None),
        )
        .first()
    )
    if open_trip:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Đợt sang ngày {open_trip.entry_date} chưa có Ngày về thực tế. "
                f"Vui lòng chốt Ngày về thực tế cho đợt cũ trước khi thêm đợt đến mới."
            ),
        )

    record = TravelRecord(employee_id=emp.id, **payload.model_dump())
    db.add(record)
    # Sync to master employee fields
    emp.entry_date = record.entry_date
    emp.expected_entry_date = record.expected_entry_date
    emp.expected_exit_date = record.expected_exit_date
    emp.actual_exit_date = record.actual_exit_date
    db.commit()
    db.refresh(record)
    return record


def update_travel_record(
    db: Session,
    record: TravelRecord,
    payload: "TravelRecordUpdate",  # noqa: F821
) -> TravelRecord:
    _validate_travel_record_dates(
        entry=payload.entry_date,
        expected_exit=payload.expected_exit_date,
        actual_exit=payload.actual_exit_date,
    )
    for key, value in payload.model_dump().items():
        setattr(record, key, value)
    
    # Sync latest record to employee master
    emp = db.query(ForeignEmployee).filter(ForeignEmployee.id == record.employee_id).first()
    if emp:
        latest = (
            db.query(TravelRecord)
            .filter(TravelRecord.employee_id == emp.id)
            .order_by(
                case((TravelRecord.entry_date.is_(None), 1), else_=0),
                TravelRecord.entry_date.desc(),
                TravelRecord.id.desc(),
            )
            .first()
        )
        if latest and latest.id == record.id:
            emp.entry_date = record.entry_date
            emp.expected_entry_date = record.expected_entry_date
            emp.expected_exit_date = record.expected_exit_date
            emp.actual_exit_date = record.actual_exit_date

    db.commit()
    db.refresh(record)
    return record


def get_travel_record_by_id(db: Session, record_id: int) -> TravelRecord | None:
    return db.query(TravelRecord).filter(TravelRecord.id == record_id).first()


def record_employee_exit(
    db: Session,
    emp: ForeignEmployee,
    payload: ExitDateActionRequest,
) -> TravelRecord:

    latest_tr = (
        db.query(TravelRecord)
        .filter(TravelRecord.employee_id == emp.id)
        .order_by(
            case((TravelRecord.entry_date.is_(None), 1), else_=0),
            TravelRecord.entry_date.desc(),
            TravelRecord.id.desc(),
        )
        .first()
    )
    if not latest_tr:
        latest_tr = TravelRecord(
            employee_id=emp.id,
            entry_date=emp.entry_date,
            expected_exit_date=emp.expected_exit_date,
        )
        db.add(latest_tr)

    if payload.actual_exit_date:
        if latest_tr.entry_date and payload.actual_exit_date < latest_tr.entry_date:
            raise HTTPException(
                status_code=400,
                detail=f"Ngày thực tế đã về ({payload.actual_exit_date}) không thể nhỏ hơn ngày đến ({latest_tr.entry_date})",
            )
        latest_tr.actual_exit_date = payload.actual_exit_date
        emp.actual_exit_date = payload.actual_exit_date

        if payload.action_type == "CHECK_OUT":
            active_stays = (
                db.query(Stay)
                .filter(Stay.employee_id == emp.id, Stay.end_date.is_(None))
                .all()
            )
            for s in active_stays:
                s.end_date = payload.actual_exit_date

    if payload.expected_exit_date is not None:
        latest_tr.expected_exit_date = payload.expected_exit_date
        emp.expected_exit_date = payload.expected_exit_date

    if payload.expected_entry_date is not None:
        latest_tr.expected_entry_date = payload.expected_entry_date
        emp.expected_entry_date = payload.expected_entry_date

    if payload.notes:
        latest_tr.notes = payload.notes

    db.commit()
    db.refresh(latest_tr)
    return latest_tr


def get_employee_history(db: Session, emp_id: int) -> EmployeeHistoryResponse | None:
    emp = get_employee_by_id(db, emp_id)
    if not emp:
        return None

    work_permits = get_work_permits_by_employee(db, emp_id)
    contracts = get_contracts_by_employee(db, emp_id)
    stays = get_stays(db, employee_id=emp_id)
    travel_records = list_travel_records(db, emp_id)
    stay_ids = [s.id for s in stays]

    visas = db.query(Visa).filter(Visa.stay_id.in_(stay_ids)).all() if stay_ids else []
    tam_trus = db.query(TamTru).filter(TamTru.stay_id.in_(stay_ids)).all() if stay_ids else []

    stay_reads = []
    for s in stays:
        sr = StayRead.model_validate(s)
        if s.room:
            sr.room_number = s.room.room_number
        stay_reads.append(sr)

    return EmployeeHistoryResponse(
        employee=to_employee_read(db, emp),
        work_permits=[WorkPermitRead.model_validate(wp) for wp in work_permits],
        contracts=[ContractRead.model_validate(c) for c in contracts],
        stays=stay_reads,
        visas=[VisaRead.model_validate(v) for v in visas],
        tam_trus=[TamTruRead.model_validate(tt) for tt in tam_trus],
        travel_records=[TravelRecordRead.model_validate(tr) for tr in travel_records],
    )



# --- CONTRACTS ---

def get_contracts_by_employee(db: Session, employee_id: int) -> list[Contract]:
    return (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date)
        .all()
    )


def get_contract_by_id(db: Session, contract_id: int) -> Contract | None:
    return db.query(Contract).filter(Contract.id == contract_id).first()


def create_contract(db: Session, employee_id: int, payload: ContractCreate) -> Contract:
    c = Contract(employee_id=employee_id, **payload.model_dump())
    db.add(c)
    db.flush()
    db.commit()
    db.refresh(c)
    return c


def update_contract(db: Session, contract: Contract, payload: ContractUpdate) -> Contract:
    for key, value in payload.model_dump().items():
        setattr(contract, key, value)
    db.commit()
    db.refresh(contract)
    return contract


def delete_contract(db: Session, contract: Contract) -> None:
    db.delete(contract)
    db.commit()


# --- WORK PERMITS ---

def get_work_permits_by_employee(db: Session, employee_id: int) -> list[WorkPermit]:
    return (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id == employee_id)
        .order_by(WorkPermit.valid_from)
        .all()
    )


def get_work_permit_by_id(db: Session, permit_id: int) -> WorkPermit | None:
    return db.query(WorkPermit).filter(WorkPermit.id == permit_id).first()


def create_work_permit(db: Session, employee_id: int, payload: WorkPermitCreate) -> WorkPermit:
    permit = WorkPermit(employee_id=employee_id, **payload.model_dump())
    db.add(permit)
    db.flush()
    db.commit()
    db.refresh(permit)
    return permit


def update_work_permit(db: Session, permit: WorkPermit, payload: WorkPermitUpdate) -> WorkPermit:
    for key, value in payload.model_dump().items():
        setattr(permit, key, value)
    db.commit()
    db.refresh(permit)
    return permit


def delete_work_permit(db: Session, permit: WorkPermit) -> None:
    db.delete(permit)
    db.commit()


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


# --- STAYS ---

def get_active_stay_for_employee(
    db: Session, employee_id: int, target_date: datetime.date, exclude_stay_id: int | None = None
) -> Stay | None:
    query = db.query(Stay).filter(
        Stay.employee_id == employee_id,
        or_(Stay.end_date.is_(None), Stay.end_date >= target_date),
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
        query = query.filter(or_(Stay.end_date.is_(None), Stay.end_date >= today))
    return query.all()


def create_stay(db: Session, payload: StayCreate) -> Stay:
    stay = Stay(**payload.model_dump())
    db.add(stay)
    db.flush()
    db.commit()
    db.refresh(stay)
    return stay


def update_stay(db: Session, stay: Stay, payload: StayUpdate) -> Stay:
    for key, value in payload.model_dump().items():
        setattr(stay, key, value)
    db.commit()
    db.refresh(stay)
    return stay


def checkout_stay(db: Session, stay: Stay, end_date: datetime.date) -> Stay:
    stay.end_date = end_date
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
                or_(Stay.end_date.is_(None), Stay.end_date >= today),
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
                or_(Stay.end_date.is_(None), Stay.end_date >= today),
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


# --- VISAS ---

def get_visas_by_stay(db: Session, stay_id: int) -> list[Visa]:
    return db.query(Visa).filter(Visa.stay_id == stay_id).all()


def get_visa_by_id(db: Session, visa_id: int) -> Visa | None:
    return db.query(Visa).filter(Visa.id == visa_id).first()


def create_visa(db: Session, stay_id: int, payload: VisaCreate) -> Visa:
    visa = Visa(stay_id=stay_id, **payload.model_dump())
    db.add(visa)
    db.flush()
    db.commit()
    db.refresh(visa)
    return visa


def delete_visa(db: Session, visa: Visa) -> None:
    db.delete(visa)
    db.commit()


def update_visa(db: Session, visa: Visa, payload: VisaUpdate) -> Visa:
    for key, value in payload.model_dump().items():
        setattr(visa, key, value)
    db.commit()
    db.refresh(visa)
    return visa


# --- TAM TRU ---

def get_tam_trus_by_stay(db: Session, stay_id: int) -> list[TamTru]:
    return db.query(TamTru).filter(TamTru.stay_id == stay_id).all()


def get_tam_tru_by_id(db: Session, tam_tru_id: int) -> TamTru | None:
    return db.query(TamTru).filter(TamTru.id == tam_tru_id).first()


def create_tam_tru(db: Session, stay_id: int, payload: TamTruCreate) -> TamTru:
    tam_tru = TamTru(stay_id=stay_id, **payload.model_dump())
    db.add(tam_tru)
    db.flush()
    db.commit()
    db.refresh(tam_tru)
    return tam_tru


def delete_tam_tru(db: Session, tam_tru: TamTru) -> None:
    db.delete(tam_tru)
    db.commit()


def update_tam_tru(db: Session, tam_tru: TamTru, payload: TamTruUpdate) -> TamTru:
    for key, value in payload.model_dump().items():
        setattr(tam_tru, key, value)
    db.commit()
    db.refresh(tam_tru)
    return tam_tru


# --- EXPIRING DOCUMENTS & WARNING CONFIGS ---

def get_warning_configs(db: Session):
    return status_engine_get_warning_configs(db)


def update_warning_configs(db: Session, updates):
    return status_engine_update_warning_configs(db, updates)


def get_expiring_documents(
    db: Session, days: int | None = None, today: datetime.date | None = None
) -> ExpiringDocumentsResponse:
    return status_engine_get_expiring_documents(db, days=days, today=today)




# --- MEAL ABSENCES ---

def get_meal_absences_by_stay(db: Session, stay_id: int) -> list[MealAbsence]:
    return db.query(MealAbsence).filter(MealAbsence.stay_id == stay_id).all()


def get_meal_absence_by_id(db: Session, abs_id: int) -> MealAbsence | None:
    return db.query(MealAbsence).filter(MealAbsence.id == abs_id).first()


def create_meal_absence(db: Session, stay_id: int, payload: MealAbsenceCreate) -> MealAbsence:
    absence = MealAbsence(stay_id=stay_id, **payload.model_dump())
    db.add(absence)
    db.flush()
    db.commit()
    db.refresh(absence)
    return absence


def delete_meal_absence(db: Session, absence: MealAbsence) -> None:
    db.delete(absence)
    db.commit()


# --- EVENT DAYS ---

def get_event_days(db: Session) -> list[EventDay]:
    return db.query(EventDay).order_by(EventDay.event_date.asc()).all()


def get_event_day_by_id(db: Session, ev_id: int) -> EventDay | None:
    return db.query(EventDay).filter(EventDay.id == ev_id).first()


def get_event_day_by_date(db: Session, event_date: datetime.date) -> EventDay | None:
    return db.query(EventDay).filter(EventDay.event_date == event_date).first()


def create_event_day(db: Session, payload: EventDayCreate) -> EventDay:
    event = EventDay(**payload.model_dump())
    db.add(event)
    db.flush()
    db.commit()
    db.refresh(event)
    return event


def delete_event_day(db: Session, event_day: EventDay) -> None:
    db.delete(event_day)
    db.commit()


# --- MEAL PRICE CONFIGS ---

def get_meal_price_configs(db: Session) -> list[MealPriceConfig]:
    seed_default_meal_prices(db)
    return (
        db.query(MealPriceConfig)
        .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
        .all()
    )


def create_meal_price_config(
    db: Session, payload: MealPriceConfigCreate
) -> MealPriceConfig:
    config = MealPriceConfig(**payload.model_dump())
    db.add(config)
    db.flush()
    db.commit()
    db.refresh(config)
    return config


# --- MEAL CALCULATION SERVICE ---

def calculate_meal_expenses(
    db: Session, start_date: datetime.date, end_date: datetime.date
) -> MealExpenseReportResponse:
    seed_default_meal_prices(db)

    event_days_map = {
        ev.event_date: ev.event_type
        for ev in db.query(EventDay)
        .filter(EventDay.event_date >= start_date, EventDay.event_date <= end_date)
        .all()
    }

    def get_price(d: datetime.date, day_type: str) -> float:
        cfg = (
            db.query(MealPriceConfig)
            .filter(MealPriceConfig.day_type == day_type, MealPriceConfig.effective_from <= d)
            .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
            .first()
        )
        if cfg:
            return float(cfg.price_per_meal)
        return 50000.0 if day_type == "PRESIDENT_VISIT" else 35000.0

    eligible_stays = (
        db.query(Stay)
        .filter(
            Stay.accommodation_type == "KTX",
            Stay.has_meals.is_(True),
            Stay.start_date <= end_date,
            or_(Stay.end_date.is_(None), Stay.end_date >= start_date),
        )
        .all()
    )

    items: list[MealExpenseReportItem] = []

    for stay in eligible_stays:
        emp = stay.employee
        room = stay.room
        if not emp:
            continue

        absences_set = {
            ma.absence_date
            for ma in db.query(MealAbsence)
            .filter(
                MealAbsence.stay_id == stay.id,
                MealAbsence.absence_date >= start_date,
                MealAbsence.absence_date <= end_date,
            )
            .all()
        }

        stay_days_count = 0
        absent_days_count = 0
        meal_days_count = 0
        normal_days_count = 0
        event_days_count = 0
        total_cost = 0.0

        curr_d = start_date
        while curr_d <= end_date:
            if stay.start_date <= curr_d and (stay.end_date is None or stay.end_date >= curr_d):
                stay_days_count += 1
                if curr_d in absences_set:
                    absent_days_count += 1
                else:
                    meal_days_count += 1
                    day_type = event_days_map.get(curr_d, "NORMAL")
                    if day_type == "NORMAL":
                        normal_days_count += 1
                    else:
                        event_days_count += 1

                    price = get_price(curr_d, day_type)
                    total_cost += price * 2

            curr_d += datetime.timedelta(days=1)

        if stay_days_count > 0:
            items.append(
                MealExpenseReportItem(
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    name_chinese=emp.name_chinese,
                    passport_number=emp.passport_number,
                    room_number=room.room_number if room else "N/A",
                    stay_days=stay_days_count,
                    absent_days=absent_days_count,
                    meal_days=meal_days_count,
                    normal_days=normal_days_count,
                    event_days=event_days_count,
                    meal_count=meal_days_count * 2,
                    total_cost=total_cost,
                )
            )

    total_employees = len(items)
    total_stay_days = sum(i.stay_days for i in items)
    total_meal_days = sum(i.meal_days for i in items)
    total_meals = sum(i.meal_count for i in items)
    total_expense = sum(i.total_cost for i in items)

    return MealExpenseReportResponse(
        start_date=start_date,
        end_date=end_date,
        total_employees=total_employees,
        total_stay_days=total_stay_days,
        total_meal_days=total_meal_days,
        total_meals=total_meals,
        total_expense=total_expense,
        items=items,
    )


def get_daily_presence_report(
    db: Session, target_date: datetime.date
) -> DailyPresenceReportResponse:
    # 1. Query stays valid on target_date
    stays = (
        db.query(Stay)
        .filter(
            or_(Stay.start_date.is_(None), Stay.start_date <= target_date),
            or_(Stay.end_date.is_(None), Stay.end_date >= target_date),
        )
        .all()
    )

    stay_ids = [s.id for s in stays]
    absent_stay_ids = set(
        r[0]
        for r in db.query(MealAbsence.stay_id)
        .filter(MealAbsence.stay_id.in_(stay_ids), MealAbsence.absence_date == target_date)
        .all()
    ) if stay_ids else set()

    items: list[DailyPresenceItem] = []
    unassigned_items: list[DailyPresenceItem] = []
    ktx_map: dict[str, list[DailyPresenceItem]] = {}
    hotel_map: dict[str, list[DailyPresenceItem]] = {}

    for stay in stays:
        if stay.id in absent_stay_ids:
            continue

        emp = stay.employee
        if not emp:
            continue

        room_num = stay.room.room_number if stay.room else None
        hotel_n = stay.hotel.name if stay.hotel else None
        hotel_rm = stay.hotel_room_number

        if room_num:
            loc_name = f"Phòng {room_num}"
        elif hotel_n:
            loc_name = f"{hotel_n}" + (f" - P.{hotel_rm}" if hotel_rm else "")
        else:
            loc_name = "Chưa xếp phòng"

        item = DailyPresenceItem(
            employee_id=emp.id,
            employee_code=emp.employee_code,
            name_latin=emp.name_latin,
            name_chinese=emp.name_chinese,
            gender=emp.gender,
            department=emp.department,
            phone=emp.phone,
            accommodation_type=stay.accommodation_type,
            location_name=loc_name,
            room_number=room_num,
            hotel_name=hotel_n,
            hotel_room_number=hotel_rm,
            bed_location=stay.bed_location,
            stay_id=stay.id,
            stay_type=stay.stay_type,
            start_date=stay.start_date,
            expected_end_date=stay.expected_end_date,
        )
        items.append(item)

        if stay.accommodation_type == "KTX" and room_num:
            ktx_map.setdefault(room_num, []).append(item)
        elif stay.accommodation_type == "HOTEL" and hotel_n:
            hotel_map.setdefault(hotel_n, []).append(item)
        else:
            unassigned_items.append(item)

    # 2. Query all employees to find those who have returned home (exited) on target_date
    all_employees = get_employees(db)
    emp_statuses = evaluate_employee_statuses(db, all_employees, today=target_date)
    
    exited_items: list[DailyPresenceItem] = []
    for emp_read in emp_statuses:
        if not emp_read.is_in_vietnam:
            exited_items.append(
                DailyPresenceItem(
                    employee_id=emp_read.id,
                    employee_code=emp_read.employee_code,
                    name_latin=emp_read.name_latin,
                    name_chinese=emp_read.name_chinese,
                    gender=emp_read.gender,
                    department=emp_read.department,
                    phone=emp_read.phone,
                    accommodation_type="KTX",
                    location_name="Đã về nước",
                    actual_exit_date=emp_read.actual_exit_date,
                    expected_entry_date=emp_read.expected_entry_date,
                    notes=emp_read.notes,
                )
            )

    ktx_groups = [
        DailyPresenceGroup(group_name=k, count=len(v), items=v)
        for k, v in ktx_map.items()
    ]
    hotel_groups = [
        DailyPresenceGroup(group_name=k, count=len(v), items=v)
        for k, v in hotel_map.items()
    ]

    ktx_count = sum(g.count for g in ktx_groups)
    hotel_count = sum(g.count for g in hotel_groups)

    return DailyPresenceReportResponse(
        target_date=target_date,
        summary=DailyPresenceSummary(
            total_in_vn=len(items),
            ktx_count=ktx_count,
            hotel_count=hotel_count,
            unassigned_count=len(unassigned_items),
            exited_count=len(exited_items),
        ),
        ktx_groups=ktx_groups,
        hotel_groups=hotel_groups,
        unassigned_items=unassigned_items,
        exited_items=exited_items,
        items=items,
    )


# --- DOCUMENT ATTACHMENT SERVICES ---

def save_attachment(
    db: Session,
    file: UploadFile,
    entity_type: str,
    entity_id: int,
) -> DocumentAttachment:
    # 1. Validate file extension
    original_filename = file.filename or "file"
    _, ext = os.path.splitext(original_filename)
    ext_lower = ext.lower()
    if ext_lower not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận tệp ảnh (.jpg, .jpeg, .png, .webp) hoặc .pdf",
        )

    # 2. Read content & validate file size (< 20 MB)
    content = file.file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Dung lượng tệp vượt quá giới hạn tối đa 20 MB ({file_size / (1024 * 1024):.2f} MB)",
        )

    # 3. Create destination folder if not exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 4. Save physical file with unique filename
    unique_filename = f"{entity_type.lower()}_{entity_id}_{uuid.uuid4().hex[:8]}{ext_lower}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # Determine mime_type
    mime_type = file.content_type or ("application/pdf" if ext_lower == ".pdf" else f"image/{ext_lower.lstrip('.')}")

    # 5. Create database record
    attachment = DocumentAttachment(
        entity_type=entity_type.upper(),
        entity_id=entity_id,
        file_name=original_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def list_attachments(
    db: Session,
    entity_type: str,
    entity_id: int,
) -> list[DocumentAttachment]:
    return (
        db.query(DocumentAttachment)
        .filter(
            DocumentAttachment.entity_type == entity_type.upper(),
            DocumentAttachment.entity_id == entity_id,
        )
        .order_by(DocumentAttachment.created_at.desc())
        .all()
    )


def get_attachment(db: Session, attachment_id: int) -> DocumentAttachment | None:
    return db.query(DocumentAttachment).filter(DocumentAttachment.id == attachment_id).first()


def delete_attachment(db: Session, attachment_id: int) -> bool:
    attachment = get_attachment(db, attachment_id)
    if not attachment:
        return False

    # Remove physical file if exists
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except OSError:
            pass

    db.delete(attachment)
    db.commit()
    return True


