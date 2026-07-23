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
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'foreign_employees') AND name = N'expected_entry_date') "
                    "ALTER TABLE foreign_employees ADD expected_entry_date DATE NULL;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'travel_records') AND name = N'expected_entry_date') "
                    "ALTER TABLE travel_records ADD expected_entry_date DATE NULL;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'foreign_employees') AND name = N'work_type') "
                    "ALTER TABLE foreign_employees ADD work_type NVARCHAR(50) NOT NULL DEFAULT N'CO_DINH';"
                )
            )
    except Exception:
        # Ignore if non-SQL Server dialect or table doesn't exist yet
        pass

    if engine.dialect.name == "sqlite":
        try:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            with engine.begin() as conn:
                emp_cols = [c["name"] for c in inspector.get_columns("foreign_employees")]
                if "expected_entry_date" not in emp_cols:
                    conn.execute(text("ALTER TABLE foreign_employees ADD COLUMN expected_entry_date DATE;"))
                if "work_type" not in emp_cols:
                    conn.execute(text("ALTER TABLE foreign_employees ADD COLUMN work_type VARCHAR(50) DEFAULT 'CO_DINH';"))
                tr_cols = [c["name"] for c in inspector.get_columns("travel_records")]
                if "expected_entry_date" not in tr_cols:
                    conn.execute(text("ALTER TABLE travel_records ADD COLUMN expected_entry_date DATE;"))
        except Exception:
            pass



def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
