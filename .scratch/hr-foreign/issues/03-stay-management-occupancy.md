---
Status: completed
Feature: hr-foreign
Issue: 03
---

# Stays Management & KTX Room Occupancy (API + UI)

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Xây dựng tính năng quản lý các đợt **Lưu trú (Stays)** của nhân sự nước ngoài và xem hiện trạng ở tại các phòng KTX.

- **Backend**:
  - API endpoints quản lý Stay: POST create stay, PUT update stay (kết thúc đợt lưu trú / cập nhật ngày về), GET list stays by employee or status.
  - API endpoint GET current room occupancy: trả về danh sách các phòng KTX và danh sách nhân sự đang lưu trú active (`end_date IS NULL OR end_date >= today`) tại mỗi phòng.
- **Frontend**:
  - Form đăng ký đợt Lưu trú mới cho nhân sự (chọn KTX hay Khách sạn, chọn số phòng nếu là KTX, chọn loại hình Cố định/Công tác, chọn cờ có ăn `has_meals`, ngày bắt đầu, ngày kết thúc dự kiến).
  - Trực quan hóa sơ đồ/danh sách Hiện trạng Phòng KTX (xem phòng nào đang có bao nhiêu người ở, danh tính từng người).

## Acceptance criteria

- [ ] Mỗi nhân sự tại một thời điểm chỉ có tối đa 1 đợt Lưu trú đang active.
- [ ] Ghi nhận chính xác thông tin Lưu trú (KTX/Khách sạn, Cố định/Công tác, cờ đăng ký ăn).
- [ ] Trực quan hóa hiện trạng phòng hiển thị chính xác nhân sự đang ở từng phòng.

## Blocked by

- `.scratch/hr-foreign/issues/02-employee-room-crud.md`
