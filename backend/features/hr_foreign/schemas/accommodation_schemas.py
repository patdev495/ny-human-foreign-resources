from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field


# --- ROOM SCHEMAS ---

class RoomBase(BaseModel):
    room_number: str
    capacity: int | None = Field(default=None, ge=1)
    notes: str | None = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- HOTEL SCHEMAS ---

class HotelBase(BaseModel):
    name: str
    address: str | None = None
    phone: str | None = None
    notes: str | None = None


class HotelCreate(HotelBase):
    pass


class HotelUpdate(HotelBase):
    pass


class HotelRead(HotelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
