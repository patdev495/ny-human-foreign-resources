# 7. Thông báo Cảnh báo Giấy tờ qua Email (Foxmail / SMTP Daily Digest)

Date: 2026-07-27

## Status

Accepted

## Context

Nhân sự công ty hiện sử dụng Foxmail (ứng dụng duyệt email client) làm công cụ làm việc chính. HR cần nhận email cảnh báo tự động khi các giấy tờ pháp lý của Nhân viên nước ngoài (Visa, Tạm trú, GPLĐ, HĐLĐ, Hộ chiếu) đến mốc cảnh báo hết hạn hoặc đã hết hạn, nhằm chủ động chuẩn bị hồ sơ gia hạn kịp thời mà không phải liên tục đăng nhập hệ thống HR để kiểm tra thủ công.

## Decision

1. **Giao thức kết nối Foxmail qua SMTP Server**:
   - Foxmail là Email Client (MUA). Hệ thống HR sẽ không cần tạo plugin Foxmail riêng mà gửi email chuẩn thông qua SMTP Server. Foxmail của HR tự động nhận thư về inbox.
2. **Hình thức Email gộp hàng ngày (Daily Digest Email)**:
   - Hệ thống chạy 1 background job lúc 08:00 sáng mỗi ngày, quét dữ liệu giấy tờ và gom toàn bộ giấy tờ quá hạn / sắp hết hạn thành **01 Email tổng hợp duy nhất** dạng bảng HTML phân màu (🔴 Đỏ cho quá hạn, 🟡 Vàng cho sắp hết hạn).
3. **Phân tách Cấu hình Hạ tầng (.env) và Cấu hình Địa chỉ nhận (UI/DB)**:
   - Thông số máy chủ SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`) quản lý tập trung ở file `.env` phía Backend để bảo mật mật khẩu.
   - Danh sách email nhận cảnh báo (`recipient_emails`) lưu trong Database và cho phép HR quản lý trên UI màn hình Cấu hình Mốc Cảnh báo.
4. **Hỗ trợ Nút Gửi thử nghiệm & Gửi ngay thủ công trên UI**:
   - Thêm nút **"Send Test Mail"** (kiểm tra cấu hình SMTP) và nút **"Gửi cảnh báo ngay"** (phát hành bản tin cảnh báo thủ công bất kỳ lúc nào).
5. **Scheduler ngầm tích hợp sẵn trong FastAPI Backend**:
   - Sử dụng background scheduler ngầm trong ứng dụng FastAPI, ghi nhật ký lịch sử gửi (`email_delivery_logs`) phục vụ tra cứu và khắc phục sự cố.

## Consequences

- **Backend**:
  - Bổ sung cấu hình SMTP trong `core/config.py`.
  - Tạo service `email_service.py` gửi mail HTML async.
  - Tạo bảng `email_delivery_logs` và lưu cấu hình `recipient_emails` trong bảng `doc_warning_configs`.
  - Thêm scheduler ngầm chạy 08:00 AM hàng ngày và các API endpoints trigger gửi mail.
- **Frontend**:
  - Bổ sung ô nhập danh sách Email Nhận, nút "Gửi mail test" và "Gửi cảnh báo ngay" trên Modal `DocWarningConfigModal.tsx`.
