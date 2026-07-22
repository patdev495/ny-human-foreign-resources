"""
Migration: create travel_records table.
If foreign_employees has entry_date / expected_exit_date / actual_exit_date data,
migrate each employee's dates as the first TravelRecord row.
"""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.database import engine, Base
from features.hr_foreign.models import TravelRecord, ForeignEmployee  # registers tables
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)


def migrate() -> None:
    # 1. Create travel_records table (idempotent via checkfirst)
    Base.metadata.create_all(bind=engine, tables=[TravelRecord.__table__], checkfirst=True)
    print("[OK] Table travel_records ensured.")

    # 2. Migrate existing date fields from ForeignEmployee → TravelRecord
    db = Session()
    try:
        employees = (
            db.query(ForeignEmployee)
            .filter(ForeignEmployee.entry_date.isnot(None))
            .all()
        )
        migrated = 0
        for emp in employees:
            # Only migrate if no travel record exists yet for this employee
            existing = db.query(TravelRecord).filter(TravelRecord.employee_id == emp.id).first()
            if existing:
                continue
            record = TravelRecord(
                employee_id=emp.id,
                entry_date=emp.entry_date,
                expected_exit_date=emp.expected_exit_date,
                actual_exit_date=emp.actual_exit_date,
            )
            db.add(record)
            migrated += 1

        db.commit()
        print(f"[OK] Migrated {migrated} employee(s) with existing travel dates.")
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
