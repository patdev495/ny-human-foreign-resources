from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from core.database import get_db
from features.auth.models import User, UserSession

COOKIE_NAME = "hr_session"
SESSION_HOURS = 8
PASSWORD_ITERATIONS = 600_000


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations_text, salt_text, digest_text = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_text), int(iterations_text)
        )
        return hmac.compare_digest(digest, bytes.fromhex(digest_text))
    except (ValueError, TypeError):
        return False


def new_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
    db.execute(delete(UserSession).where(UserSession.expires_at <= utc_now()))
    db.add(UserSession(
        token_hash=token_hash,
        user_id=user.id,
        expires_at=utc_now() + timedelta(hours=SESSION_HOURS),
    ))
    db.commit()
    return token


def get_session(db: Session, token: str | None) -> UserSession | None:
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    session = db.get(UserSession, token_hash)
    if session is None or session.expires_at <= utc_now() or not session.user.is_active:
        return None
    return session


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    session = get_session(db, request.cookies.get(COOKIE_NAME))
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return session.user


def require_admin(user: User = Depends(require_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def ensure_last_admin_remains(db: Session, target: User, new_admin: bool, new_active: bool) -> None:
    if target.is_admin and target.is_active and (not new_admin or not new_active):
        other_admin = db.scalar(select(User.id).where(
            User.id != target.id, User.is_admin.is_(True), User.is_active.is_(True)
        ))
        if other_admin is None:
            raise HTTPException(status_code=409, detail="Cannot disable the last active admin")
