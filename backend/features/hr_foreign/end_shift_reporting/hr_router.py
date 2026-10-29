from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from features.hr_foreign.end_shift_reporting.schemas import EndShiftDemandView
from features.hr_foreign.end_shift_reporting.service import demand_view

router = APIRouter(prefix="/end-shift", tags=["End Shift Reporting"])


@router.get("/demand", response_model=EndShiftDemandView)
def get_demand(date: dt.date = Query(...), db: Session = Depends(get_db)) -> EndShiftDemandView:
    return demand_view(db, date)
