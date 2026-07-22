from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    Contract,
    EventDay,
    ForeignEmployee,
    Hotel,
    MealAbsence,
    MealPriceConfig,
    Room,
    Stay,
    TamTru,
    Visa,
    WorkPermit,
)
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


def to_employee_read(db: Session, emp: ForeignEmployee) -> ForeignEmployeeRead:
    today = datetime.date.today()
    res = ForeignEmployeeRead.model_validate(emp)

    active_stay = (
        db.query(Stay)
        .filter(
            Stay.employee_id == emp.id,
            or_(Stay.end_date.is_(None), Stay.end_date >= today),
        )
        .first()
    )
    has_exited = bool(emp.required_exit_date and emp.required_exit_date < today)

    res.is_in_vietnam = bool(active_stay and not has_exited)
    if active_stay:
        if active_stay.room:
            res.current_room_number = active_stay.room.room_number
        elif active_stay.accommodation_type == "HOTEL":
            res.current_room_number = "Khách sạn"
    else:
        res.current_room_number = None

    # --- Compute document expiry summaries ---
    # Latest visa (max expiry_date across all stays)
    all_stay_ids = [s.id for s in emp.stays]
    if all_stay_ids:
        latest_visa = (
            db.query(Visa)
            .filter(Visa.stay_id.in_(all_stay_ids), Visa.expiry_date.isnot(None))
            .order_by(Visa.expiry_date.desc())
            .first()
        )
        res.latest_visa_expiry = latest_visa.expiry_date if latest_visa else None
        res.latest_visa_type = latest_visa.visa_type if latest_visa else None

        latest_tamtru = (
            db.query(TamTru)
            .filter(TamTru.stay_id.in_(all_stay_ids), TamTru.expiry_date.isnot(None))
            .order_by(TamTru.expiry_date.desc())
            .first()
        )
        res.latest_tamtru_expiry = latest_tamtru.expiry_date if latest_tamtru else None

    # Latest GPLĐ (max valid_to)
    latest_wp = (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id == emp.id, WorkPermit.valid_to.isnot(None))
        .order_by(WorkPermit.valid_to.desc())
        .first()
    )
    res.latest_gpld_expiry = latest_wp.valid_to if latest_wp else None

    # Latest contract (max end_date)
    latest_contract = (
        db.query(Contract)
        .filter(Contract.employee_id == emp.id, Contract.end_date.isnot(None))
        .order_by(Contract.end_date.desc())
        .first()
    )
    res.latest_contract_expiry = latest_contract.end_date if latest_contract else None

    return res



def get_employee_by_id(db: Session, emp_id: int) -> ForeignEmployee | None:
    return db.query(ForeignEmployee).filter(ForeignEmployee.id == emp_id).first()


def create_employee(db: Session, payload: ForeignEmployeeCreate) -> ForeignEmployee:
    emp = ForeignEmployee(**payload.model_dump())
    db.add(emp)
    db.flush()
    db.commit()
    db.refresh(emp)
    return emp


def update_employee(
    db: Session, emp: ForeignEmployee, payload: ForeignEmployeeUpdate
) -> ForeignEmployee:
    for key, value in payload.model_dump().items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp


def delete_employee(db: Session, emp: ForeignEmployee) -> None:
    db.delete(emp)
    db.commit()


def get_employee_history(db: Session, emp_id: int) -> EmployeeHistoryResponse | None:
    emp = get_employee_by_id(db, emp_id)
    if not emp:
        return None

    work_permits = get_work_permits_by_employee(db, emp_id)
    contracts = get_contracts_by_employee(db, emp_id)
    stays = get_stays(db, employee_id=emp_id)
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


# --- EXPIRING DOCUMENTS ---

def get_expiring_documents(db: Session, days: int = 30) -> ExpiringDocumentsResponse:
    today = datetime.date.today()
    cutoff_date = today + datetime.timedelta(days=days)

    visas = db.query(Visa).filter(Visa.expiry_date >= today, Visa.expiry_date <= cutoff_date).all()
    tam_trus = db.query(TamTru).filter(TamTru.expiry_date >= today, TamTru.expiry_date <= cutoff_date).all()

    expiring_visas: list[ExpiringDocumentItem] = []
    for v in visas:
        stay = v.stay
        emp = stay.employee if stay else None
        if emp:
            days_rem = (v.expiry_date - today).days
            expiring_visas.append(
                ExpiringDocumentItem(
                    id=v.id,
                    stay_id=v.stay_id,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="VISA",
                    type_name=v.visa_type,
                    expiry_date=v.expiry_date,
                    days_remaining=days_rem,
                )
            )

    expiring_tam_trus: list[ExpiringDocumentItem] = []
    for tt in tam_trus:
        stay = tt.stay
        emp = stay.employee if stay else None
        if emp:
            days_rem = (tt.expiry_date - today).days
            expiring_tam_trus.append(
                ExpiringDocumentItem(
                    id=tt.id,
                    stay_id=tt.stay_id,
                    employee_id=emp.id,
                    employee_name=emp.name_latin,
                    passport_number=emp.passport_number,
                    doc_type="TAM_TRU",
                    type_name="Đăng ký Tạm trú",
                    expiry_date=tt.expiry_date,
                    days_remaining=days_rem,
                )
            )

    return ExpiringDocumentsResponse(
        expiring_visas=expiring_visas,
        expiring_tam_trus=expiring_tam_trus,
    )


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

    if not stays:
        return DailyPresenceReportResponse(
            target_date=target_date,
            summary=DailyPresenceSummary(total_in_vn=0, ktx_count=0, hotel_count=0),
            ktx_groups=[],
            hotel_groups=[],
            items=[],
        )

    stay_ids = [s.id for s in stays]
    absent_stay_ids = set(
        r[0]
        for r in db.query(MealAbsence.stay_id)
        .filter(MealAbsence.stay_id.in_(stay_ids), MealAbsence.absence_date == target_date)
        .all()
    )

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
        ),
        ktx_groups=ktx_groups,
        hotel_groups=hotel_groups,
        unassigned_items=unassigned_items,
        items=items,
    )

