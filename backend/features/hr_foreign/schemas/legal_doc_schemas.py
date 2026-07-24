from __future__ import annotations
import datetime
from pydantic import BaseModel, ConfigDict
from .employee_schemas import ForeignEmployeeRead, TravelRecordRead
from .stay_schemas import StayRead


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
    contract_number: str | None = None
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


# --- DOCUMENT WARNING CONFIG SCHEMAS ---

class DocWarningConfigItem(BaseModel):
    id: int
    doc_type: str
    warning_value: int
    warning_unit: str  # "DAY" | "MONTH"

    model_config = ConfigDict(from_attributes=True)


class DocWarningConfigUpdateItem(BaseModel):
    doc_type: str
    warning_value: int
    warning_unit: str  # "DAY" | "MONTH"


class DocWarningConfigResponse(BaseModel):
    configs: list[DocWarningConfigItem]


# --- EMPLOYEE 360 HISTORY SCHEMA ---

class EmployeeHistoryResponse(BaseModel):
    employee: ForeignEmployeeRead
    work_permits: list[WorkPermitRead]
    contracts: list[ContractRead]
    stays: list[StayRead]
    visas: list[VisaRead]
    tam_trus: list[TamTruRead]
    travel_records: list[TravelRecordRead] = []


# --- DOCUMENT ATTACHMENT SCHEMAS ---

class DocumentAttachmentResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    file_size: int
    mime_type: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
