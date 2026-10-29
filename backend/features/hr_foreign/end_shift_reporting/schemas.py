from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import BaseModel, model_validator


ShiftChoice = Literal["17:30", "20:00", "SELF_TRAVEL"]
PickupLocation = Literal["CN09", "CN15"]


class EndShiftSelection(BaseModel):
    shift_choice: ShiftChoice
    pickup_location: PickupLocation | None = None
    destination: Literal["KTX"] = "KTX"

    @model_validator(mode="after")
    def validate_pickup(self) -> EndShiftSelection:
        if self.shift_choice == "SELF_TRAVEL":
            if self.pickup_location is not None:
                raise ValueError("Self travel must not have a pickup location")
        elif self.pickup_location is None:
            raise ValueError("Pickup location is required")
        return self


class EndShiftSubmission(EndShiftSelection):
    employee_id: int
    report_date: dt.date


class EndShiftReportView(BaseModel):
    employee_id: int
    report_date: dt.date
    current: EndShiftSelection | None


class DemandPerson(BaseModel):
    employee_id: int
    name_latin: str
    name_chinese: str | None
    room_number: str | None


class DemandGroup(BaseModel):
    key: str
    count: int
    people: list[DemandPerson]


class EndShiftDemandView(BaseModel):
    date: dt.date
    groups: list[DemandGroup]
