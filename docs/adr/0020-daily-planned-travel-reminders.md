# 20. Nhắc lịch xuất nhập cảnh dự kiến hằng ngày

Date: 2026-11-12

## Status

Accepted

## Decision

- Lấy ngày dự kiến từ từng `TravelRecord`, không lấy các trường tổng hợp trên hồ sơ nhân viên. Chỉ xét Nhân viên nước ngoài còn làm việc và đợt chưa có ngày xuất cảnh thực tế.
- Nhắc ngày đến khi chưa có ngày đến thực tế; nhắc ngày rời khi chưa có ngày rời thực tế. Khoảng nhắc bao gồm ngày hiện tại đến ngày hiện tại cộng số ngày báo trước. Không tiếp tục nhắc sau ngày dự kiến.
- Admin cấu hình chung tại phần cài đặt Zalo/Telegram: bật/tắt, số ngày báo trước 0–365 (mặc định 3), giờ gửi theo giờ Việt Nam (mặc định 08:00).
- Dùng các kênh đang bật và danh sách HR đã chọn hiện có. Mỗi ngày gửi một bản tổng hợp cho từng HR trên từng kênh; không có lịch thì không gửi. Nếu máy chủ hoạt động lại sau giờ gửi, có thể gửi trong phần còn lại của ngày đó.
- Lưu cấu hình trong `system_settings`; bảng `bot_travel_reminder_deliveries` có khóa chính gồm kênh, ngày và người nhận. Ghi nhận `SENDING` trước thao tác mạng để tránh gửi trùng giữa các worker hoặc khi khởi động lại. Lỗi xác định được lưu `FAILED`; kết quả chưa rõ lưu `UNKNOWN`. Không tự gửi lại lượt đã được ghi nhận trong ngày để tránh nhắc trùng, kể cả khi một bản tổng hợp dài chỉ gửi được một phần.
- Nội dung dài được chia theo dòng thành các phần tối đa 3.000 ký tự trong cùng lượt gửi.
- Feature HR cung cấp nội dung; mỗi feature kênh cung cấp người nhận qua kiểu dùng chung `core.notifications.NotificationTarget`. `main.py` nối các thành phần với bộ lập lịch bot, tránh thêm import trực tiếp giữa các feature.

## Validation

Kiểm tra mốc ngày, ngày thực tế, phân quyền cấu hình, thời gian gửi, kênh tắt, lưu cấu hình và chống gửi trùng qua phiên mới. Truy vấn được biên dịch với dialect MSSQL; không thêm cơ sở dữ liệu thay thế cho SQL Server.
