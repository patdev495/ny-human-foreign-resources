from core.database import engine
from sqlalchemy import text

def migrate():
    with engine.begin() as conn:
        conn.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('foreign_employees') AND name = 'entry_date') ALTER TABLE foreign_employees ADD entry_date DATE NULL;"))
        conn.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('foreign_employees') AND name = 'expected_exit_date') ALTER TABLE foreign_employees ADD expected_exit_date DATE NULL;"))
        conn.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('foreign_employees') AND name = 'actual_exit_date') ALTER TABLE foreign_employees ADD actual_exit_date DATE NULL;"))
    print("Database columns migration completed successfully!")

if __name__ == "__main__":
    migrate()
