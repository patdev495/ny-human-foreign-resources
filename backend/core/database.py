from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from core.config import settings

engine = create_engine(
    settings.database_url,
    # pool_pre_ping keeps connections alive across network interruptions
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from sqlalchemy import text
    from features.hr_foreign import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stays') AND name = N'hotel_id') "
                    "ALTER TABLE stays ADD hotel_id INT NULL FOREIGN KEY REFERENCES hotels(id);"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stays') AND name = N'hotel_room_number') "
                    "ALTER TABLE stays ADD hotel_room_number NVARCHAR(100) NULL;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stays') AND name = N'expected_end_date') "
                    "ALTER TABLE stays ADD expected_end_date DATE NULL;"
                )
            )
    except Exception:
        # Ignore if non-SQL Server dialect or table doesn't exist yet
        pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
