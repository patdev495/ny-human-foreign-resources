# 10. Quản lý Xe Thuê Khoán Tháng Đức Anh và Nhật ký Quãng đường di chuyển Đầu/Cuối Ngày

Date: 2026-07-30

## Status

Accepted

## Context

Hệ thống Quản lý xe hiện hỗ trợ 2 hình thức: Xe ngoài chạy theo chuyến (`OUTSOURCED` - Bình An, Hương Giang) và Xe thuộc sở hữu công ty (`COMPANY_OWNED`). Công ty ký 2 Hợp đồng khoán tháng trọn gói với đơn vị vận tải Đức Anh (gồm 2 xe 7 chỗ TOYOTA Innova và 1 xe tải 8 tấn CNHTC). Các xe này phục vụ như xe công ty nhưng có quy định cước riêng: tiền thuê cố định hàng tháng (25tr/xe 7 chỗ, 42tr/xe tải) ứng với hạn mức 3.000 km/tháng, kết hợp với các quy định tính phụ trội km và phụ phí tăng ca ngoài khung giờ chuẩn (7h-18h cho xe 7 chỗ, 8h-18h cho xe tải), phụ phí qua đêm, Chủ nhật và Lễ/Tết.

Cần tích hợp cấu hình khung giá hợp đồng tháng và quy trình theo dõi chỉ số công tơ mét theo ngày vào hệ thống Quản lý xe.

## Decision

1. **Phân loại & Khai báo Danh mục Xe**:
   - Khai báo 3 xe thuộc nhóm Xe công ty (`COMPANY_OWNED`) dưới đơn vị "Xe Đức Anh":
     - `Xe 7 chỗ - Innova (98A-369.00)`
     - `Xe 7 chỗ - Innova (98A-819.88)`
     - `Xe tải 8 tấn - CNHTC (99H-103.78)`

2. **Cấu hình Bảng giá Hợp đồng Khoán tháng (`MonthlyVehicleContract`)**:
   - Lưu trữ cấu hình trong DB cho phép điều chỉnh khung giá linh hoạt:
     - **Xe 7 chỗ**: Giá cố định 25.000.000 VNĐ/tháng (3.000 km). Km phụ trội: 6.500 VNĐ/km. Khung giờ chuẩn: 7h00-18h00. Ngày thường 18h00-22h00 phụ cấp cố định 100.000 VNĐ; tăng ca 50.000 VNĐ/giờ (trước 7h00 & sau 22h00). Chủ nhật: 1.000.000 VNĐ/ngày; Lễ/Tết: 1.200.000 VNĐ/ngày (tăng ca trước 7h30 & sau 18h00: 50.000 VNĐ/giờ). Qua đêm: 300.000 VNĐ/đêm.
     - **Xe tải 8 tấn**: Giá cố định 42.000.000 VNĐ/tháng (3.000 km). Km phụ trội: 10.000 VNĐ/km. Khung giờ chuẩn: 8h00-18h00. Tăng ca ngày thường ngoài khung giờ: 50.000 VNĐ/giờ. Chủ nhật: 1.000.000 VNĐ/ngày; Lễ/Tết: 1.200.000 VNĐ/ngày (tăng ca trước 8h00 & sau 18h00: 100.000 VNĐ/giờ). Ăn ngoài: 50.000 VNĐ/bữa. Qua đêm: 300.000 VNĐ/đêm.

3. **Giao diện Tab "Nhật ký Quãng đường di chuyển" (`DailyOdometerLog`)**:
   - Thêm Tab mới **"Nhật ký Quãng đường di chuyển"** trong phân hệ Quản lý xe.
   - Ghi nhận `start_km` (đầu ngày) và `end_km` (cuối ngày) từng xe + hình ảnh công tơ mét do tài xế chụp gửi Zalo.
   - Tự động tính số km chạy thực tế trong ngày = `end_km - start_km` và cộng dồn lũy kế trong chu kỳ đối chiếu (26 tháng trước đến 25 tháng này).
   - Bản ghi điều xe lẻ trong ngày chỉ ghi nhận thời gian bắt đầu/kết thúc và lịch trình di chuyển mà không bắt buộc nhập số km riêng từng chuyến.

4. **Tích hợp Báo cáo Đối chiếu Cước tháng Đức Anh**:
   - Báo cáo tổng hợp chi phí thuê xe tháng Đức Anh theo chu kỳ 26->25:
     $$\text{Tổng cước} = \text{Giá thuê cố định} + \max(0, \text{Tổng KM tháng} - 3000) \times \text{Đơn giá phụ trội} + \sum \text{Phụ phí phát sinh}$$

## Consequences

- Mở rộng DB models: Thêm các bảng `monthly_vehicle_contracts` và `daily_odometer_logs`.
- Thêm tab "Nhật ký Quãng đường di chuyển" trên giao diện Frontend phân hệ Quản lý xe.
- Đảm bảo việc hạch toán chi phí đưa đón nhân sự và vận chuyển hàng hóa chuẩn xác theo đúng các điều khoản hợp đồng với bên vận tải Đức Anh.
