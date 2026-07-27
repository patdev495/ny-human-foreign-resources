# 8. Phân hệ Quản lý xe Độc lập và Quản lý Chi phí Điều xe Linh hoạt

Date: 2026-07-27

## Status

Accepted

## Context

Ban đầu, chức năng điều xe đưa đón được đặt tạm bên trong phân hệ Nhân sự nước ngoài (`hr_foreign`), phục vụ đưa đón nhân viên nước ngoài đi lại giữa KTX, Khách sạn, Sân bay và Công ty. Tuy nhiên, nhu cầu quản lý điều xe và chi phí phương tiện phát triển thành nghiệp vụ độc lập, phục vụ chung cho toàn bộ công ty (bao gồm cả nhân sự nội địa, chuyên gia, lao công và khách công tác). Cần tách phần Điều xe ra khỏi `hr_foreign` thành phân hệ độc lập **Quản lý xe** (ngang cấp trên Sidebar) và xây dựng quản lý danh mục xe/chi phí chuẩn hóa.

## Decision

1. **Phân tách Feature Slice độc lập**: 
   - Backend: Tạo package mới `backend/features/vehicle_management/` (models, schemas, service, router).
   - Frontend: Tạo feature directory `frontend/src/features/vehicle-management/`.
   - Sidebar: Chuyển "Quản lý xe" thành mục Navigation cấp cao độc lập với 2 phần chính: **[Điều xe]** và **[Danh sách xe]**.

2. **Phân loại Nhóm sở hữu xe (`ownership_group`)**:
   - **Xe công ty** (`COMPANY_OWNED`): Xe thuộc sở hữu công ty hoặc do tài xế cố định quản lý. Khởi tạo sẵn danh mục: `A Ngọc`, `A Đại`.
   - **Xe thuê ngoài** (`OUTSOURCED`): Xe dịch vụ thuê ngoài theo từng đợt/chuyến (`Xe 4 chỗ`, `Xe 7 chỗ`, `Xe 16 chỗ`...). Mọi loại xe mới thêm vào sẽ thuộc 1 trong 2 nhóm này.

3. **Gợi ý Đơn giá cố định & Ghi nhận Chi phí linh hoạt**:
   - Trong Danh sách xe, mỗi loại xe cài đặt đơn giá gợi ý/cố định mặc định, thông tin tài xế và biển số xe.
   - Khi tạo đơn Điều xe (`VehicleDispatch`), hệ thống tự động gợi ý tài xế, biển số và đơn giá. HR được quyền chỉnh sửa thoải mái tất cả các trường (bao gồm chi phí thực tế `cost`, điểm đi `pickup_location`, điểm đến `dropoff_location`, ngày điều `dispatch_date`) trực tiếp trên bản ghi chuyến đi mà không làm thay đổi bảng cài đặt danh mục ban đầu.

4. **Tích hợp Trung tâm Xuất Báo cáo (`EXPORT_HUB`)**:
   - Thêm mẫu Báo cáo Chi phí Điều xe vào Báo cáo Center cho phép lọc theo Khoảng ngày (`from_date` $\rightarrow$ `to_date`), Nhóm sở hữu xe hoặc theo Xe/Tài xế cụ thể, xuất file Excel tổng hợp chi phí và nhật ký chuyến đi.

## Consequences

- Tạo mới các bảng DB: `vehicles` (Danh sách xe) và `vehicle_dispatches` (Nhật ký điều xe).
- Tách router `/api/vehicle-management` đăng ký độc lập trong `main.py`.
- Tách giao diện frontend thành `frontend/src/features/vehicle-management/`.
- Thuận tiện cho việc theo dõi, hạch toán chi phí đưa đón nhân sự toàn công ty.
