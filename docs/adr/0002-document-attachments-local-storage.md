# 2. Lưu trữ tệp đính kèm giấy tờ trên đĩa cục bộ (Local Storage)

Date: 2026-07-22

## Status

Accepted

## Context

Các loại giấy tờ của Nhân viên nước ngoài (Hộ chiếu, Visa, Tạm trú, Giấy phép lao động, Hợp đồng lao động) cần lưu trữ hình ảnh/file PDF để cho phép xem trước và tải xuống trên giao diện web. Hệ thống sử dụng SQL Server 2008 R2 làm cơ sở dữ liệu.

## Decision

1. **Lưu file vật lý trên Local Disk của Server**: Lưu trữ các file đính kèm trong thư mục được cấu hình riêng trên server (`backend/uploads/documents/`), phân mục theo ID nhân viên hoặc UUID ngẫu nhiên để tránh trùng tên file.
2. **Lưu Metadata trong SQL Server**: Tạo bảng chung `document_attachments` lưu trữ các thông tin quản lý: `document_type` (PASSPORT, VISA, TAM_TRU, WORK_PERMIT, CONTRACT), `target_id` (ID của bản ghi giấy tờ tương ứng), `file_name`, `file_path`, `file_size`, `mime_type`, `created_at`.
3. **Phục vụ tệp đính kèm qua API Endpoint**: Cung cấp các endpoint xem trước (`/preview`) và tải xuống (`/download`) từ FastAPI có xác thực/kiểm tra thay vì static file công khai trực tiếp.

## Consequences

- Tránh làm tăng đột biến dung lượng DB SQL Server 2008 R2 (ngăn chặn tình trạng phình to file `.mdf`/`.ldf` do BLOB).
- Cần đảm bảo cơ chế sao lưu (backup) định kỳ cho thư mục `uploads/` trên server bên cạnh backup DB.
- Mô hình dữ liệu linh hoạt, hỗ trợ 1 bản ghi giấy tờ có nhiều file đính kèm (1-N).
