from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from features.auth.models import User, UserSession
from features.auth.schemas import (
    LoginRequest, PasswordChange, PasswordReset, UserCreate, UserRead, UserUpdate,
)
from features.auth.security import (
    COOKIE_NAME, SESSION_HOURS, ensure_last_admin_remains, get_session,
    hash_password, new_session, require_admin, require_user, utc_now, verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
admin_router = APIRouter(prefix="/api/auth/users", tags=["User administration"])
INVALID_LOGIN = "Invalid username or password"
DUMMY_HASH = hash_password("no-account-password-placeholder")


@router.post("/login", response_model=UserRead)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    username = payload.username.strip().lower()
    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        verify_password(payload.password, DUMMY_HASH)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_LOGIN)
    if user.locked_until is not None and user.locked_until > utc_now():
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Try again later")
    if not verify_password(payload.password, user.password_hash) or not user.is_active:
        user.failed_logins += 1
        if user.failed_logins >= 10:
            user.locked_until = utc_now() + timedelta(minutes=15)
            user.failed_logins = 0
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_LOGIN)
    user.failed_logins = 0
    user.locked_until = None
    db.commit()
    token = new_session(db, user)
    response.set_cookie(
        COOKIE_NAME, token, max_age=SESSION_HOURS * 3600,
        httponly=True, secure=settings.auth_cookie_secure,
        samesite="strict", path="/",
    )
    return user


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(require_user)) -> User:
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    session = get_session(db, request.cookies.get(COOKIE_NAME))
    if session is not None:
        db.delete(session)
        db.commit()
    response.delete_cookie(COOKIE_NAME, path="/")


@router.post("/change-password", status_code=204)
def change_password(
    payload: PasswordChange, response: Response,
    user: User = Depends(require_user), db: Session = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.execute(delete(UserSession).where(UserSession.user_id == user.id))
    db.commit()
    response.delete_cookie(COOKIE_NAME, path="/")


@admin_router.get("", response_model=list[UserRead])
def list_users(_admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.username)).all())


@admin_router.post("", response_model=UserRead, status_code=201)
def create_user(
    payload: UserCreate, _admin: User = Depends(require_admin), db: Session = Depends(get_db),
) -> User:
    if not payload.display_name.strip():
        raise HTTPException(status_code=422, detail="Display name is required")
    user = User(
        username=payload.username.lower(), display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password), is_admin=payload.is_admin,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists") from exc
    db.refresh(user)
    return user


@admin_router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int, payload: UserUpdate, admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    new_admin = payload.is_admin if payload.is_admin is not None else target.is_admin
    new_active = payload.is_active if payload.is_active is not None else target.is_active
    ensure_last_admin_remains(db, target, new_admin, new_active)
    if target.id == admin.id and (not new_admin or not new_active):
        raise HTTPException(status_code=409, detail="Cannot disable your own admin account")
    if payload.display_name is not None:
        if not payload.display_name.strip():
            raise HTTPException(status_code=422, detail="Display name is required")
        target.display_name = payload.display_name.strip()
    target.is_admin = new_admin
    target.is_active = new_active
    if not new_active:
        db.execute(delete(UserSession).where(UserSession.user_id == user_id))
    db.commit()
    db.refresh(target)
    return target


@admin_router.post("/{user_id}/reset-password", status_code=204)
def reset_password(
    user_id: int, payload: PasswordReset, admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(status_code=409, detail="Use change-password for your own account")
    target.password_hash = hash_password(payload.password)
    target.failed_logins = 0
    target.locked_until = None
    db.execute(delete(UserSession).where(UserSession.user_id == user_id))
    db.commit()
