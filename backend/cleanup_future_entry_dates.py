from __future__ import annotations
import datetime
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.database import SessionLocal
from features.hr_foreign.models import ForeignEmployee, TravelRecord


def main():
    db = SessionLocal()
    today = datetime.date.today()

    # 1. Travel records
    trs = db.query(TravelRecord).filter(TravelRecord.entry_date > today).all()
    print(f"Found {len(trs)} travel records with entry_date > today ({today})")
    for tr in trs:
        print(f"Fixing TravelRecord #{tr.id} emp #{tr.employee_id}: entry_date={tr.entry_date}")
        if not tr.expected_entry_date:
            tr.expected_entry_date = tr.entry_date
        tr.entry_date = None

    # 2. Employees
    emps = db.query(ForeignEmployee).filter(ForeignEmployee.entry_date > today).all()
    print(f"Found {len(emps)} employees with entry_date > today ({today})")
    for emp in emps:
        print(f"Fixing Employee #{emp.id} {emp.name_latin}: entry_date={emp.entry_date}")
        if not emp.expected_entry_date:
            emp.expected_entry_date = emp.entry_date
        emp.entry_date = None

    db.commit()
    db.close()
    print("Cleanup completed successfully!")


if __name__ == "__main__":
    main()
