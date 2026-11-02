# Thông báo (bot) — Zalo và Telegram

## Chuẩn bị triển khai

- Build giao diện HR bằng `npm run build` trong `frontend/`. Đồng bộ mã backend và `frontend/dist/` lên dịch vụ HR 8004.
- Chạy `uv sync` trong `backend/` rồi khởi động lại dịch vụ HR. Startup tạo các bảng `bot_reminder_channel_days`, `bot_reminder_channel_changes`, `telegram_reminder_bot`, `telegram_reminder_recipients`, `telegram_reminder_delivery_logs` và `telegram_reminder_daily_deliveries` trên SQL Server hiện tại. Bảng người nhận và lịch sử Zalo không bị thay thế.
- Bảo đảm `https://ns.nienyi.vn/api/telegram-reminder/webhook` được Caddy chuyển tiếp đến dịch vụ HR 8004 và Telegram truy cập được qua HTTPS. Nếu dùng tên miền khác, cấu hình `TELEGRAM_WEBHOOK_BASE_URL` trong môi trường backend trước khi admin liên kết bot. Không ghi token vào tài liệu, log hoặc Git.
- Không bật tự động hai kênh trong quá trình triển khai. Sau nâng cấp, cả Zalo và Telegram đều tắt. Mốc chốt Báo cơm vẫn hoạt động khi cả hai kênh tắt.

## Cấu hình bởi admin

1. Vào **Cài đặt → Thông báo (bot)**. Kiểm tra mốc chốt dùng chung và danh sách Zalo đã lưu.
2. Nếu dùng Telegram, tạo bot riêng, nhập token tại tab Telegram rồi chọn **Xác thực và lưu**. Tên và đường dẫn bot hiện ra; token không được trả lại. Chia sẻ đường dẫn cho HR.
3. Mỗi HR mở bot và bấm **Start**. Bot xác nhận đăng ký và yêu cầu chờ admin chọn. Admin đối chiếu tên, username và Telegram ID, chọn người nhận, lưu danh sách rồi gửi thử cho một người.
4. Chỉ sau khi kiểm tra tin thử mới bật tự động từng kênh. Công tắc đổi trước mốc chốt có hiệu lực trong ngày; đổi sau mốc chốt có hiệu lực từ ngày hôm sau. Trạng thái và thay đổi đang chờ được hiển thị trên giao diện.
5. Khi thay sang bot Telegram khác, admin phải gửi đường dẫn mới cho HR và chọn lại người nhận. Lịch sử cũ vẫn xem được, Telegram tự tắt.

## Kiểm tra production

- Đăng nhập bằng tài khoản không phải admin và xác nhận không có mục **Thông báo (bot)**; API admin trả 403. Kiểm tra webhook không có secret trả 403.
- Trước khi bật, xác nhận hai kênh tắt, lịch sử và người nhận Zalo còn nguyên, mốc chốt và thao tác chốt bữa vẫn hoạt động.
- Gửi thử Zalo và Telegram tới đúng một HR đã chọn; kiểm tra kết quả ở từng tab. Không gửi thử đến người Telegram chưa Start hoặc chưa được chọn.
- Sau khi bật theo nhu cầu, kiểm tra lịch sử theo ngày vào mốc chốt, gồm Chủ nhật/ngày lễ. Một HR có trong hai danh sách nhận một tin mỗi kênh. Tin thất bại chắc chắn thử lại trong 30 phút; tin kết quả chưa rõ cần đối chiếu thủ công trước khi gửi lại.
- Nếu Telegram không nhận `/start`, kiểm tra HTTPS/Caddy, `TELEGRAM_WEBHOOK_BASE_URL`, trạng thái dịch vụ HR và kết nối ra `api.telegram.org`. Không in token khi chẩn đoán.

Kiểm thử tự động dùng bot giả và không gửi tin Telegram thật. Trước khi bật production, cần kiểm tra thủ công với bot thật và HR thử nghiệm.
