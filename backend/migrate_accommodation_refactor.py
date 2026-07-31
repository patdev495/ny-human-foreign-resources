"""Migration script for Accommodation & Stay refactoring:
1. Copy non-null required_exit_date to expected_exit_date where expected_exit_date IS NULL.
2. Drop required_exit_date column from foreign_employees.
3. Add invoice_amount column to stays table.
"""
from sqlalchemy import text
from core.database import engine

def migrate():
    with engine.begin() as conn:
        print("Migrating required_exit_date to expected_exit_date...")
        conn.execute(text("""
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('foreign_employees') AND name = 'required_exit_date')
            BEGIN
                UPDATE foreign_employees
                SET expected_exit_date = required_exit_date
                WHERE expected_exit_date IS NULL AND required_exit_date IS NOT NULL;

                ALTER TABLE foreign_employees DROP COLUMN required_exit_date;
                PRINT 'Dropped required_exit_date column.';
            END
        """))

        print("Adding invoice_amount column to stays table...")
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('stays') AND name = 'invoice_amount')
            BEGIN
                ALTER TABLE stays ADD invoice_amount FLOAT NULL;
                PRINT 'Added invoice_amount column to stays.';
            END
        """))
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
