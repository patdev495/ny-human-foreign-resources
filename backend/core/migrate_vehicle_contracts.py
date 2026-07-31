from __future__ import annotations

from sqlalchemy import inspect, text
from core.database import engine

def migrate_vehicle_contracts() -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if 'monthly_vehicle_contracts' in tables:
        cols = [c['name'] for c in inspector.get_columns('monthly_vehicle_contracts')]
        print('Columns in monthly_vehicle_contracts:', cols)
        with engine.connect() as conn:
            if 'sunday_standard_start_time' not in cols:
                print('Adding column sunday_standard_start_time...')
                conn.execute(text("ALTER TABLE monthly_vehicle_contracts ADD sunday_standard_start_time NVARCHAR(10) NOT NULL DEFAULT '07:30'"))
            if 'sunday_standard_end_time' not in cols:
                print('Adding column sunday_standard_end_time...')
                conn.execute(text("ALTER TABLE monthly_vehicle_contracts ADD sunday_standard_end_time NVARCHAR(10) NOT NULL DEFAULT '18:00'"))
            conn.commit()
            print('DB schema migration completed successfully!')

if __name__ == '__main__':
    migrate_vehicle_contracts()
