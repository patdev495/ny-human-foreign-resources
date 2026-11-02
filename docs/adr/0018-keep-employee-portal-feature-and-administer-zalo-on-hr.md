# 18. Giữ cổng nhân viên 8006 trong cấu trúc hiện tại và quản lý Zalo ở HR 8004

## Status

Accepted

## Context and decision

Cổng nhân viên 8006 đã chạy thành tiến trình riêng và dùng chung SQL Server với HR 8004. Việc chuyển toàn bộ mã cổng sang thư mục cấp cao khác sẽ làm thay đổi nhiều import, đường dẫn build và cấu hình triển khai trong khi không mang lại chức năng mới cho lời nhắc 17h. Vì vậy giữ cấu trúc feature hiện tại của cổng 8006. Phần cấu hình bot Zalo, quét QR, chọn người nhận từ danh sách bạn bè và xem trạng thái gửi thuộc giao diện HR 8004 và chỉ admin được truy cập. Tiến trình dùng `zca-js` vẫn tách riêng để quản lý phiên Zalo cá nhân; danh sách người nhận và lịch sử gửi dùng SQL Server hiện tại.
