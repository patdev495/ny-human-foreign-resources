from __future__ import annotations
from typing import Literal
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
    entry_date: datetime.date | None = None
    expected_entry_date: datetime.date | None = None
    expected_exit_date: datetime.date | None = None
    actual_exit_date: datetime.date | None = None
    required_exit_date: datetime.date | None = None
    phone: str | None = None
    department: str | None = None
    role: str | None = None
    work_type: str = "CO_DINH"  # "CO_DINH" | "CONG_TAC"
    notes: str | None = None


class ForeignEmployeeCreate(ForeignEmployeeBase):
    pass


class ForeignEmployeeUpdate(ForeignEmployeeBase):
    pass


class ForeignEmployeeRead(ForeignEmployeeBase):
    id: int
    is_in_vietnam: bool = True
    is_overdue_exit: bool = False
    current_room_number: str | None = None
    # Computed document expiry summaries (for list view status badges)
    latest_visa_expiry: datetime.date | None = None
    latest_visa_type: str | None = None
    latest_gpld_expiry: datetime.date | None = None
    latest_tamtru_expiry: datetime.date | None = None
    latest_contract_expiry: datetime.date | None = None

    model_config = ConfigDict(from_attributes=True)


# --- TRAVEL RECORD SCHEMAS ---

class TravelRecordBase(BaseModel):
    entry_date: datetime.date | None = None
    expected_entry_date: datetime.date | None = None
    expected_exit_date: datetime.date | None = None
    actual_exit_date: datetime.date | None = None
    notes: str | None = None


class TravelRecordCreate(TravelRecordBase):
    pass


class TravelRecordUpdate(TravelRecordBase):
    pass


class TravelRecordRead(TravelRecordBase):
    id: int
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


class ExitDateActionRequest(BaseModel):
    actual_exit_date: datetime.date | None = None
    expected_exit_date: datetime.date | None = None
    expected_entry_date: datetime.date | None = None
    action_type: Literal["CHECK_OUT", "KEEP_ROOM_ABSENCE"] = "CHECK_OUT"
    notes: str | None = None


# --- EXPIRING DOCUMENTS SCHEMAS ---

class ExpiringDocumentItem(BaseModel):
    id: int | None = None
    stay_id: int | None = None
    employee_id: int
    employee_name: str
    passport_number: str | None = None
    doc_type: str  # "VISA" | "TAM_TRU" | "GPLD" | "CONTRACT" | "PASSPORT"
    type_name: str | None = None
    expiry_date: datetime.date | None = None
    days_remaining: int | None = None
    is_missing_info: bool = False
    missing_reason: str | None = None


class ExpiringDocumentsResponse(BaseModel):
    expiring_visas: list[ExpiringDocumentItem] = []
    expiring_tam_trus: list[ExpiringDocumentItem] = []
    expiring_gpl_ds: list[ExpiringDocumentItem] = []
    expiring_contracts: list[ExpiringDocumentItem] = []
    expiring_passports: list[ExpiringDocumentItem] = []
