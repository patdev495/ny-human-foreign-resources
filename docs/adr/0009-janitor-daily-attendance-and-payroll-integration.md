# 9. Phân tách Phân hệ Nhân sự Tạp vụ & Tích hợp Điểm danh Hàng ngày với Bảng Lương và Suất ăn KTX

Date: 2026-07-28

## Status

Accepted

## Context

Trước đây, phân hệ Nhân sự Tạp vụ (`JANITORIAL`) chỉ quản lý hồ sơ nhân sự và thông tin mức lương. Khi xuất Báo cáo Chấm công & Lương Tạp vụ cũng như Báo cáo Chi phí Suất ăn KTX, số ngày công mặc định được tính cứng là đi làm đủ 100% ('N' tất cả các ngày Mon-Sat) do chưa có cơ chế điểm danh và ghi nhận vắng nghỉ thực tế hàng ngày cho khối tạp vụ. Cần phân tách phân hệ Nhân sự Tạp vụ thành 2 mảng nghiệp vụ rõ ràng: **Quản lý Hồ sơ** và **Điểm danh Hàng ngày**, đồng thời liên thông dữ liệu điểm danh sang Báo cáo Chấm công, Lương và Suất ăn KTX.

## Decision

1. **Phân tách Sidebar Navigation & Giao diện**:
   - Chuyển mục "Nhân sự Tạp vụ" trên thanh Sidebar thành mục menu sổ xuống (Accordion Menu) gồm 2 mục con:
     - 📋 **Hồ sơ & Thông tin** (`JANITOR_PROFILES`): Quản lý master danh sách tạp vụ, nơi làm việc (KTX/Công ty), hình thức lương (Tháng/Ngày) và mức lương.
     - 📅 **Điểm danh hàng ngày** (`JANITOR_ATTENDANCE`): Giao diện điểm danh theo ngày kèm danh sách tạp vụ, tích chọn vắng/nghỉ và nhập lý do.

2. **Cơ chế Điểm danh Ngoại lệ (Opt-Out Model) & Loại Nghỉ**:
   - Mặc định tất cả Tạp vụ đi làm đầy đủ (1.0 công). HR không phải thao tác tích chọn đi làm mỗi ngày.
   - HR sử dụng giao diện Điểm danh để ghi nhận bản ghi vắng/nghỉ:
     - **Nghỉ cả ngày** (`FULL_DAY` - vắng 1 ngày công, ký hiệu `X` trên bảng công Excel).
     - **Nghỉ nửa ngày** (`HALF_DAY` - vắng 0.5 ngày công, ký hiệu `0.5` trên bảng công Excel).
   - Cho phép nhập lý do nghỉ (nghỉ phép, nghỉ ốm, việc riêng...).

3. **Linh hoạt Thời điểm & Đăng ký Nghỉ theo Khoảng ngày**:
   - HR có thể điểm danh ngày hiện tại, xem/sửa quá khứ, hoặc **đăng ký nghỉ trước cho tương lai**.
   - Cung cấp tính năng **"Đăng ký nghỉ theo đợt"** (Khoảng ngày từ `start_date` đến `end_date`), tự động tạo bản ghi vắng nghỉ cho các ngày làm việc (trừ Chủ nhật) trong khoảng được chọn.

4. **Liên thông Dữ liệu với Suất ăn KTX & Báo cáo Lương**:
   - **Báo cáo Suất ăn KTX & Chốt bữa Trưa (`LUNCH`)**: Khi một Tạp vụ KTX (`workplace_location == 'DORMITORY'`) bị ghi nhận nghỉ (nửa ngày hoặc cả ngày), số suất ăn trưa gợi ý cho nhà bếp tự động trừ đi 1 suất tương ứng.
   - **Báo cáo Chấm công & Lương Tạp vụ Excel**: Lấy trực tiếp dữ liệu điểm danh thực tế trong DB để hiển thị ký tự chấm công (`N`, `X`, `0.5`), tính tổng số công chính xác (`COUNTIF` / tổng công thực tế) và nhân mức lương tương ứng.

## Consequences

- Tạo bảng DB mới `janitor_attendance_records` lưu giữ thông tin vắng nghỉ theo nhân sự và ngày (`employee_id`, `attendance_date`, `absence_type`, `reason`).
- Bổ sung router / API endpoint phía Backend phục vụ CRUD bản ghi điểm danh Tạp vụ theo ngày và theo đợt.
- Tự động hóa việc tính suất ăn trưa KTX và xuất file Excel chấm công & lương chuẩn xác theo thực tế vận hành.
