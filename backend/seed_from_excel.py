# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import openpyxl
import os
import sys
import re
from sqlalchemy.orm import Session

sys.stdout.reconfigure(encoding='utf-8')

from core.database import SessionLocal, engine, Base
from features.hr_foreign import models, service

def parse_date(val):
    if isinstance(val, datetime.datetime):
        return val.date()
    if isinstance(val, datetime.date):
        return val
    if isinstance(val, int) or isinstance(val, float):
        try:
            return datetime.date(1899, 12, 30) + datetime.timedelta(days=int(val))
        except Exception:
            return None
    if isinstance(val, str):
        val = val.strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
            try:
                return datetime.datetime.strptime(val, fmt).date()
            except ValueError:
                pass
    return None

ROLE_KEYWORDS = ["PHÓ TỔNG", "CHỦ TỊCH", "GIÁM ĐỐC", "QUẢN LÝ", "TRƯỞNG PHÒNG", "CON TRAI", "SẢN XUẤT", "KỸ THUẬT"]

def parse_name_and_role(raw_name):
    raw_str = str(raw_name).strip().replace('\t', '')
    parens = re.findall(r'\((.*?)\)', raw_str)
    clean_name = re.sub(r'\s*\([^)]*\)', '', raw_str).strip()
    
    if " - " in clean_name:
        parts = clean_name.split(" - ")
        clean_name = parts[0].strip()

    extracted_role = None
    extracted_notes = []
    
    for p in parens:
        p_clean = p.strip()
        p_upper = p_clean.upper()
        if any(k in p_upper for k in ROLE_KEYWORDS):
            extracted_role = p_clean
        else:
            if p_upper not in ["CỐ ĐỊNH"]:
                extracted_notes.append(p_clean)

    if extracted_role:
        er_up = extracted_role.upper()
        if "PHÓ TỔNG" in er_up:
            extracted_role = "Ph\u00f3 T\u1ed5ng"
        elif "CHỦ TỊCH" in er_up and "CON TRAI" in er_up:
            extracted_role = "Con trai Ch\u1ee7 t\u1ecbch"
        elif "CHỦ TỊCH" in er_up:
            extracted_role = "Ch\u1ee7 t\u1ecbch"

    return clean_name, extracted_role, " | ".join(extracted_notes) if extracted_notes else None

def build_nationality_map(xe_path):
    nat_map = {}
    if not os.path.exists(xe_path):
        return nat_map

    try:
        wb = openpyxl.load_workbook(xe_path, data_only=True)
        for sheetname in ["NNN04,2026 ", "NNN05,2026", "NNN06,2026", "NNN07,2026"]:
            if sheetname in wb.sheetnames:
                sheet = wb[sheetname]
                for row_idx, row in enumerate(sheet.iter_rows(values_only=True), start=1):
                    if row_idx < 15:
                        continue
                    name_val = row[1]
                    nat_val = row[3]
                    if name_val and str(name_val).strip() and nat_val and str(nat_val).strip():
                        clean_name = str(name_val).strip().replace('\t', '').upper()
                        clean_nat = str(nat_val).strip()
                        if "ĐÀI LOAN" in clean_nat.upper():
                            clean_nat = "\u0110\u00e0\u0069\u0020\u004c\u006f\u0061\u006e"
                        elif "TRUNG QUỐC" in clean_nat.upper():
                            clean_nat = "\u0054\u0072\u0075\u006e\u0067\u0020\u0051\u0075\u1ed1\u0063"

                        base_name = clean_name.split('(')[0].strip()
                        nat_map[clean_name] = clean_nat
                        nat_map[base_name] = clean_nat
    except Exception as e:
        print(f"Warning building nationality map: {e}")

    return nat_map

def update_stay_notes_span(existing_notes: str | None, new_note: str | None) -> str | None:
    if not new_note or not str(new_note).strip():
        return existing_notes
    note_str = str(new_note).strip()
    if not existing_notes:
        return note_str
    
    # Check if note matches "Tháng XX/YYYY"
    m_old = re.findall(r"Th\u00e1ng\s+(\d{2}/\d{4})", existing_notes)
    m_new = re.findall(r"Th\u00e1ng\s+(\d{2}/\d{4})", note_str)
    if m_old and m_new:
        first_m = m_old[0]
        last_m = m_new[0]
        if first_m != last_m:
            return f"Th\u00e1ng {first_m} - Th\u00e1ng {last_m}"
    return existing_notes

def seed():
    print("Resetting Database Tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    ktx_path = os.path.join("..", "data", "2026 SẮP PHÒNG KTX .xlsx")
    if not os.path.exists(ktx_path):
        ktx_path = os.path.join("data", "2026 SẮP PHÒNG KTX .xlsx")

    xe_path = os.path.join("..", "data", "2026.4 BẢNG THEO DÕI XE HY .xlsx")
    if not os.path.exists(xe_path):
        xe_path = os.path.join("data", "2026.4 BẢNG THEO DÕI XE HY .xlsx")

    if not os.path.exists(ktx_path):
        print(f"Error: Could not find Excel file at {ktx_path}")
        return

    print("Building nationality mapping from 2026.4 BẢNG THEO DÕI XE HY .xlsx...")
    nat_map = build_nationality_map(xe_path)

    print(f"Loading KTX Excel file: {ktx_path}")
    wb = openpyxl.load_workbook(ktx_path, data_only=True)
    sheet = wb["2026"]

    service.seed_default_meal_prices(db)

    rooms_map = {}
    emp_count = 0
    stay_count = 0
    visa_count = 0
    tt_count = 0

    current_room_number = None

    for row_idx, row in enumerate(sheet.iter_rows(values_only=True), start=1):
        if row_idx < 7:
            continue

        room_val = row[0]
        bed_val = row[1]
        name_latin = row[2]
        name_chinese = row[3]
        gender_raw = row[4]
        visa_type_raw = row[6]
        entry_date_raw = row[7]
        visa_expiry_raw = row[8]
        tam_tru_reg_raw = row[9]
        tam_tru_expiry_raw = row[10]
        exit_date_raw = row[11]
        notes_raw = row[12]

        if room_val is not None and str(room_val).strip():
            current_room_number = str(room_val).strip()

        if not name_latin or not str(name_latin).strip():
            continue

        raw_lat_str = str(name_latin).strip()
        if "PHÒNG ĂN" in raw_lat_str.upper() or "PHÒNG THỂ DỤC" in raw_lat_str.upper():
            continue

        clean_name, extracted_role, extra_notes = parse_name_and_role(name_latin)
        name_chi_clean = str(name_chinese).strip().replace('\t', '') if name_chinese else None

        # Get or create Room
        room_obj = None
        if current_room_number:
            if current_room_number not in rooms_map:
                room_db = db.query(models.Room).filter(models.Room.room_number == current_room_number).first()
                if not room_db:
                    room_db = models.Room(room_number=current_room_number)
                    db.add(room_db)
                    db.flush()
                rooms_map[current_room_number] = room_db
            room_obj = rooms_map[current_room_number]

        gender = "Nam"
        if gender_raw and "N\u1eff" in str(gender_raw):
            gender = "N\u1eff"

        emp_upper_name = clean_name.upper()
        emp_base_name = emp_upper_name.split('(')[0].strip()
        matched_nat = nat_map.get(emp_upper_name) or nat_map.get(emp_base_name)

        exit_date = parse_date(exit_date_raw)
        entry_date = parse_date(entry_date_raw) or datetime.date(2025, 12, 1)
        visa_expiry = parse_date(visa_expiry_raw) or datetime.date(2026, 12, 31)
        tt_reg = parse_date(tam_tru_reg_raw) or entry_date
        tt_expiry = parse_date(tam_tru_expiry_raw) or visa_expiry

        # Check or Create Employee
        emp = db.query(models.ForeignEmployee).filter(models.ForeignEmployee.name_latin == clean_name).first()
        if not emp:
            emp = models.ForeignEmployee(
                name_latin=clean_name,
                name_chinese=name_chi_clean,
                gender=gender,
                nationality=matched_nat,
                passport_number=None,
                passport_expiry=None,
                required_exit_date=exit_date,
                department=None,
                role=extracted_role,
                notes=extra_notes or (str(notes_raw).strip() if notes_raw else None),
            )
            db.add(emp)
            db.flush()
            emp_count += 1
        else:
            if extracted_role and not emp.role:
                emp.role = extracted_role
            if exit_date:
                emp.required_exit_date = exit_date

        bed_clean = str(bed_val).strip() if bed_val else None

        # Check if an active stay exists for the SAME trip sang Việt Nam (same entry_date, room, bed)
        existing_stay = (
            db.query(models.Stay)
            .filter(
                models.Stay.employee_id == emp.id,
                models.Stay.accommodation_type == "KTX",
                models.Stay.room_id == (room_obj.id if room_obj else None),
                models.Stay.bed_location == bed_clean,
                models.Stay.start_date == entry_date,
                models.Stay.end_date.is_(None),
            )
            .first()
        )

        if existing_stay:
            # Update month span note (e.g., "Tháng 02/2026 - Tháng 04/2026")
            existing_stay.notes = update_stay_notes_span(existing_stay.notes, notes_raw)
        else:
            # If new trip entry date or room move, close previous active stay
            previous_active_stay = (
                db.query(models.Stay)
                .filter(
                    models.Stay.employee_id == emp.id,
                    models.Stay.end_date.is_(None),
                )
                .first()
            )
            if previous_active_stay:
                previous_active_stay.end_date = entry_date

            # Create new Stay
            existing_stay = models.Stay(
                employee_id=emp.id,
                accommodation_type="KTX",
                room_id=room_obj.id if room_obj else None,
                bed_location=bed_clean,
                stay_type="CO_DINH",
                has_meals=True,
                start_date=entry_date,
                end_date=None,
                notes=str(notes_raw).strip() if notes_raw else None,
            )
            db.add(existing_stay)
            db.flush()
            stay_count += 1

        # Check if Visa already exists under this trip Stay
        v_type_clean = str(visa_type_raw).strip() if visa_type_raw else "DN1"
        existing_visa = (
            db.query(models.Visa)
            .filter(
                models.Visa.stay_id == existing_stay.id,
                models.Visa.visa_type == v_type_clean,
                models.Visa.entry_date == entry_date,
                models.Visa.expiry_date == visa_expiry,
            )
            .first()
        )
        if not existing_visa:
            visa = models.Visa(
                stay_id=existing_stay.id,
                visa_type=v_type_clean,
                entry_date=entry_date,
                expiry_date=visa_expiry,
                notes=None,
            )
            db.add(visa)
            visa_count += 1

        # Check if TamTru already exists under this trip Stay
        existing_tt = (
            db.query(models.TamTru)
            .filter(
                models.TamTru.stay_id == existing_stay.id,
                models.TamTru.registration_date == tt_reg,
                models.TamTru.expiry_date == tt_expiry,
            )
            .first()
        )
        if not existing_tt:
            tam_tru = models.TamTru(
                stay_id=existing_stay.id,
                registration_date=tt_reg,
                expiry_date=tt_expiry,
                notes=None,
            )
            db.add(tam_tru)
            tt_count += 1

    db.commit()
    db.close()
    print("Database reset & re-seeded with UPDATED MONTH SPAN NOTES FOR CONTINUOUS STAYS!")
    print(f"Rooms: {len(rooms_map)}")
    print(f"Employees: {emp_count}")
    print(f"Total Trip Stays: {stay_count}")
    print(f"Total Visas: {visa_count}")
    print(f"Total Tam Trus: {tt_count}")

if __name__ == "__main__":
    seed()
