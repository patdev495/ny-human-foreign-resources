# 4. Cấu hình Mốc Cảnh báo Giấy tờ riêng biệt theo Loại (Visa, Tạm trú, GPLĐ, HĐLĐ, Hộ chiếu)

Date: 2026-07-23

## Status

Accepted

## Context

Trước đây, hệ thống sử dụng một khung mốc cảnh báo chung (mặc định 30 ngày) áp dụng cho tất cả các loại giấy tờ pháp lý của Nhân viên nước ngoài trên giao diện cảnh báo `ExpiringDocsAlert`. 
Tuy nhiên, quy trình xử lý gia hạn thủ tục pháp lý thực tế yêu cầu thời gian chuẩn bị khác nhau (ví dụ: GPLĐ hoặc Hộ chiếu thường mất nhiều tuần/tháng để làm thủ tục, trong khi Visa/Tạm trú có thể làm nhanh hơn). Đồng thời, mốc cảnh báo này sẽ được sử dụng cho tính năng gửi Email thông báo tự động trong tương lai.

## Decision

1. **Lưu trữ tập trung ở Backend Database (`doc_warning_configs`)**: 
   Tạo bảng `doc_warning_configs` lưu cấu hình mốc cho 5 loại giấy tờ: `VISA`, `TAM_TRU`, `GPLD`, `CONTRACT`, `PASSPORT`.
2. **Đơn vị tính Ngày / Tháng (`warning_unit`)**:
   Cho phép người dùng thiết lập số lượng (`warning_value`) đi kèm đơn vị (`warning_unit` là `DAY` hoặc `MONTH`).
   Mặc định khởi tạo ban đầu cho tất cả 5 loại là `30 DAY`.
   Khi tính toán ngày hết hạn ở Backend, 1 Tháng được quy đổi bằng 30 Ngày.
3. **Bổ sung Hộ chiếu vào Danh mục Cảnh báo**:
   Hộ chiếu (`PASSPORT`) được đưa vào thành loại giấy tờ thứ 5 trong hệ thống cảnh báo hết hạn tập trung.
4. **Bỏ khung cảnh báo chung trên UI & Hiển thị phân loại**:
   - Xóa dropdown chọn mốc chung trên header `ExpiringDocsAlert`.
   - Nút **Setting (`⚙️ Cấu hình mốc`)** mở Modal điều chỉnh mốc riêng cho 5 loại giấy tờ.
   - Giao diện `ExpiringDocsAlert` hiển thị 5 mục phân loại tương ứng với mốc cấu hình từ DB của từng loại.
   - Giao diện `EmployeeProfileModal` (Hồ sơ nhân sự 360°) tự động cập nhật nhãn/badge cảnh báo của từng giấy tờ theo đúng mốc cấu hình trong DB.

## Consequences

- **Schema Migration**: Thêm model / bảng `DocWarningConfig` trong `backend/features/hr_foreign/models.py`.
- **Backend API & Service**: 
  - API `GET /api/hr-foreign/doc-warning-configs` & `PUT /api/hr-foreign/doc-warning-configs`.
  - Nâng cấp `get_expiring_documents` trong `status_engine.py` / `service.py` đọc mốc từ DB và bổ sung `expiring_passports`.
- **Frontend Components**:
  - Tạo `DocWarningConfigModal.tsx`.
  - Cập nhật `ExpiringDocsAlert.tsx` và `EmployeeProfileModal.tsx`.
