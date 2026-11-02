# Phương án thông báo chốt Báo cơm qua Zalo và Telegram

Trạng thái: đã triển khai mã; chờ kiểm tra trên production khi phát hành.

## Quyết định đã chốt

- Admin bật hoặc tắt Zalo và Telegram bằng hai lựa chọn độc lập ở mức toàn hệ thống.
- Admin có thể tắt cả hai kênh. Khi đó không gửi lời nhắc qua hai kênh; mốc chốt Báo cơm vẫn hoạt động.
- Ngay sau khi nâng cấp, cả hai kênh đều tắt. Admin chủ động bật từng kênh muốn sử dụng.
- Tắt kênh chỉ dừng lịch gửi tự động; admin vẫn có thể chủ động gửi thử trên kênh đang tắt.
- Tắt kênh không xóa danh sách người nhận hoặc lịch sử gửi của kênh đó.
- Mỗi kênh có danh sách người nhận và kết quả gửi riêng. Một HR có mặt trong cả hai danh sách nhận một tin trên mỗi kênh; lỗi ở kênh này không cản kênh kia.
- Mỗi HR mở bot và bấm Start một lần để bắt đầu cuộc trò chuyện; sau đó admin mới có thể chọn họ nhận thông báo.
- Bot trả lời sau Start để xác nhận đã ghi nhận đăng ký và nói rõ HR cần chờ admin chọn vào danh sách nhận thông báo.
- Danh sách đăng ký Telegram hiển thị tên và định danh để admin đối chiếu trực tiếp với HR trước khi lưu người nhận.
- Chủ hệ thống sẽ tạo bot Telegram riêng. Admin nhập token bot trong giao diện để liên kết với hệ thống HR.
- Sau khi lưu, giao diện không hiển thị lại token. Admin xem trạng thái kết nối, kiểm tra bot và có thể nhập token mới để thay bot.
- Khi thay token sang bot khác, giữ lịch sử gửi nhưng xóa lựa chọn người nhận hiện hoạt. HR nhắn `/start` cho bot mới và admin chọn lại.
- Nếu thay sang bot khác khi Telegram đang bật, hệ thống tự tắt gửi tự động Telegram; admin chọn lại người nhận rồi chủ động bật lại.
- Chỉ thay token sau khi xác thực được bot mới. Nếu token sai hoặc không kiểm tra được bot, giữ nguyên bot và danh sách người nhận hiện tại.
- Hai kênh dùng chung nội dung lời nhắc và mốc chốt Báo cơm do admin cấu hình.
- Telegram dùng cùng quy tắc gửi lại như Zalo: thử lại lỗi chắc chắn trong 30 phút sau mốc chốt, ghi bỏ lỡ khi hết cửa sổ, và không tự gửi lại lượt có kết quả chưa rõ. Kết quả được theo dõi riêng theo kênh.
- Thay đổi trạng thái bật/tắt của từng kênh trước mốc chốt áp dụng trong ngày; thay đổi sau mốc chốt có hiệu lực từ ngày hôm sau.
- Mục cài đặt admin mang tên **Thông báo (bot)**, gồm mốc giờ chung và phần quản lý riêng cho Zalo, Telegram. Mỗi phần có công tắc, danh sách người nhận, gửi thử và lịch sử gửi riêng.

## Phạm vi triển khai đề xuất

- Chuyển màn hình Zalo hiện tại thành **Thông báo (bot)** trong admin, có mốc giờ chung và hai phần quản lý độc lập. Hiển thị tên bot Telegram và đường dẫn để admin sao chép gửi cho HR.
- Bổ sung lưu cấu hình bật/tắt theo kênh, mặc định cả hai tắt khi nâng cấp. Giữ nguyên người nhận và lịch sử Zalo hiện có.
- Bổ sung kết nối Telegram bằng token do admin nhập, xác thực trước khi thay token; không trả token đã lưu qua API hoặc giao diện. Chỉ admin được cấu hình bot, chọn người nhận, gửi thử và xem lịch sử.
- Nhận lượt Start từ bot Telegram, trả lời xác nhận, cho admin đối chiếu tên và định danh rồi chọn người nhận. Khi thay bot, giữ lịch sử, bỏ lựa chọn người nhận cũ và tắt gửi tự động Telegram.
- Gửi tự động theo cùng mốc chốt, cùng nội dung và cùng quy tắc thử lại 30 phút. Mỗi kênh có lượt gửi riêng; công tắc tắt sau mốc chốt không hủy lượt gửi đã đến hạn của ngày đó.
- Kiểm thử quyền admin, đổi bot, trạng thái công tắc theo ngày, người nhận, gửi thử và gửi tự động; cập nhật tài liệu vận hành trước khi triển khai production.
