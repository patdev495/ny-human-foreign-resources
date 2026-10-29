# 16. Trang Báo cơm dùng chung cơ sở dữ liệu HR

## Status

Accepted

## Context and decision

Trang Báo cơm là giao diện riêng, ưu tiên điện thoại và được truy cập từ Internet, trong khi hệ thống quản lý HR tiếp tục ở mạng nội bộ. Giai đoạn đầu, cổng Báo cơm chạy thành dịch vụ riêng trên cùng máy chủ với HR nhưng ở cổng nội bộ khác; địa chỉ HTTPS công khai chỉ chuyển tiếp đến dịch vụ Báo cơm. Báo cơm được lưu vào cơ sở dữ liệu SQL Server hiện tại thông qua các API công khai giới hạn cho chức năng này; HR đọc cùng dữ liệu nên thấy thay đổi ngay, không cần bản sao cơ sở dữ liệu hay tiến trình đồng bộ. Cổng HR và các API quản lý không được mở công khai trước khi có đăng nhập và phân quyền API.
