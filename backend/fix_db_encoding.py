# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
sys.stdout.reconfigure(encoding='utf-8')

from core.database import SessionLocal
from features.hr_foreign.models import ForeignEmployee, Stay, Visa, TamTru

def fix_encoding():
    db = SessionLocal()
    
    # 1. Fix ForeignEmployees
    emps = db.query(ForeignEmployee).all()
    print(f"Fixing {len(emps)} employees...")
    for emp in emps:
        if "Trung Qu" in emp.nationality:
            emp.nationality = "Trung Quốc"
        if "S?n xu?t" in emp.department or "thu?t" in emp.department or "B?" in emp.department:
            emp.department = "Bộ phận Sản xuất/Kỹ thuật"
        if emp.notes and "?" in emp.notes:
            emp.notes = emp.notes.replace("?", "")

    # 2. Fix Stays
    stays = db.query(Stay).all()
    print(f"Fixing {len(stays)} stays...")
    for stay in stays:
        if stay.notes and ("Đ?rt" in stay.notes or "?" in stay.notes):
            stay.notes = "Đợt lưu trú KTX"

    # 3. Fix Visas
    visas = db.query(Visa).all()
    print(f"Fixing {len(visas)} visas...")
    for visa in visas:
        if visa.notes and ("nh?p" in visa.notes or "?" in visa.notes):
            visa.notes = "Visa nhập từ Excel KTX"

    # 4. Fix TamTrus
    tam_trus = db.query(TamTru).all()
    print(f"Fixing {len(tam_trus)} tam trus...")
    for tt in tam_trus:
        if tt.notes and ("nh?p" in tt.notes or "?" in tt.notes):
            tt.notes = "Tạm trú nhập từ Excel KTX"

    db.commit()
    db.close()
    print("Database encoding fix completed successfully!")

if __name__ == "__main__":
    fix_encoding()
