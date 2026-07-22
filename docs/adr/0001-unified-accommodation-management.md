# 1. Quản lý chỗ ở hợp nhất (KTX & Khách sạn)

Date: 2026-07-22

## Status

Accepted

## Context

Trước đây, hệ thống chỉ hỗ trợ danh mục và hiện trạng cho Phòng KTX. Nhân viên nước ngoài khi sang làm việc có thể lưu trú tại KTX công ty hoặc tại Khách sạn đối tác. Cần hợp nhất giao diện danh mục và hiện trạng phòng KTX thành màn hình **Quản lý chỗ ở**, hỗ trợ đầy đủ quản lý phòng KTX, danh mục Khách sạn, xếp người ở và trả phòng.

## Decision

1. **Khách sạn là thực thể Master độc lập (`Hotel`)**: Thêm danh mục `hotels` riêng biệt bên cạnh `rooms` (Phòng KTX) để quản lý chuẩn hóa các khách sạn đối tác.
2. **Lưu trú (`Stay`) hỗ trợ cả KTX và Khách sạn**: Bản ghi `stays` lưu `accommodation_type` (`KTX` hoặc `HOTEL`), liên kết `room_id` (nếu ở KTX) hoặc `hotel_id` + `hotel_room_number` (nếu ở Khách sạn).
3. **Kiểm tra xung đột khi xếp ở**: Khi thêm nhân viên vào chỗ ở, nếu nhân viên đó đang có lượt ở active (`end_date = null`) ở bất kỳ đâu, hệ thống chặn thao tác và cảnh báo người dùng phải thực hiện thủ tục Trả phòng cũ trước.
4. **Quy tắc ăn uống (`has_meals`)**: Ở KTX mặc định `has_meals = True`, ở Khách sạn mặc định `has_meals = False`.
5. **Cấu trúc giao diện**: Hợp nhất thành 1 màn hình **Quản lý chỗ ở** gồm 3 Tab: [Sơ đồ & Hiện trạng], [Danh mục Chỗ ở] (Sub-tabs: Phòng KTX & Khách sạn), [Lịch sử lưu trú].

## Consequences

- Nâng cấp database schema: Thêm bảng `hotels`, thêm cột `hotel_id` và `hotel_room_number` vào bảng `stays`.
- Cập nhật backend routes & service trong `features/hr_foreign`.
- Cập nhật frontend components trong `features/hr-foreign`.
