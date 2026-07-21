from __future__ import annotations

import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session

from features.hr_foreign.models import (
    EventDay,
    ForeignEmployee,
    MealAbsence,
    MealPriceConfig,
    Room,
    Stay,
    TamTru,
    Visa,
)
from features.hr_foreign.schemas import (
    EventDayCreate,
    ExpiringDocumentItem,
    ExpiringDocumentsResponse,
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
    EmployeeHistoryResponse,
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
    VisaCreate,
    VisaRead,
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
        stays=stay_reads,
        visas=[VisaRead.model_validate(v) for v in visas],
        tam_trus=[TamTruRead.model_validate(tt) for tt in tam_trus],
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


def get_room_occupancy(db: Session) -> list[RoomOccupancyRead]:
    rooms = db.query(Room).all()
    today = datetime.date.today()
    result: list[RoomOccupancyRead] = []

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
                room_id=room.id,
                room_number=room.room_number,
                notes=room.notes,
                active_residents=residents,
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
