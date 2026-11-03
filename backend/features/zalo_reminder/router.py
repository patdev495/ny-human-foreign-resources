from __future__ import annotations

from datetime import date, time
from typing import Literal
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from features.auth.models import User
from features.auth.security import require_admin
from core.database import get_db
from core.system_settings import get_time_setting, set_time_setting
from features.zalo_reminder.client import BotClient, BotUnavailable, get_bot_client
from features.zalo_reminder.schemas import CutoffTime, RecipientSelection, TestSendRequest
from features.zalo_reminder.scheduler import MESSAGE, daily_results, run_due
from features.zalo_reminder.store import RecipientStore, get_recipient_store
from features.bot_reminder.config import channel_enabled, pending_enabled, set_channel_enabled
from features.bot_reminder.pre_reminder import message_for
from features.bot_reminder.schemas import TestMessageResult, TestSendResponse
from features.zalo_reminder import scheduler

router = APIRouter(prefix="/api/zalo-reminder", tags=["Zalo reminder"])


class EnabledSetting(BaseModel):
    enabled: bool
    effective_date: date | None = None
    pending_enabled: bool | None = None


@router.get("/enabled", response_model=EnabledSetting)
def get_enabled(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> EnabledSetting:
    now = scheduler.now_vietnam()
    return EnabledSetting(enabled=channel_enabled(db, "zalo", now.date()), effective_date=now.date(),
                          pending_enabled=pending_enabled(db, "zalo", now.date()))


@router.put("/enabled", response_model=EnabledSetting)
def put_enabled(payload: EnabledSetting, _admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> EnabledSetting:
    now = scheduler.now_vietnam()
    effective_date = set_channel_enabled(db, "zalo", payload.enabled, now)
    return EnabledSetting(enabled=payload.enabled, effective_date=effective_date)


@router.get("/cutoff", response_model=CutoffTime)
def get_cutoff(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> CutoffTime:
    return CutoffTime(time=get_time_setting(db, "meal_cutoff_time", "17:00").strftime("%H:%M"))


@router.put("/cutoff", response_model=CutoffTime)
def put_cutoff(
    payload: CutoffTime, _admin: User = Depends(require_admin), db: Session = Depends(get_db),
) -> CutoffTime:
    if time.fromisoformat(payload.time) <= get_time_setting(db, "hr_pre_reminder_time", "16:00"):
        raise HTTPException(422, "Giờ nhắc HR sớm phải trước giờ chốt cơm")
    set_time_setting(db, "meal_cutoff_time", time.fromisoformat(payload.time))
    return payload


@router.get("/status")
def get_status(
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
) -> dict[str, bool]:
    try:
        return bot.status()
    except BotUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/qr", response_class=Response)
def get_qr(
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
) -> Response:
    try:
        image = bot.qr()
    except BotUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if image is None:
        raise HTTPException(status_code=404, detail="QR is not available")
    return Response(content=image, media_type="image/png", headers={"Cache-Control": "no-store"})


@router.get("/friends")
def get_friends(
    q: str = Query(default="", max_length=100),
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
) -> list[dict[str, str]]:
    try:
        friends = bot.friends()
    except BotUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    term = q.strip().casefold()
    return [friend for friend in friends if term in friend["name"].casefold()]


@router.get("/recipients")
def get_recipients(
    _admin: User = Depends(require_admin), store: RecipientStore = Depends(get_recipient_store),
) -> list[dict[str, str]]:
    return store.list_recipients()


@router.put("/recipients")
def put_recipients(
    payload: RecipientSelection,
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
    store: RecipientStore = Depends(get_recipient_store),
) -> list[dict[str, str]]:
    try:
        friends = {friend["id"]: friend for friend in bot.friends()}
    except BotUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    ids = list(dict.fromkeys(payload.ids))
    if any(not id or len(id) > 100 or id not in friends for id in ids):
        raise HTTPException(status_code=422, detail="Select friends of the connected Zalo account")
    store.replace_recipients([friends[id] for id in ids])
    return store.list_recipients()


@router.post("/test-send", response_model=TestSendResponse)
def send_test(
    payload: TestSendRequest,
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
    store: RecipientStore = Depends(get_recipient_store),
    db: Session = Depends(get_db),
) -> TestSendResponse:
    recipient = next((person for person in store.list_recipients() if person["id"] == payload.id), None)
    if recipient is None:
        raise HTTPException(status_code=404, detail="Recipient is not selected")
    results: list[TestMessageResult] = []
    messages: tuple[tuple[Literal["PRE", "CUTOFF"], str], ...] = (
        ("PRE", message_for(db, scheduler.now_vietnam().date())), ("CUTOFF", MESSAGE),
    )
    for message_type, content in messages:
        status: Literal["SENT", "FAILED"] = "SENT"
        error = ""
        try:
            bot.send(recipient["id"], content)
        except BotUnavailable as exc:
            status, error = "FAILED", str(exc)
        store.record_delivery(recipient["id"], recipient["name"], status, error,
                              message_type=message_type)
        results.append(TestMessageResult(message_type=message_type, status=status, error=error))
    return TestSendResponse(status="SENT" if all(result.status == "SENT" for result in results) else "FAILED",
                            results=results)


@router.get("/deliveries")
def get_deliveries(
    _admin: User = Depends(require_admin), store: RecipientStore = Depends(get_recipient_store),
) -> list[dict[str, str]]:
    return store.list_deliveries()


@router.get("/daily")
def get_daily(
    date: date, _admin: User = Depends(require_admin), db: Session = Depends(get_db),
) -> list[dict[str, str]]:
    return daily_results(db, date)


@router.post("/run-due")
def run_due_now(
    _admin: User = Depends(require_admin), bot: BotClient = Depends(get_bot_client),
    db: Session = Depends(get_db),
) -> dict[str, str | bool]:
    return run_due(db, bot)
