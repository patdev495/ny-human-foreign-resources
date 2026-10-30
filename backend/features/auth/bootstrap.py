from __future__ import annotations

import getpass

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import engine
from features.auth.models import User, UserSession
from features.auth.security import hash_password


def main() -> None:
    username = input("Initial admin username: ").strip().lower()
    if len(username) < 3 or not all(char.isascii() and (char.isalnum() or char in "._-") for char in username):
        raise ValueError("Username must be at least 3 ASCII letters, digits, dots, underscores or hyphens")
    display_name = input("Display name: ").strip()
    if not display_name:
        raise ValueError("Display name is required")
    password = getpass.getpass("Password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if not password or password != confirmation:
        raise ValueError("Passwords must match and not be empty")

    User.__table__.create(bind=engine, checkfirst=True)
    UserSession.__table__.create(bind=engine, checkfirst=True)
    with Session(engine) as db:
        if db.scalar(select(User.id).where(User.is_admin.is_(True), User.is_active.is_(True))) is not None:
            raise RuntimeError("An active admin already exists")
        if db.scalar(select(User.id).where(User.username == username)) is not None:
            raise RuntimeError("Username already exists")
        db.add(User(
            username=username, display_name=display_name,
            password_hash=hash_password(password), is_admin=True, is_active=True,
        ))
        db.commit()
    print("Initial admin account created")


if __name__ == "__main__":
    main()
