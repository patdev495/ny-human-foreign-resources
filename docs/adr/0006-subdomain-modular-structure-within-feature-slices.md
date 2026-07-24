# 6. Cấu trúc Mô-đun hóa Sub-domain trong Feature Slices phục vụ Giới hạn Dòng code (< 400 dòng)

Date: 2026-07-24

## Status

Accepted

## Context

Dung lượng codebase tăng nhanh khiến một số file trong feature `hr_foreign` phát triển quá lớn (ví dụ: `service.py` đạt 1.530 dòng, `router.py` đạt 859 dòng, `schemas.py` đạt 584 dòng). 
Theo định hướng chất lượng codebase, không file nào được phép vượt quá khoảng 400 dòng để bảo đảm tính bảo trì, khả năng đọc và kiểm thử.

Tuy nhiên, `AGENTS.md` quy định dự án phải được tổ chức theo feature slice (`features/hr_foreign/`). Việc tách nhỏ các file lớn cần tuân thủ ranh giới feature slice mà không làm vi phạm nguyên tắc thiết kế chung.

## Decision

Thống nhất áp dụng mô hình **Sub-domain Modular Structure with Facade Re-export** bên trong feature slice đối với các file vượt ngưỡng 400 dòng:

1. **Backend Package Splitting**:
   - `backend/features/hr_foreign/service.py` chuyển thành gói `services/` chứa các sub-domain: `employee_service.py`, `stay_service.py`, `meal_service.py`, `legal_doc_service.py`, `accommodation_service.py`.
   - `backend/features/hr_foreign/router.py` chuyển thành gói `routers/` tương ứng: `employee_router.py`, `stay_router.py`, `meal_router.py`, `legal_doc_router.py`, `accommodation_router.py`.
   - `backend/features/hr_foreign/schemas.py` chuyển thành gói `schemas/` tương ứng: `employee_schemas.py`, `stay_schemas.py`, `meal_schemas.py`, `legal_doc_schemas.py`, `accommodation_schemas.py`.

2. **Frontend Modular Splitting**:
   - `frontend/src/features/hr-foreign/api.ts` chuyển thành thư mục `api/` (`employeeApi.ts`, `stayApi.ts`, `mealApi.ts`, `accommodationApi.ts`) kèm `index.ts` re-export.
   - `frontend/src/features/hr-foreign/types.ts` chuyển thành thư mục `types/` (`employeeTypes.ts`, `stayTypes.ts`, `mealTypes.ts`, `accommodationTypes.ts`) kèm `index.ts` re-export.
   - Các UI Components vượt 400 dòng (`MealConfigAndEvents`, `DailyPresenceReport`, `EmployeeProfileModal`, `MealForecastBoard`, `RoomOccupancyBoard`, `CheckInModal`, `EmployeeList`, `StayList`, `App`) được chuyển thành thư mục component chuyên biệt chứa `index.tsx`, custom hooks (`use*.ts`), và các sub-component UI độc lập.

3. **Facade Re-export (Giữ nguyên API Contract & Import)**:
   - Các file root `service.py`, `router.py`, `schemas.py`, `api.ts`, `types.ts` (hoặc `index.ts`) đóng vai trò Facade re-export tất cả các symbol chính từ các sub-module.
   - Nhờ đó, `main.py`, các caller bên ngoài hay các component tiêu thụ không bị gãy import path cũ.

4. **Phased Execution & Continuous Verification**:
   - Tách làm 4 Pha độc lập: (1) Backend Core Schemas & Services, (2) Backend Routers & Engines, (3) Frontend Types & API, (4) Frontend UI Components.
   - Sau mỗi pha đều tiến hành nghiệm thu tự động: `uv run pytest` đối với Backend (45 test cases) và `npx tsc -b && vite build` đối với Frontend.

## Consequences

- Tất cả các file trong codebase đều tuân thủ hạn mức dòng code tối đa ~400 dòng.
- Phân tách rõ ràng giữa Business Logic (Custom Hooks / Services) và Presentation (UI Sub-components / Routers).
- Giữ vững kiến trúc feature slice hiện tại của dự án.
- Đảm bảo 100% không xảy ra lỗi regression trong suốt quá trình tái cấu trúc.


