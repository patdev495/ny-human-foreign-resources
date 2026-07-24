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
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_absences') AND name = N'meal_type') "
                    "ALTER TABLE meal_absences ADD meal_type NVARCHAR(50) NOT NULL DEFAULT N'ALL_DAY';"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'day_type_name') "
                    "ALTER TABLE meal_price_configs ADD day_type_name NVARCHAR(255) NULL;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'notes') "
                    "ALTER TABLE meal_price_configs ADD notes NVARCHAR(MAX) NULL;"
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
                ma_cols = [c["name"] for c in inspector.get_columns("meal_absences")]
                if "meal_type" not in ma_cols:
                    conn.execute(text("ALTER TABLE meal_absences ADD COLUMN meal_type VARCHAR(50) DEFAULT 'ALL_DAY';"))
                mpc_cols = [c["name"] for c in inspector.get_columns("meal_price_configs")]
                if "day_type_name" not in mpc_cols:
                    conn.execute(text("ALTER TABLE meal_price_configs ADD COLUMN day_type_name VARCHAR(255);"))
                if "notes" not in mpc_cols:
                    conn.execute(text("ALTER TABLE meal_price_configs ADD COLUMN notes TEXT;"))
        except Exception:
            pass



def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
