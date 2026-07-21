---
Status: completed
Feature: hr-foreign
Issue: 02
---

# Foreign Employee & Room Management (API + UI)

## Parent

PRD: `.scratch/hr-foreign/PRD.md`

## What to build

Xây dựng tính năng CRUD hoàn chỉnh (Backend API + Frontend UI) cho **Hồ sơ Nhân sự Nước ngoài** và **Danh mục Phòng KTX**.

- **Backend**:
  - API endpoints cho `ForeignEmployee`: GET list (có search theo tên, passport, bộ phận), POST create, GET detail, PUT update, DELETE.
  - API endpoints cho `Room`: GET list, POST create, PUT update, DELETE.
  - Pydantic request/response schemas với full type hints.
- **Frontend**:
  - Trang quản lý Hồ sơ Nhân sự Nước ngoài: Bảng danh sách, bộ lọc tìm kiếm nhanh, modal Thêm/Sửa hồ sơ.
  - Trang/Component quản lý Phòng KTX: Bảng danh sách phòng, modal thêm/sửa phòng.

## Acceptance criteria

- [ ] Tạo mới nhân sự thành công, mã nhân sự (id) tự tăng.
- [ ] Tìm kiếm nhân sự hoạt động chính xác theo Tên Latin, Tên Trung Quốc, Số hộ chiếu và Bộ phận.
- [ ] CRUD danh mục phòng KTX hoạt động không lỗi, không cho trùng số phòng.
- [ ] Giao diện React responsive, styled chuẩn Tailwind CSS theo phong cách hiện đại.

## Blocked by

- `.scratch/hr-foreign/issues/01-db-schema-foundation.md`
