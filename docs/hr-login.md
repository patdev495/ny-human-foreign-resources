# Đăng nhập cổng HR 8004

Giai đoạn đầu, mỗi người dùng cổng HR có tài khoản riêng. Mọi tài khoản đang hoạt động đều có quyền sử dụng các chức năng HR và Điều xe hiện có. Chỉ admin được tạo, khóa/mở khóa, cấp/bỏ quyền admin và đặt lại mật khẩu tài khoản khác. Phân quyền theo phân hệ và thao tác sẽ được thiết kế sau.

API HR và Điều xe kiểm tra phiên đăng nhập ở máy chủ; việc ẩn giao diện không được xem là biện pháp bảo vệ API. Cổng nhân viên 8006 là dịch vụ riêng và không dùng tài khoản HR.

## Tạo admin đầu tiên

Trên máy chạy backend, trong thư mục `backend/`, chạy:

```powershell
uv run python -m features.auth.bootstrap
```

Lệnh hỏi tên tài khoản, tên hiển thị và mật khẩu hai lần. Mật khẩu không hiện trên màn hình. Lệnh chỉ tạo admin khi chưa có admin đang hoạt động. Không lưu mật khẩu vào Git hoặc file cấu hình.

Mật khẩu chỉ cần có ít nhất một ký tự; hệ thống không áp dụng yêu cầu độ dài tối thiểu hay độ phức tạp khác. Giới hạn kỹ thuật là 256 ký tự.

Sau khi đăng nhập cổng 8004, admin mở **Tài khoản** ở thanh trên để tạo tài khoản khác. Người dùng có thể đổi mật khẩu của mình ở **Đổi mật khẩu**. Đổi hoặc đặt lại mật khẩu sẽ vô hiệu hóa mọi phiên cũ của tài khoản đó. Khóa tài khoản cũng vô hiệu hóa phiên hiện có.

## Triển khai

- Giữ cổng 8004 và API HR trong mạng nội bộ. Việc có đăng nhập không tự động cho phép mở cổng này ra Internet.
- Nếu cổng HR được phục vụ qua HTTPS, đặt `AUTH_COOKIE_SECURE=true`. Cổng HTTP nội bộ hiện cần giá trị `false`; mật khẩu và cookie không được mã hóa trên đường truyền HTTP, nên cần HTTPS trước khi mở rộng phạm vi truy cập.
- Phiên đăng nhập hết hạn sau 8 giờ. Cookie `HttpOnly`, `SameSite=Strict`; máy chủ chỉ lưu hash của mã phiên.
- Mật khẩu được băm PBKDF2-HMAC-SHA256 với salt riêng và 600.000 vòng. Sai mật khẩu 10 lần liên tiếp khóa đăng nhập tài khoản trong 15 phút.
- Nên dùng tên host riêng cho cổng HR và cổng công khai 8006: cookie trình duyệt phân biệt host nhưng không phân biệt cổng. Nếu cùng truy cập bằng địa chỉ IP, cookie HR cũng được gửi tới yêu cầu cổng 8006, dù cổng này không dùng cookie đó.

## Mở rộng phân quyền sau này

Mọi API HR đang đi qua dependency xác thực `require_user`. Khi quyết định mô hình quyền, thêm kiểm tra quyền tại các router hoặc endpoint dựa trên tài khoản đã xác thực; không cần thay lại luồng đăng nhập hay chuyển đổi hồ sơ nhân viên thành tài khoản. Cần thiết kế riêng ma trận quyền và chuyển quyền của tài khoản hiện có trước khi bật kiểm tra mới.
