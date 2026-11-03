from __future__ import annotations

import datetime as dt
import re
import secrets
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from features.auth.models import User
from features.auth.security import require_admin
from features.bot_reminder.config import channel_enabled, pending_enabled, set_channel_enabled
from features.telegram_reminder.client import TelegramClient, TelegramUnavailable, get_telegram_client
from features.telegram_reminder.models import TelegramBot, TelegramDeliveryLog, TelegramRecipient
from features.telegram_reminder.scheduler import daily_results, now_vietnam, run_due
from features.bot_reminder.message import MESSAGE
from features.bot_reminder.pre_reminder import message_for
from features.bot_reminder.schemas import TestMessageResult, TestSendResponse

router = APIRouter(prefix="/api/telegram-reminder", tags=["Telegram reminder"])


class TokenInput(BaseModel):
    token: str = Field(min_length=10, max_length=200)


class Selection(BaseModel):
    ids: list[str] = Field(max_length=100)


class TestInput(BaseModel):
    id: str


class EnabledInput(BaseModel):
    enabled: bool


def bot_state(bot: TelegramBot | None) -> dict[str, str | bool]:
    if bot is None:
        return {"connected": False, "id": "", "name": "", "username": "", "url": ""}
    return {"connected": True, "id": bot.bot_id, "name": bot.name,
            "username": bot.username, "url": f"https://t.me/{bot.username}"}


@router.get("/bot")
def get_bot(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str | bool]:
    return bot_state(db.get(TelegramBot, "current"))


@router.post("/bot/check")
def check_bot(_admin: User = Depends(require_admin), db: Session = Depends(get_db),
              client: TelegramClient = Depends(get_telegram_client)) -> dict[str, str | bool]:
    bot = db.get(TelegramBot, "current")
    if bot is None:
        return bot_state(None)
    try:
        identity = client.verify(bot.token)
    except TelegramUnavailable:
        return {**bot_state(bot), "connected": False}
    return {**bot_state(bot), "connected": identity["id"] == bot.bot_id}


@router.post("/bot")
def connect_bot(payload: TokenInput, _admin: User = Depends(require_admin),
                db: Session = Depends(get_db), client: TelegramClient = Depends(get_telegram_client)) -> dict[str, str | bool]:
    if re.fullmatch(r"\d+:[A-Za-z0-9_-]{8,}", payload.token) is None:
        raise HTTPException(422, "Token Telegram không hợp lệ")
    try:
        identity = client.verify(payload.token)
        secret = secrets.token_urlsafe(32)
        client.set_webhook(payload.token, f"{settings.telegram_webhook_base_url.rstrip('/')}/api/telegram-reminder/webhook", secret)
    except TelegramUnavailable:
        raise HTTPException(422, "Không xác thực hoặc kết nối được bot Telegram") from None
    bot = db.get(TelegramBot, "current")
    if bot is None:
        bot = TelegramBot(key="current", bot_id=identity["id"], name=identity["name"],
                          username=identity["username"], token=payload.token, webhook_secret=secret)
        db.add(bot)
    else:
        if bot.bot_id != identity["id"]:
            for recipient in db.scalars(select(TelegramRecipient)).all():
                db.delete(recipient)
            set_channel_enabled(db, "telegram", False, now_vietnam(), commit=False)
        bot.bot_id = identity["id"]
        bot.name = identity["name"]
        bot.username = identity["username"]
        bot.token = payload.token
        bot.webhook_secret = secret
    db.commit()
    return bot_state(bot)


@router.post("/webhook")
def webhook(update: dict[str, object], x_telegram_bot_api_secret_token: str = Header(default=""),
            db: Session = Depends(get_db), client: TelegramClient = Depends(get_telegram_client)) -> dict[str, bool]:
    bot = db.get(TelegramBot, "current")
    if bot is None or not secrets.compare_digest(x_telegram_bot_api_secret_token, bot.webhook_secret):
        raise HTTPException(403, "Invalid webhook secret")
    message = update.get("message")
    if not isinstance(message, dict) or str(message.get("text", "")).partition(" ")[0] not in {"/start", f"/start@{bot.username}"}:
        return {"ok": True}
    chat = message.get("chat")
    sender = message.get("from")
    if not isinstance(chat, dict) or not isinstance(sender, dict) or chat.get("type") != "private":
        return {"ok": True}
    user_id = str(sender.get("id", ""))
    chat_id = str(chat.get("id", ""))
    if not user_id.isdigit() or not chat_id.lstrip("-").isdigit():
        return {"ok": True}
    name = " ".join(str(sender.get(part, "")).strip() for part in ("first_name", "last_name")).strip()[:150]
    recipient = db.get(TelegramRecipient, user_id)
    if recipient is None:
        recipient = TelegramRecipient(user_id=user_id, chat_id=chat_id, name=name or user_id,
                                      username=str(sender.get("username", ""))[:100], selected=False)
        db.add(recipient)
    else:
        recipient.chat_id = chat_id
        recipient.name = name or user_id
        recipient.username = str(sender.get("username", ""))[:100]
    db.commit()
    try:
        client.send(bot.token, chat_id, "Đã ghi nhận đăng ký. Vui lòng chờ admin chọn bạn vào danh sách HR nhận thông báo.")
    except TelegramUnavailable:
        raise HTTPException(503, "Không gửi được xác nhận đăng ký Telegram") from None
    return {"ok": True}


def person_data(person: TelegramRecipient) -> dict[str, str | bool]:
    return {"id": person.user_id, "name": person.name, "username": person.username,
            "selected": person.selected}


@router.get("/recipients")
def recipients(q: str = Query(default="", max_length=100), _admin: User = Depends(require_admin),
               db: Session = Depends(get_db)) -> list[dict[str, str | bool]]:
    term = q.strip().casefold()
    rows = db.scalars(select(TelegramRecipient).order_by(TelegramRecipient.name)).all()
    return [person_data(row) for row in rows if term in f"{row.name} {row.username} {row.user_id}".casefold()]


@router.put("/recipients")
def select_recipients(payload: Selection, _admin: User = Depends(require_admin),
                      db: Session = Depends(get_db)) -> list[dict[str, str | bool]]:
    ids = set(payload.ids)
    rows = db.scalars(select(TelegramRecipient)).all()
    if ids - {row.user_id for row in rows}:
        raise HTTPException(422, "Chỉ chọn người đã Start bot")
    for row in rows:
        if row.user_id in ids and not row.selected:
            row.selected_at = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
        row.selected = row.user_id in ids
    db.commit()
    return recipients(q="", _admin=_admin, db=db)


@router.post("/test-send", response_model=TestSendResponse)
def send_test(payload: TestInput, _admin: User = Depends(require_admin),
              db: Session = Depends(get_db), client: TelegramClient = Depends(get_telegram_client)) -> TestSendResponse:
    bot = db.get(TelegramBot, "current")
    person = db.get(TelegramRecipient, payload.id)
    if bot is None or person is None or not person.selected:
        raise HTTPException(404, "Người nhận Telegram chưa được chọn")
    results: list[TestMessageResult] = []
    messages: tuple[tuple[Literal["PRE", "CUTOFF"], str], ...] = (
        ("PRE", message_for(db, now_vietnam().date())), ("CUTOFF", MESSAGE),
    )
    for message_type, content in messages:
        status: Literal["SENT", "FAILED"] = "SENT"
        error = ""
        try:
            client.send(bot.token, person.chat_id, content)
        except TelegramUnavailable:
            status, error = "FAILED", "Không gửi được tin Telegram"
        db.add(TelegramDeliveryLog(bot_id=bot.bot_id, user_id=person.user_id, name=person.name,
                                   status=status, error=error, message_type=message_type))
        db.commit()
        results.append(TestMessageResult(message_type=message_type, status=status, error=error))
    return TestSendResponse(status="SENT" if all(result.status == "SENT" for result in results) else "FAILED",
                            results=results)


@router.get("/deliveries")
def deliveries(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict[str, str]]:
    rows = db.scalars(select(TelegramDeliveryLog).order_by(TelegramDeliveryLog.created_at.desc(),
                                                            TelegramDeliveryLog.id.desc()).limit(30)).all()
    return [{"id": row.user_id, "bot_id": row.bot_id, "name": row.name, "status": row.status,
             "error": row.error, "message_type": row.message_type,
             "created_at": row.created_at.isoformat() + "Z"} for row in rows]


@router.get("/enabled")
def get_enabled(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str | bool | None]:
    day = now_vietnam().date()
    current = channel_enabled(db, "telegram", day)
    pending = pending_enabled(db, "telegram", day)
    return {"enabled": current, "effective_date": day.isoformat(), "pending_enabled": pending}


@router.put("/enabled")
def put_enabled(payload: EnabledInput, _admin: User = Depends(require_admin),
                db: Session = Depends(get_db)) -> dict[str, str | bool]:
    if payload.enabled and db.get(TelegramBot, "current") is None:
        raise HTTPException(422, "Hãy liên kết bot Telegram trước")
    day = set_channel_enabled(db, "telegram", payload.enabled, now_vietnam())
    return {"enabled": payload.enabled, "effective_date": day.isoformat()}


@router.get("/daily")
def get_daily(date: date, _admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict[str, str]]:
    return daily_results(db, date)


@router.post("/run-due")
def run_due_now(_admin: User = Depends(require_admin), db: Session = Depends(get_db),
                client: TelegramClient = Depends(get_telegram_client)) -> dict[str, str | bool]:
    return run_due(db, client)
