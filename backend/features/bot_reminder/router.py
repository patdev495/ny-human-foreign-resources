from __future__ import annotations

from datetime import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.system_settings import get_time_setting, set_time_setting
from features.auth.models import User
from features.auth.security import require_admin
from features.bot_reminder.schemas import CutoffTime
from features.bot_reminder.schemas import TravelReminderConfig
from features.bot_reminder.travel import get_config, save_config

router = APIRouter(prefix="/api/bot-reminder", tags=["Bot reminder"])


@router.get("/travel", response_model=TravelReminderConfig)
def get_travel(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> TravelReminderConfig:
    return get_config(db)


@router.put("/travel", response_model=TravelReminderConfig)
def put_travel(payload: TravelReminderConfig, _admin: User = Depends(require_admin),
               db: Session = Depends(get_db)) -> TravelReminderConfig:
    return save_config(db, payload)


@router.get("/cutoff", response_model=CutoffTime)
def get_cutoff(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> CutoffTime:
    return CutoffTime(time=get_time_setting(db, "meal_cutoff_time", "17:00").strftime("%H:%M"))


@router.put("/cutoff", response_model=CutoffTime)
def put_cutoff(payload: CutoffTime, _admin: User = Depends(require_admin),
               db: Session = Depends(get_db)) -> CutoffTime:
    pre_time = get_time_setting(db, "hr_pre_reminder_time", "16:00")
    if time.fromisoformat(payload.time) <= pre_time:
        raise HTTPException(422, "Giờ nhắc HR sớm phải trước giờ chốt cơm")
    set_time_setting(db, "meal_cutoff_time", time.fromisoformat(payload.time))
    return payload


@router.get("/pre-reminder", response_model=CutoffTime)
def get_pre_reminder(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> CutoffTime:
    return CutoffTime(time=get_time_setting(db, "hr_pre_reminder_time", "16:00").strftime("%H:%M"))


@router.put("/pre-reminder", response_model=CutoffTime)
def put_pre_reminder(payload: CutoffTime, _admin: User = Depends(require_admin),
                     db: Session = Depends(get_db)) -> CutoffTime:
    value = time.fromisoformat(payload.time)
    if value >= min(get_time_setting(db, "meal_cutoff_time", "17:00"), time(17)):
        raise HTTPException(422, "Giờ nhắc HR sớm phải trước giờ chốt cơm và hạn báo điều xe 17:00")
    set_time_setting(db, "hr_pre_reminder_time", value)
    return payload
