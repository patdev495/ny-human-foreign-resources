# Bot Zalo nhắc HR theo mốc chốt Báo cơm

Mốc mặc định là **17:00 giờ Việt Nam**. Admin 8004 có thể đổi trong **Cài đặt → Thông báo Zalo**. Cùng mốc này là hạn nhân viên gửi/sửa Báo cơm cho ngày ăn hôm sau, thời điểm sớm nhất HR được chốt bữa Sáng/Tối, và thời điểm bot gửi lời nhắc. Hạn Báo giờ tan làm vẫn là 17:00. Cấu hình lưu trong SQL Server chung để 8004 và 8006 dùng cùng giá trị.

## Chuẩn bị

- Cài Node.js phiên bản 24 trở lên trên máy chạy HR 8004. Cổng nhân viên 8006 cần cập nhật backend và frontend để nhận mốc Báo cơm mới.
- Dùng một tài khoản Zalo riêng cho bot HR, khác tài khoản `Auto_Affiliate`.
- Tạo một secret ngẫu nhiên dài tối thiểu 32 ký tự. Đặt cùng giá trị `HR_ZALO_BOT_SECRET` trong môi trường dịch vụ bot và `backend/.env` của HR 8004. Không ghi secret vào Git hoặc log.
- Bot chỉ lắng nghe `127.0.0.1:8016`. Có thể đổi cổng bằng `HR_ZALO_BOT_PORT` ở cả bot và backend. Không mở cổng này trên firewall hoặc reverse proxy.

## Build và chạy bot

Trong `zalo_bot/`, chạy `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Sau đó chạy `npm start` với thư mục làm việc là `zalo_bot/` và biến môi trường nêu trên. Trên máy chủ Windows, có thể đặt lệnh này trong NSSM như dịch vụ riêng với `Application` là đường dẫn `node.exe`, `AppDirectory` là thư mục `zalo_bot`, `AppParameters` là `dist/index.mjs`.

Trong dev, phải đặt `HR_ZALO_BOT_SECRET` trong `backend/.env` **và** môi trường của tiến trình `npm start`; hai giá trị phải giống nhau. Khởi động lại backend 8004 sau khi sửa `.env`. Nếu màn hình báo bot chưa được cấu hình, kiểm tra secret ở backend. Nếu báo không kết nối được bot, kiểm tra tiến trình Node đang lắng nghe `127.0.0.1:8016`. Sau khi bot chạy, trạng thái QR có thể mất vài giây để xuất hiện.

Thư mục `zalo_bot/data/` lưu phiên đăng nhập và QR tạm thời. Chỉ tài khoản Windows chạy dịch vụ bot được đọc/ghi thư mục này; đưa thư mục vào bản sao lưu vận hành phù hợp, không đưa vào Git. Nếu phiên hết hiệu lực, bot tự tạo QR mới; admin truy cập **Cài đặt → Thông báo Zalo** ở HR 8004 để quét lại.

Backend HR 8004 chạy vòng kiểm tra lịch mỗi 15 giây, tính giờ bằng UTC+7, không phụ thuộc múi giờ của máy chủ. Mỗi ngày, kể cả Chủ nhật và ngày lễ, bot gửi riêng cho từng người nhận đã lưu. Bot mất kết nối trước khi gửi được ghi `FAILED` và thử lại trong 30 phút; từ mốc cộng 30 phút trở đi, lượt chưa gửi được ghi `MISSED`. Nếu backend chỉ khởi động lại vào hôm sau, những người đã được chọn trước mốc hôm trước cũng được ghi `MISSED` mà không nhận tin cũ. Lượt đã được xác nhận `SENT` không gửi lại; lượt đã bắt đầu nhưng kết quả chưa rõ được ghi `UNKNOWN` để admin kiểm tra trong Zalo. Nút **Kiểm tra lượt đến hạn** chỉ chạy cùng quy tắc thời gian, không ép gửi sớm.

Trong dev, cấu hình một Zalo bot và người nhận thử riêng, khởi động backend 8004 cùng dịch vụ bot, đặt mốc chốt sắp tới bằng tài khoản admin. Kiểm tra cổng 8006 ngừng nhận Báo cơm đúng mốc và HR bắt đầu chốt được bữa Sáng/Tối. Sau mốc, xem **Lịch gửi tự động theo ngày** tại 8004 và kiểm tra hội thoại cá nhân của người nhận. Có thể bấm **Kiểm tra lượt đến hạn** để chạy ngay lần kiểm tra khi đồng hồ đã tới mốc. Đổi lại mốc mong muốn sau khi thử; không sử dụng người nhận production trong dev.

## Kiểm tra sau triển khai

1. Đăng nhập 8004 bằng tài khoản admin, mở **Cài đặt → Thông báo Zalo** và quét QR bằng tài khoản bot HR.
2. Khi trạng thái chuyển sang **Đã kết nối**, tìm một người trong danh sách bạn bè Zalo của bot, chọn và lưu danh sách nhận.
3. Chọn đúng HR đã lưu và bấm **Gửi thử ngay**. Xác nhận tin đến hội thoại riêng và kết quả hiển thị trong lịch sử gửi thử.
4. Đăng xuất hoặc dùng tài khoản không phải admin để kiểm tra phần cấu hình và API Zalo bị chặn.
5. Xem kết quả theo ngày; kiểm tra `SENT`, `FAILED`, `MISSED`, `UNKNOWN` và xác nhận gửi thử vẫn độc lập với lịch tự động.

Danh sách người nhận, mốc giờ, lịch sử gửi thử và kết quả hằng ngày lưu trong SQL Server đang dùng cho HR. Không gọi Zalo thật trong test tự động. Chưa triển khai production trong giai đoạn tự kiểm thử dev.
