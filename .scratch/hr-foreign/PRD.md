# PRD: Quản lý Nhân sự Nước ngoài (hr-foreign)

Status: ready-for-agent
Feature: hr-foreign

## Problem Statement

Hiện nay, các thông tin liên quan đến nhân sự nước ngoài (lưu trú KTX/khách sạn, giấy tờ pháp lý Visa/Tạm trú, quá trình công tác, theo dõi suất ăn) đang được theo dõi thủ công bằng các file Excel riêng lẻ. Việc này gây ra khó khăn trong việc:
- Quản lý hồ sơ và lịch sử các đợt sang Việt Nam (Lưu trú) của từng nhân sự.
- Theo dõi thời hạn Visa, Tạm trú và cảnh báo gia hạn/hết hạn.
- Tính toán chính xác chi phí ăn uống KTX theo khoảng thời gian thực tế, tính cả các ngày vắng mặt (về nước tạm thời) và các biến động đơn giá theo sự kiện (ngày Chủ tịch sang).
- Lọc, tìm kiếm và xuất báo cáo đầy đủ thông tin nhân sự nước ngoài.

## Solution

Xây dựng module quản lý nhân sự nước ngoài (`hr-foreign`) nằm trong hệ thống NY Human Resources System bao gồm Backend FastAPI và Frontend React (TypeScript + Tailwind CSS).

Hệ thống cho phép:
1. Quản lý hồ sơ nhân sự nước ngoài với mã định danh tự tăng.
2. Quản lý các đợt Lưu trú (Stay) của nhân sự (phân loại KTX hoặc Khách sạn, loại hình Cố định hoặc Công tác, cờ đăng ký ăn uống).
3. Theo dõi lịch sử Visa và Đăng ký tạm trú theo từng đợt Lưu trú, hỗ trợ nhiều lần gia hạn trong cùng một đợt Lưu trú.
4. Quản lý danh mục Phòng KTX (định danh theo số phòng).
5. Ghi nhận các ngày vắng ăn (Meal Absence) của nhân sự trong đợt Lưu trú.
6. Quản lý ngày sự kiện (Event Day - ví dụ: Chủ tịch sang) và cấu hình lịch sử đơn giá suất ăn (Meal Price Config).
7. Xuất báo cáo và truy vấn chi phí suất ăn chính xác theo khoảng ngày (Date Range).

## User Stories

1. As an HR Administrator, I want to create and edit a foreign employee profile with auto-increment ID, Latin name, Chinese name, gender, nationality, date of birth, passport number, passport expiry date, department, role, and notes, so that I can maintain accurate employee master data.
2. As an HR Administrator, I want to search and filter foreign employees by name (Latin/Chinese), passport number, nationality, and department, so that I can quickly find any employee's profile.
3. As an HR Administrator, I want to create a new Stay (Lưu trú) for a foreign employee specifying accommodation type (KTX or Hotel), room assignment (if KTX), stay type (Cố định or Công tác), meal eligibility flag (has_meals), start date, and end date, so that I can track each visit to Vietnam.
4. As an HR Administrator, I want to record multiple Visa entries for a single Stay (including visa type, entry/issue date, expiry date), so that I can handle mid-stay visa extensions without requiring a new Stay entry.
5. As an HR Administrator, I want to record multiple Temporary Residence (Tạm trú) registration records for a single Stay, so that I can track local residency registration and renewals.
6. As an HR Administrator, I want to manage a list of KTX Rooms by room number, so that I can assign employees to valid rooms.
7. As an HR Administrator, I want to view active room occupancy, showing which employees are currently staying in which room.
8. As an HR Administrator, I want to mark specific dates as Meal Absences (Vắng ăn) for an employee during their Stay, so that meals are not charged for days they are temporarily away.
9. As an HR Administrator, I want to flag specific calendar dates as Event Days (e.g. "Chủ tịch sang"), so that higher meal prices are applied on those dates.
10. As an System Administrator, I want to maintain a historical log of meal prices for normal days and event days, so that meal cost calculations remain accurate even when meal prices change in the future.
11. As an HR Manager, I want to generate a meal cost report for any arbitrary date range, aggregating meal counts and total expenses per employee and total KTX, taking into account accommodation type, meal eligibility, meal absences, and event day price rules.
12. As an HR Administrator, I want to view upcoming Visa and Temporary Residence expirations, so that the HR department can complete renewal paperwork on time.

## Implementation Decisions

### Modules & Architecture

- **Backend Feature Module**: Located at `backend/features/hr_foreign/`. Contains FastAPI routers, Pydantic schemas, SQLAlchemy ORM models, and business logic services.
- **Frontend Feature Module**: Located at `frontend/src/features/hr-foreign/`. Contains React views, UI components, custom hooks, typed API client, and TypeScript interfaces mirroring backend schemas.
- **Database Tables**:
  - `foreign_employees`: Primary key `id` (INT IDENTITY). Core personal attributes (`name_latin`, `name_chinese`, `gender`, `nationality`, `date_of_birth`, `passport_number`, `passport_expiry`, `phone`, `department`, `role`, `notes`).
  - `rooms`: Primary key `id`, `room_number` (VARCHAR, UNIQUE), `notes`.
  - `stays`: Primary key `id`, `employee_id` (FK), `accommodation_type` (`KTX` | `HOTEL`), `room_id` (FK, nullable), `stay_type` (`CO_DINH` | `CONG_TAC`), `has_meals` (BIT/BOOLEAN), `start_date`, `end_date` (nullable if ongoing), `notes`.
  - `visas`: Primary key `id`, `stay_id` (FK), `visa_type` (`DN1`, `LĐ2`, `THĂM THÂN`, `ĐT1`, ...), `entry_date`, `expiry_date`, `notes`.
  - `tam_trus`: Primary key `id`, `stay_id` (FK), `registration_date`, `expiry_date`, `notes`.
  - `meal_absences`: Primary key `id`, `stay_id` (FK), `absence_date` (DATE), `reason` (nullable).
  - `event_days`: Primary key `id`, `event_date` (DATE, UNIQUE), `event_type` (`CHUL_TICH_SANG`), `notes`.
  - `meal_price_configs`: Primary key `id`, `day_type` (`NORMAL` | `PRESIDENT_VISIT`), `price_per_meal` (DECIMAL), `effective_from` (DATE).

### Database Compatibility Note (SQL Server 2008 R2)

- Use SQLAlchemy `flush()` + `refresh()` after ORM inserts instead of `OUTPUT INSERTED` / `RETURNING`.
- Use `IDENTITY` columns for auto-increment PKs.
- Avoid `OFFSET ... FETCH` for pagination; use subqueries or `ROW_NUMBER()` if paginating large sets.

### Calculation Engine for Meal Expenses

- A deep service module `MealCalculationService` will handle computing meal costs for a date range `[start, end]`.
- For each day in the range:
  1. Determine day type: Check if `event_days` has an entry for this date (`PRESIDENT_VISIT` vs `NORMAL`).
  2. Resolve price per meal: Query `meal_price_configs` for the latest `effective_from <= date` for that day type. Default fallback: 35,000 VND (NORMAL), 50,000 VND (PRESIDENT_VISIT). Default 2 meals per day.
  3. Identify active stays on this date: `start_date <= date AND (end_date IS NULL OR end_date >= date)`.
  4. Filter eligible stays: `accommodation_type == KTX` AND `has_meals == True`.
  5. Exclude meal absences: Skip stays that have a `meal_absences` entry for this date.
  6. Calculate: Sum total meals and cost per employee and grand total.

## Testing Decisions

- **Test Scope & Strategy**: Tests will focus on core business logic, schema validation, and API contracts.
- **Backend Unit & Integration Tests**:
  - `MealCalculationService` tests: Verify meal calculation logic with normal days, president visit days, meal absence exclusions, hotel stays exclusion, and price config updates across date boundaries.
  - API Integration Tests: Test FastAPI endpoints for Foreign Employee CRUD, Stay management, Visa/Tạm trú extensions, and Meal expense reports.
- **Frontend Type & Component Tests**:
  - Verify TypeScript API interface compatibility with backend schemas.

## Out of Scope

- **Vehicle Dispatch (Điều xe)**: Deferred to a subsequent feature phase.
- **Housekeeping / Dormitory Facility Maintenance Costs**: Out of scope for this PRD.
- **Direct integration with biometric scanners or hardware meal counters**: Out of scope; meal absences are managed manually via UI.

## Further Notes

- Domain glossary definitions are aligned with `CONTEXT.md`.
- All database operations adhere to the SQL Server 2008 R2 environment constraint specified in `AGENTS.md`.
