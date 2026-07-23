# 3. Kiến trúc Trung tâm Xuất Báo cáo Excel theo phân hệ nghiệp vụ

Date: 2026-07-23

## Status

Accepted

## Context

Hệ thống quản lý nhân viên nước ngoài cần tính năng xuất dữ liệu báo cáo ra file Excel cho các phòng ban (HR/Pháp lý, Quản lý KTX/Hành chính, Kế toán, Đội xe). Cần quyết định cấu trúc file xuất (1 file dùng chung hay chia báo cáo chuyên biệt) và vị trí truy cập trên giao diện Frontend.

## Decision

1. **Phân loại Báo cáo Excel chuyên biệt theo nghiệp vụ (Domain-specific Excel Reports)**:
   Không xuất 1 file Excel duy nhất gộp chung tất cả thông tin, mà chia thành các API/báo cáo riêng biệt ứng với mục đích sử dụng và phân quyền của từng bộ phận:
   - **Báo cáo 1: Hồ sơ Nhân viên & Pháp lý (HR/Pháp lý)**: Gồm 2 Sheet:
     - `[Danh sách Nhân sự]`: 1 dòng/nhân viên, chứa đầy đủ thông tin Master cá nhân + Giấy tờ mới nhất đang hiệu lực (Visa, Tạm trú, GPLĐ, HĐLĐ) + Tự động tô màu cảnh báo hết hạn (Đỏ: đã hết hạn, Vàng: sắp hết hạn <= 30 ngày).
     - `[Lịch sử Giấy tờ]`: Nhật ký toàn bộ đợt cấp Visa/Tạm trú/GPLĐ/HĐLĐ.
   - **Báo cáo 2: Hiện diện & Chỗ ở (KTX/Hành chính)**: Gồm 3 Sheet (`[Sơ đồ KTX & Khách sạn]`, `[Chưa xếp chỗ ở]`, `[Đã về nước]`).
   - **Báo cáo 3 & 4 (Sẵn sàng mở rộng)**: Chi phí Ăn uống theo ngày/tháng (dạng Ma trận Lịch tháng) và Nhật ký Điều xe theo đợt.

2. **Frontend UI Architecture — Trung tâm Xuất Báo cáo (`ReportHub`)**:
   - Thêm 1 mục điều hướng riêng **"Xuất Báo cáo"** trên Thanh menu chính (Sidebar).
   - Trang Trung tâm Báo cáo hiển thị danh sách các Card báo cáo có sẵn, hỗ trợ người dùng nhập bộ lọc (nếu có) và tải file Excel tương ứng.

3. **Backend Service (`openpyxl` & `zipfile`)**:
   - Tách mô-đun sinh file Excel riêng trong backend `features/hr_foreign/excel_exporter.py` sử dụng thư viện `openpyxl`.
   - Cung cấp nhóm endpoint `/api/hr-foreign/exports/*` trả về tệp binary `.xlsx` có header `Content-Disposition: attachment`.

4. **Xuất gói tệp đính kèm trọn gói (ZIP Archive & Hyperlinks)**:
   - Hỗ trợ tham số `include_attachments=true` trên endpoint xuất báo cáo.
   - Khi bật tùy chọn này, backend sẽ đóng gói 1 tệp `.zip` chứa file Excel và một thư mục `Giay_To_Dinh_Kem/` được cấu trúc thành các thư mục con theo `[MãNV]_[Tên]`. Mỗi thư mục chứa toàn bộ ảnh Hộ chiếu, Visa, GPLĐ, HĐLĐ và các file PDF đính kèm.
   - Trong file Excel có thêm cột đường dẫn Hyperlink truy cập nhanh tệp đính kèm.

## Consequences

- Đảm bảo tính mở rộng cao: Khi thêm tính năng Ăn uống và Điều xe, chỉ cần thêm endpoint export và thẻ chọn trên `ReportHub` mà không làm thay đổi báo cáo cũ.
- Tùy biến định dạng chuyên nghiệp: Headers in đậm nền tối, tự động căn chỉnh độ rộng cột, tô màu cảnh báo giúp người dùng thao tác dễ dàng trên Excel.
- Tiện lợi tối đa cho HR: Xuất 1 click có ngay bộ hồ sơ pháp lý kèm đầy đủ file ảnh/scan PDF để nộp cho cơ quan nhà nước.
