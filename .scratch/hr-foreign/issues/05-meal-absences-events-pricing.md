---
Status: completed
Feature: hr-foreign
Issue: 05
---

# Meal Absences, Event Days & Price Config Management (API + UI)

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Xây dựng tính năng quản lý **Ngày vắng ăn (Meal Absence)**, **Ngày Sự kiện (Event Day)** và **Lịch sử Đơn giá Suất ăn (Meal Price Config)**.

- **Backend**:
  - API endpoints CRUD `MealAbsence` theo `stay_id` (ghi nhận ngày nhân sự về nước tạm thời / không ăn).
  - API endpoints CRUD `EventDay` (đánh dấu ngày "Chủ tịch sang").
  - API endpoints CRUD `MealPriceConfig` (cấu hình đơn giá theo loại ngày `NORMAL` và `PRESIDENT_VISIT`, ngày hiệu lực `effective_from`).
- **Frontend**:
  - Giao diện đánh dấu ngày vắng ăn cho nhân sự (chọn ngày hoặc dải ngày vắng).
  - Giao diện quản lý Lịch Ngày sự kiện (Event Calendar).
  - Giao diện cấu hình đơn giá suất ăn và xem lịch sử biến động giá.

## Acceptance criteria

- [ ] Ghi nhận đúng danh sách các ngày vắng ăn của từng đợt Lưu trú.
- [ ] Đánh dấu thành công các Ngày Sự kiện (Chủ tịch sang).
- [ ] Lưu trữ và tra cứu đúng đơn giá suất ăn theo mốc thời gian `effective_from`.

## Blocked by

- `.scratch/hr-foreign/issues/03-stay-management-occupancy.md`
