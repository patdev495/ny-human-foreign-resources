# 5. Thống kê & Chốt Suất ăn Hằng ngày theo Bữa (Sáng / Tối)

Date: 2026-07-24

## Status

Accepted

## Context

Trước đây, hệ thống quản lý chi phí ăn uống chỉ hỗ trợ tính toán gộp theo ngày (mặc định 2 bữa/ngày) và ghi nhận vắng ăn nguyên ngày (`absence_date`). 
Trong vận hành thực tế:
1. Nhà bếp cần thông báo số lượng suất ăn cụ thể theo từng **bữa Sáng** và **bữa Tối**.
2. HR cần cơ chế **Chốt suất ăn theo bữa (Meal Session Lock)** để cố định số lượng suất ăn chính thức đã báo với nhà bếp trước khi nhà bếp đi chợ/nấu ăn.
3. Cần khả năng cho phép HR **điều chỉnh thủ công số suất thực chốt** kèm ghi chú lý do (ví dụ: +1 suất do nhân sự ở Khách sạn hoặc khách công tác ăn đột xuất) mà không làm rườm rà dữ liệu lưu trú.
4. Đơn giá bữa ăn mặc định là 30.000 VNĐ / bữa, đồng thời cần hỗ trợ đơn giá tùy chỉnh cho các Ngày đặc biệt (Lễ, Tết, Chủ tịch sang).

## Decision

1. **Cấu hình Đơn giá Mặc định 30.000 VNĐ & Ngày đặc biệt**:
   - Đơn giá mặc định cho ngày bình thường được chuyển thành 30.000 VNĐ / bữa.
   - Bảng `EventDay` hỗ trợ cấu hình Ngày đặc biệt với Đơn giá riêng và Ghi chú mô tả.

2. **Ghi nhận Vắng ăn theo Bữa (`meal_type`)**:
   - Bảng `meal_absences` bổ sung cột `meal_type`: `BREAKFAST` (vắng sáng), `DINNER` (vắng tối), hoặc `ALL_DAY` (vắng cả ngày - mặc định).

3. **Chốt Suất ăn theo Bữa duy nhất 1 lần (`MealSessionLock`)**:
   - Tạo bảng `meal_session_locks` đóng băng số lượng và đơn giá cho từng bữa (`BREAKFAST` / `DINNER`) của mỗi ngày.
   - Ràng buộc duy nhất `(lock_date, meal_session)` đảm bảo mỗi bữa của một ngày chỉ được chốt đúng **1 lần**.
   - Lưu trữ `calculated_meal_count` (số tự động), `final_meal_count` (số thực chốt do HR điều chỉnh), `locked_price_per_meal` (đơn giá chốt), và `notes` (lý do điều chỉnh).

4. **Đối soát Chi phí Tháng theo Dữ liệu Chốt (Snapshot)**:
   - Các bữa ĐÃ CHỐT: Thành tiền = `final_meal_count * locked_price_per_meal`.
   - Các bữa CHƯA CHỐT: Thành tiền = `calculated_meal_count * price_per_meal_hien_tai`.

## Consequences

- **DB Model & Migration**: Thêm cột `meal_type` vào `MealAbsence`, thêm table `MealSessionLock`.
- **Backend API**:
  - `GET /api/hr-foreign/meals/forecast?date=YYYY-MM-DD` (Dự báo suất ăn).
  - `POST /api/hr-foreign/meals/lock` (Chốt bữa sáng / tối).
- **Frontend UI**:
  - `MealForecastBoard.tsx`: Màn hình thống kê suất ăn theo bữa hằng ngày và danh sách bật/tắt vắng ăn.
  - `LockMealSessionModal.tsx`: Modal xác nhận chốt suất ăn với ô nhập số lượng điều chỉnh & ghi chú.
