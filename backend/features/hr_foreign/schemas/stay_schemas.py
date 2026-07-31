from __future__ import annotations
import datetime
from pydantic import BaseModel, ConfigDict


# --- STAY SCHEMAS ---

class StayBase(BaseModel):
    employee_id: int
    accommodation_type: str  # "KTX" | "HOTEL"
    room_id: int | None = None
    hotel_id: int | None = None
    hotel_room_number: str | None = None
    bed_location: str | None = None
    stay_type: str  # "CO_DINH" | "CONG_TAC"
    has_meals: bool = True
    invoice_amount: float | None = None
    start_date: datetime.date | None = None
    expected_end_date: datetime.date | None = None
    end_date: datetime.date | None = None
    notes: str | None = None


class StayCreate(StayBase):
    pass


class StayUpdate(StayBase):
    pass


class StayCheckout(BaseModel):
    end_date: datetime.date


class StayRead(StayBase):
    id: int
    room_number: str | None = None
    hotel_name: str | None = None

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
    invoice_amount: float | None = None
    bed_location: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None


class RoomOccupancyRead(BaseModel):
    accommodation_type: str = "KTX"  # KTX or HOTEL
    unit_id: int                    # room_id or hotel_id
    unit_name: str                  # room_number or hotel_name
    room_id: int | None = None      # backward compatibility for KTX
    room_number: str | None = None  # backward compatibility for KTX
    address: str | None = None
    notes: str | None = None
    active_residents: list[ResidentInfo]
