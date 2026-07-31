# 11. Unified Vehicle Contract Management and Sidebar Navigation

* Status: accepted
* Date: 2026-07-31

## Context and Problem Statement

Phân hệ Quản lý xe (`vehicle-management`) ban đầu được khởi tạo như một tab đơn lẻ trên Sidebar với các sub-tab bên trong màn hình tổng. Khi số lượng nhà xe và hợp đồng tăng lên (gồm hợp đồng xe khoán tháng Đức Anh và hợp đồng tuyến đường xe ngoài Bình An), thông tin hợp đồng và quy tắc tính cước bị chia rẽ rải rác:
- Bảng giá khoán tháng Đức Anh nằm ở tab "Hợp đồng xe khoán tháng".
- Bảng giá tuyến đường Bình An nằm ẩn bên trong Modal của tab "Danh sách xe & Bảng giá".
- Sidebar chỉ có 1 nút đơn `Quản lý xe`, trong khi các phân hệ khác (*Nhân sự nước ngoài*, *Nhân sự Tạp vụ*, *Xuất Báo cáo Excel*) đều hỗ trợ menu xổ xuống (Accordion).

Cần thống nhất lại kiến trúc điều hướng Sidebar và gom toàn bộ hợp đồng nhà xe về một nơi quản lý tập trung, có khả năng mở rộng thêm các loại hợp đồng mới trong tương lai.

## Decision Drivers

* **Trải nghiệm người dùng (UX)**: Thống nhất kiểu dáng accordion menu trên Sidebar cho tất cả các phân hệ chính.
* **Tính mở rộng (Extensibility)**: Cho phép bổ sung thêm các nhà xe và hình thức hợp đồng mới mà không làm vỡ bố cục giao diện.
* **Tập trung hóa dữ liệu (Cohesion)**: Gom tất cả các cấu hình hợp đồng/bảng giá xe về một màn hình duy nhất thay vì rải rác trong danh mục xe.

## Considered Options

* **Option 1**: Giữ nguyên Sidebar 1 nút đơn và gom hợp đồng trong tab Quản lý xe.
* **Option 2**: Chuyển Sidebar `Quản lý xe` thành Accordion group với 4 mục con (`VEHICLE_DISPATCH`, `VEHICLE_ODOMETER`, `VEHICLE_CONTRACTS`, `VEHICLE_LIST`), và tạo màn hình `Quản lý Hợp đồng & Bảng giá` với thiết kế sub-tab mở rộng.

## Decision Outcome

Chọn **Option 2**.

### Consequence

1. **Sidebar Navigation**:
   - `Quản lý xe` trở thành Accordion menu xổ xuống.
   - 3 mục con chính tinh gọn:
     - `VEHICLE_DISPATCH`: Nhật ký Điều xe
     - `VEHICLE_ODOMETER`: Nhật ký Quãng đường di chuyển
     - `VEHICLE_CONTRACTS`: Quản lý Hợp đồng & Nhà xe

2. **Giao diện Quản lý Hợp đồng & Nhà xe (`VEHICLE_CONTRACTS`)**:
   - Thiết kế dạng Sub-tab mở rộng:
     - Sub-tab 1: **Hợp đồng khoán tháng (Đức Anh)**
     - Sub-tab 2: **Hợp đồng tuyến đường & đơn giá chuyến (Bình An & Xe ngoài)**
   - Sẵn sàng thêm sub-tab mới khi phát sinh nhà xe/hợp đồng mới.

3. **Loại bỏ Tab trùng lặp (`VEHICLE_LIST`)**:
   - Bỏ hoàn toàn tab "Danh mục Nhà xe & Xe" do toàn bộ thông tin nhà xe, tài xế, biển số đã được quản lý tập trung và trực quan trong tab "Quản lý Hợp đồng & Nhà xe".
