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
            # Migrate old price_per_meal -> 3 separate price columns
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'foreign_breakfast_price') "
                    "ALTER TABLE meal_price_configs ADD foreign_breakfast_price FLOAT NOT NULL DEFAULT 30000;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'foreign_dinner_price') "
                    "ALTER TABLE meal_price_configs ADD foreign_dinner_price FLOAT NOT NULL DEFAULT 40000;"
                )
            )
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'janitor_meal_price') "
                    "ALTER TABLE meal_price_configs ADD janitor_meal_price FLOAT NOT NULL DEFAULT 25000;"
                )
            )
            # Seed new price columns from old price_per_meal if they are still at default
            conn.execute(
                text(
                    "UPDATE meal_price_configs "
                    "SET foreign_breakfast_price = price_per_meal * 0.75, "
                    "    foreign_dinner_price = price_per_meal, "
                    "    janitor_meal_price = price_per_meal * 0.65 "
                    "WHERE foreign_breakfast_price = 30000 AND foreign_dinner_price = 40000 AND janitor_meal_price = 25000 "
                    "AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_price_configs') AND name = N'price_per_meal');"
                )
            )
            # Add meal_session_locks.session column if missing
            conn.execute(
                text(
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'meal_session_locks') AND name = N'meal_session') "
                    "ALTER TABLE meal_session_locks ADD meal_session NVARCHAR(20) NOT NULL DEFAULT N'BREAKFAST';"
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
                if "foreign_breakfast_price" not in mpc_cols:
                    conn.execute(text("ALTER TABLE meal_price_configs ADD COLUMN foreign_breakfast_price FLOAT NOT NULL DEFAULT 30000;"))
                if "foreign_dinner_price" not in mpc_cols:
                    conn.execute(text("ALTER TABLE meal_price_configs ADD COLUMN foreign_dinner_price FLOAT NOT NULL DEFAULT 40000;"))
                if "janitor_meal_price" not in mpc_cols:
                    conn.execute(text("ALTER TABLE meal_price_configs ADD COLUMN janitor_meal_price FLOAT NOT NULL DEFAULT 25000;"))
        except Exception:
            pass



def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
