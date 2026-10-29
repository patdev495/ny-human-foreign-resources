# 15. Cho phép Báo cơm công khai với xác nhận tên lần đầu

## Status

Accepted

## Context and decision

Nhân viên nước ngoài cần truy cập trang Báo cơm bằng điện thoại từ mọi mạng, kể cả 4G. Lần đầu họ tìm và chọn tên trong danh sách; màn xác nhận hiện tên Latin, tên Trung nếu có và số phòng KTX, không hiện mã nhân viên. Người ở Khách sạn hoặc đã về nước vẫn hiện trong danh sách với trạng thái riêng nhưng không thể Báo cơm. Trình duyệt ghi nhớ lựa chọn cho các lần sau và có nút đăng xuất để chọn lại. Giai đoạn đầu không dùng mã riêng hoặc bước xác thực danh tính khác, nhằm giữ thao tác đơn giản. Cách này cho phép người biết tên có thể báo thay; nếu phát sinh phá hoại, cơ chế xác thực sẽ được xem xét bổ sung. Chỉ trang Báo cơm được mở ra Internet ở giai đoạn này; hệ thống HR và các API quản lý tiếp tục ở mạng nội bộ cho đến khi có đăng nhập và phân quyền API.
