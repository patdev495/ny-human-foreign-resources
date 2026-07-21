from __future__ import annotations

import sys
sys.stdout.reconfigure(encoding='utf-8')

from core.database import SessionLocal
from features.hr_foreign.models import ForeignEmployee, Stay, Visa, TamTru

TRUNG_QUOC = "\u0054\u0072\u0075\u006e\u0067\u0020\u0051\u0075\u1ed1\u0063"
BO_PHAN_SX_KT = "\u0042\u1ed9\u0020\u0070\u0068\u1ead\u006e\u0020\u0053\u1ea3\u006e\u0020\u0078\u0075\u1ea5\u0074\u002f\u004b\u1ef9\u0020\u0074\u0068\u0075\u1ead\u0074"
DOT_LUU_TRU_KTX = "\u0110\u1edd\u0074\u0020\u006c\u01b0\u0075\u0020\u0074\u0072\u00fa\u0020\u004b\u0054\u0058"
VISA_EXCEL = "\u0056\u0069\u0073\u0061\u0020\u006e\u0068\u1ead\u0070\u0020\u0074\u1edb\u0020\u0045\u0078\u0063\u0065\u006c\u0020\u004b\u0054\u0058"
TAM_TRU_EXCEL = "\u0054\u1ea1\u006d\u0020\u0074\u0072\u00fa\u0020\u006e\u0068\u1ead\u0070\u0020\u0074\u1edb\u0020\u0045\u0078\u0063\u0065\u006c\u0020\u004b\u0054\u0058"

def run():
    db = SessionLocal()

    # Employees
    emps = db.query(ForeignEmployee).all()
    for e in emps:
        e.nationality = TRUNG_QUOC
        e.department = BO_PHAN_SX_KT
        if e.notes and "?" in e.notes:
            e.notes = e.notes.replace("?", "")

    # Stays
    stays = db.query(Stay).all()
    for s in stays:
        s.notes = DOT_LUU_TRU_KTX

    # Visas
    visas = db.query(Visa).all()
    for v in visas:
        v.notes = VISA_EXCEL

    # TamTrus
    tam_trus = db.query(TamTru).all()
    for tt in tam_trus:
        tt.notes = TAM_TRU_EXCEL

    db.commit()
    db.close()
    print("ALL database records updated with pure Unicode escape strings!")

if __name__ == "__main__":
    run()
