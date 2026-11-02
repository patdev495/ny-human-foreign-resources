from __future__ import annotations

from datetime import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.system_settings import get_time_setting, set_time_setting
from features.auth.models import User
from features.auth.security import require_admin
from features.bot_reminder.schemas import CutoffTime

router = APIRouter(prefix="/api/bot-reminder", tags=["Bot reminder"])


@router.get("/cutoff", response_model=CutoffTime)
def get_cutoff(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> CutoffTime:
    return CutoffTime(time=get_time_setting(db, "meal_cutoff_time", "17:00").strftime("%H:%M"))


@router.put("/cutoff", response_model=CutoffTime)
def put_cutoff(payload: CutoffTime, _admin: User = Depends(require_admin),
               db: Session = Depends(get_db)) -> CutoffTime:
    set_time_setting(db, "meal_cutoff_time", time.fromisoformat(payload.time))
    return payload
