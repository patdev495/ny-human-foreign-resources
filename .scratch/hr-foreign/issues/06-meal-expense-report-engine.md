---
Status: completed
Feature: hr-foreign
Issue: 06
---

# Meal Expense Calculation Engine & Date-Range Report (API + UI)

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Xây dựng module lõi tính toán chi phí suất ăn `MealCalculationService` và màn hình báo cáo tổng hợp chi phí suất ăn KTX theo khoảng thời gian bất kỳ.

- **Backend**:
  - `MealCalculationService`: Nhận `start_date`, `end_date`. Duyệt qua từng ngày trong khoảng thời gian, xác định đơn giá bữa ăn (ngày thường 35k / ngày Chủ tịch sang 50k dựa trên `meal_price_configs` và `event_days`), kiểm tra các đợt Lưu trú hợp lệ (`accommodation_type == KTX` AND `has_meals == True`), loại trừ các ngày có trong `meal_absences`.
  - API endpoint `GET /reports/meal-expenses?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`: Trả về chi tiết tổng số suất ăn & thành tiền từng nhân sự và tổng cộng toàn KTX.
- **Frontend**:
  - Giao diện Báo cáo Chi phí Suất ăn: Bộ chọn khoảng ngày (Date Range Picker), Bảng tổng hợp chi phí từng nhân sự (Số ngày ở KTX, Số ngày ăn, Số bữa, Tổng tiền), Thống kê tổng quan toàn KTX, hỗ trợ Xuất file / In báo cáo.

## Acceptance criteria

- [ ] Unit test cho `MealCalculationService` bao phủ các trường hợp: ngày thường vs ngày Chủ tịch sang, trừ đúng ngày vắng ăn, không tính người ở Khách sạn hoặc cờ `has_meals = False`, áp dụng đúng mốc giá khi thay đổi cấu hình đơn giá.
- [ ] Báo cáo hiển thị chính xác tổng tiền suất ăn theo khoảng ngày chọn ngẫu nhiên.
- [ ] Giao diện trực quan, cho phép lọc và xem chi tiết theo nhân sự.

## Blocked by

- `.scratch/hr-foreign/issues/05-meal-absences-events-pricing.md`
