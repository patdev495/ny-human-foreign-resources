# Admin liên kết bot Telegram trong giao diện HR

Bot Telegram dùng cho nhắc chốt Báo cơm được tạo riêng và liên kết bằng token do admin nhập trong giao diện HR, thay vì yêu cầu người vận hành sửa cấu hình trên máy chủ. Cách này cho phép admin tự thay bot thuận tiện hơn, đổi lại hệ thống phải bảo vệ token đã lưu: chỉ admin được cập nhật, giao diện không trả lại token sau khi lưu. Khi thay bot, lịch sử gửi được giữ nhưng danh sách người nhận hiện hoạt phải chọn lại để tránh dùng nhầm người nhận của bot cũ.
