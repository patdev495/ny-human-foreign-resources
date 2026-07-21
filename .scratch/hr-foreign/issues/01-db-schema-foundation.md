---
Status: completed
Feature: hr-foreign
Issue: 01
---

# Database Schema & Models Foundation for HR Foreign

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Tạo hạ tầng cơ sở dữ liệu và SQLAlchemy ORM models cho module `hr-foreign` (Quản lý nhân sự nước ngoài) tương thích với SQL Server 2008 R2.

Bao gồm 8 bảng dữ liệu:
1. `foreign_employees` (id INT IDENTITY PK, name_latin, name_chinese, gender, nationality, date_of_birth, passport_number, passport_expiry, phone, department, role, notes)
2. `rooms` (id INT IDENTITY PK, room_number UNIQUE, notes)
3. `stays` (id INT IDENTITY PK, employee_id FK, accommodation_type [KTX|HOTEL], room_id FK nullable, stay_type [CO_DINH|CONG_TAC], has_meals BIT, start_date, end_date nullable, notes)
4. `visas` (id INT IDENTITY PK, stay_id FK, visa_type, entry_date, expiry_date, notes)
5. `tam_trus` (id INT IDENTITY PK, stay_id FK, registration_date, expiry_date, notes)
6. `meal_absences` (id INT IDENTITY PK, stay_id FK, absence_date DATE, reason)
7. `event_days` (id INT IDENTITY PK, event_date DATE UNIQUE, event_type [CHUT_TICH_SANG], notes)
8. `meal_price_configs` (id INT IDENTITY PK, day_type [NORMAL|PRESIDENT_VISIT], price_per_meal DECIMAL, effective_from DATE)

## Acceptance criteria

- [ ] Tất cả ORM models được định nghĩa đầy đủ type annotations trong `backend/features/hr_foreign/models.py`.
- [ ] Bảng CSDL được tạo thành công trên Microsoft SQL Server mà không dùng tính năng không hỗ trợ (không `SEQUENCE`, không `JSON_VALUE`, không `OUTPUT INSERTED`).
- [ ] Có script/seed data mẫu khởi tạo danh mục đơn giá suất ăn mặc định (35.000 VNĐ cho NORMAL, 50.000 VNĐ cho PRESIDENT_VISIT).

## Blocked by

None - can start immediately
