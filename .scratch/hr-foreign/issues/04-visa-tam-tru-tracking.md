---
Status: completed
Feature: hr-foreign
Issue: 04
---

# Visa & Temporary Residence Extension History (API + UI)

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Xây dựng tính năng quản lý lịch sử **Visa** và **Đăng ký Tạm trú** gắn theo từng đợt Lưu trú (hỗ trợ trường hợp gia hạn Visa/Tạm trú nhiều lần trong cùng 1 chuyến sang VN).

- **Backend**:
  - API endpoints CRUD Visa theo `stay_id` (`GET /stays/{id}/visas`, `POST /stays/{id}/visas`, `DELETE /visas/{id}`).
  - API endpoints CRUD Tạm trú theo `stay_id` (`GET /stays/{id}/tam-trus`, `POST /stays/{id}/tam-trus`, `DELETE /tam-trus/{id}`).
  - API endpoint GET expiring documents: Tìm các Visa và Tạm trú sắp hết hạn trong vòng N ngày (mặc định 30 ngày).
- **Frontend**:
  - Tab/Section lịch sử Visa và Tạm trú trong chi tiết đợt Lưu trú của nhân sự.
  - Widget / Trang Cảnh báo Giấy tờ sắp Hết hạn (Visa/Tạm trú) giúp bộ phận HR chủ động làm thủ tục gia hạn.

## Acceptance criteria

- [ ] Cho phép thêm nhiều bản ghi Visa / Tạm trú nối tiếp nhau cho 1 đợt Lưu trú.
- [ ] Lọc và hiển thị danh sách Visa / Tạm trú sắp hết hạn chính xác theo số ngày cảnh báo.
- [ ] UI thể hiện rõ lịch sử các lần gia hạn.

## Blocked by

- `.scratch/hr-foreign/issues/03-stay-management-occupancy.md`
