from __future__ import annotations

import datetime
from pydantic import BaseModel, ConfigDict


# --- FOREIGN EMPLOYEE SCHEMAS ---

class ForeignEmployeeBase(BaseModel):
    employee_code: str | None = None
    name_latin: str
    name_chinese: str | None = None
    gender: str
    nationality: str | None = None
    date_of_birth: datetime.date | None = None
    passport_number: str | None = None
    passport_expiry: datetime.date | None = None
    required_exit_date: datetime.date | None = None
    phone: str | None = None
    department: str | None = None
    role: str | None = None
    notes: str | None = None


class ForeignEmployeeCreate(ForeignEmployeeBase):
    pass


class ForeignEmployeeUpdate(ForeignEmployeeBase):
    pass


class ForeignEmployeeRead(ForeignEmployeeBase):
    id: int
    is_in_vietnam: bool = True
    current_room_number: str | None = None
    # Computed document expiry summaries (for list view status badges)
    latest_visa_expiry: datetime.date | None = None
    latest_visa_type: str | None = None
    latest_gpld_expiry: datetime.date | None = None
    latest_tamtru_expiry: datetime.date | None = None
    latest_contract_expiry: datetime.date | None = None

    model_config = ConfigDict(from_attributes=True)



# --- ROOM SCHEMAS ---

class RoomBase(BaseModel):
    room_number: str
    notes: str | None = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- STAY SCHEMAS ---

class StayBase(BaseModel):
    employee_id: int
    accommodation_type: str  # "KTX" | "HOTEL"
    room_id: int | None = None
    bed_location: str | None = None
    stay_type: str  # "CO_DINH" | "CONG_TAC"
    has_meals: bool = True
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    notes: str | None = None


class StayCreate(StayBase):
    pass


class StayUpdate(StayBase):
    pass


class StayRead(StayBase):
    id: int
    room_number: str | None = None

    model_config = ConfigDict(from_attributes=True)


# --- ROOM OCCUPANCY SCHEMAS ---

class ResidentInfo(BaseModel):
    employee_id: int
    name_latin: str
    name_chinese: str | None = None
    passport_number: str | None = None
    stay_id: int
    stay_type: str
    has_meals: bool
    bed_location: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None


class RoomOccupancyRead(BaseModel):
    room_id: int
    room_number: str
    notes: str | None = None
    active_residents: list[ResidentInfo]


# --- VISA SCHEMAS ---

class VisaBase(BaseModel):
    visa_type: str | None = None
    entry_date: datetime.date | None = None
    expiry_date: datetime.date | None = None
    notes: str | None = None


class VisaCreate(VisaBase):
    pass


class VisaUpdate(VisaBase):
    pass


class VisaRead(VisaBase):
    id: int
    stay_id: int

    model_config = ConfigDict(from_attributes=True)


# --- TAM TRU SCHEMAS ---

class TamTruBase(BaseModel):
    registration_date: datetime.date | None = None
    expiry_date: datetime.date | None = None
    notes: str | None = None


class TamTruCreate(TamTruBase):
    pass


class TamTruUpdate(TamTruBase):
    pass


class TamTruRead(TamTruBase):
    id: int
    stay_id: int

    model_config = ConfigDict(from_attributes=True)


# --- WORK PERMIT SCHEMAS ---

class WorkPermitBase(BaseModel):
    permit_number: str | None = None
    issue_date: datetime.date | None = None
    valid_from: datetime.date | None = None
    valid_to: datetime.date | None = None
    issue_type: str | None = None
    notes: str | None = None


class WorkPermitCreate(WorkPermitBase):
    pass


class WorkPermitUpdate(WorkPermitBase):
    pass


class WorkPermitRead(WorkPermitBase):
    id: int
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


# --- CONTRACT SCHEMAS ---

class ContractBase(BaseModel):
    contract_type: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    notes: str | None = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


# --- EXPIRING DOCUMENTS SCHEMAS ---

class ExpiringDocumentItem(BaseModel):
    id: int
    stay_id: int
    employee_id: int
    employee_name: str
    passport_number: str | None = None
    doc_type: str  # "VISA" | "TAM_TRU"
    type_name: str | None = None
    expiry_date: datetime.date | None = None
    days_remaining: int | None = None


class ExpiringDocumentsResponse(BaseModel):
    expiring_visas: list[ExpiringDocumentItem]
    expiring_tam_trus: list[ExpiringDocumentItem]


# --- MEAL ABSENCE SCHEMAS ---

class MealAbsenceBase(BaseModel):
    absence_date: datetime.date
    reason: str | None = None


class MealAbsenceCreate(MealAbsenceBase):
    pass


class MealAbsenceRead(MealAbsenceBase):
    id: int
    stay_id: int

    model_config = ConfigDict(from_attributes=True)


# --- EVENT DAY SCHEMAS ---

class EventDayBase(BaseModel):
    event_date: datetime.date
    event_type: str = "PRESIDENT_VISIT"
    notes: str | None = None


class EventDayCreate(EventDayBase):
    pass


class EventDayRead(EventDayBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- MEAL PRICE CONFIG SCHEMAS ---

class MealPriceConfigBase(BaseModel):
    day_type: str  # "NORMAL" | "PRESIDENT_VISIT"
    price_per_meal: float
    effective_from: datetime.date


class MealPriceConfigCreate(MealPriceConfigBase):
    pass


class MealPriceConfigRead(MealPriceConfigBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- MEAL EXPENSE REPORT SCHEMAS ---

class MealExpenseReportItem(BaseModel):
    employee_id: int
    employee_name: str
    name_chinese: str | None = None
    passport_number: str | None = None
    room_number: str
    stay_days: int
    absent_days: int
    meal_days: int
    normal_days: int
    event_days: int
    meal_count: int
    total_cost: float


class MealExpenseReportResponse(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    total_employees: int
    total_stay_days: int
    total_meal_days: int
    total_meals: int
    total_expense: float
    items: list[MealExpenseReportItem]


# --- EMPLOYEE 360 HISTORY SCHEMA ---

class EmployeeHistoryResponse(BaseModel):
    employee: ForeignEmployeeRead
    work_permits: list[WorkPermitRead]
    contracts: list[ContractRead]
    stays: list[StayRead]
    visas: list[VisaRead]
    tam_trus: list[TamTruRead]
