from __future__ import annotations
import datetime
from pydantic import BaseModel, ConfigDict


# --- MEAL ABSENCE SCHEMAS ---

class MealAbsenceBase(BaseModel):
    absence_date: datetime.date
    meal_type: str = "ALL_DAY"  # "BREAKFAST" | "DINNER" | "ALL_DAY"
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


class EventDayCreateBatch(BaseModel):
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    event_type: str = "PRESIDENT_VISIT"
    notes: str | None = None


class EventDayRead(EventDayBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class EventDayUpdate(BaseModel):
    event_date: datetime.date | None = None
    event_type: str | None = None
    notes: str | None = None


# --- MEAL PRICE CONFIG SCHEMAS ---

class MealPriceConfigBase(BaseModel):
    day_type: str  # "NORMAL", "PRESIDENT_VISIT", "TET"...
    day_type_name: str | None = None  # "Ngày bình thường", "Chủ tịch sang"...
    foreign_breakfast_price: float = 30000.0
    foreign_dinner_price: float = 40000.0
    janitor_meal_price: float = 25000.0
    fruit_allowance_price: float | None = 60000.0
    effective_from: datetime.date = datetime.date(2020, 1, 1)
    notes: str | None = None


class MealPriceConfigCreate(MealPriceConfigBase):
    pass


class MealPriceConfigUpdate(BaseModel):
    day_type: str | None = None
    day_type_name: str | None = None
    foreign_breakfast_price: float | None = None
    foreign_dinner_price: float | None = None
    janitor_meal_price: float | None = None
    fruit_allowance_price: float | None = None
    effective_from: datetime.date | None = None
    notes: str | None = None


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


class JanitorDailyItem(BaseModel):
    date: datetime.date
    meal_count: int
    price_per_meal: float
    total_cost: float
    notes: str | None = None


class MealExpenseReportResponse(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    total_employees: int
    total_stay_days: int
    total_meal_days: int
    total_meals: int
    total_expense: float
    items: list[MealExpenseReportItem]
    janitor_items: list[JanitorDailyItem] = []
    total_janitor_meals: int = 0
    total_janitor_expense: float = 0.0



# --- DAILY PRESENCE REPORT SCHEMAS ---

class DailyPresenceItem(BaseModel):
    employee_id: int
    employee_code: str | None = None
    name_latin: str
    name_chinese: str | None = None
    gender: str
    department: str | None = None
    phone: str | None = None
    accommodation_type: str  # KTX or HOTEL
    location_name: str
    room_number: str | None = None
    hotel_name: str | None = None
    hotel_room_number: str | None = None
    bed_location: str | None = None
    stay_id: int | None = None
    stay_type: str | None = None
    start_date: datetime.date | None = None
    expected_end_date: datetime.date | None = None
    actual_exit_date: datetime.date | None = None
    expected_entry_date: datetime.date | None = None
    notes: str | None = None


class DailyPresenceSummary(BaseModel):
    total_in_vn: int
    ktx_count: int
    hotel_count: int
    unassigned_count: int = 0
    exited_count: int = 0


class DailyPresenceGroup(BaseModel):
    group_name: str
    count: int
    items: list[DailyPresenceItem]


class DailyPresenceReportResponse(BaseModel):
    target_date: datetime.date
    summary: DailyPresenceSummary
    ktx_groups: list[DailyPresenceGroup]
    hotel_groups: list[DailyPresenceGroup]
    unassigned_items: list[DailyPresenceItem] = []
    exited_items: list[DailyPresenceItem] = []
    items: list[DailyPresenceItem]


# --- MEAL SESSION LOCK & FORECAST SCHEMAS ---

class MealSessionLockCreate(BaseModel):
    lock_date: datetime.date
    meal_session: str  # "BREAKFAST" | "LUNCH" | "DINNER"
    calculated_meal_count: int
    final_meal_count: int
    locked_price_per_meal: float = 30000.0
    locked_by: str | None = None
    notes: str | None = None


class MealSessionLockRead(BaseModel):
    id: int
    lock_date: datetime.date
    meal_session: str
    calculated_meal_count: int
    final_meal_count: int
    locked_price_per_meal: float
    locked_at: datetime.datetime
    locked_by: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DailyMealSessionSummary(BaseModel):
    meal_session: str  # "BREAKFAST" | "LUNCH" | "DINNER"
    calculated_meal_count: int = 0
    is_locked: bool = False
    final_meal_count: int | None = None
    locked_price_per_meal: float | None = None
    locked_at: datetime.datetime | None = None
    notes: str | None = None


class DailyMealEmployeeItem(BaseModel):
    employee_id: int
    employee_code: str | None = None
    name_latin: str
    name_chinese: str | None = None
    accommodation_type: str  # "KTX" | "HOTEL"
    location_name: str
    stay_id: int
    has_meals: bool
    is_breakfast_absent: bool = False
    is_dinner_absent: bool = False


class DailyMealForecastResponse(BaseModel):
    date: datetime.date
    day_type: str = "NORMAL"
    day_type_name: str = "Ngày bình thường"
    suggested_price_per_meal: float = 30000.0
    suggested_breakfast_price: float = 30000.0
    suggested_dinner_price: float = 40000.0
    suggested_janitor_price: float = 25000.0
    event_notes: str | None = None
    breakfast: DailyMealSessionSummary
    lunch: DailyMealSessionSummary
    dinner: DailyMealSessionSummary
    active_ktx_residents_count: int = 0
    employees: list[DailyMealEmployeeItem] = []
