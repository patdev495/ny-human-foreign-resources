# 17. Gửi thông báo chốt 17h qua tài khoản Zalo cá nhân với zca-js

## Status

Accepted

## Context and decision

HR cần nhận riêng lời nhắc ngắn theo mốc chốt Báo cơm hằng ngày (mặc định 17:00, admin có thể cấu hình) để vào hệ thống chốt báo cơm cho ngày ăn hôm sau và sắp xếp xe tan làm cho ngày hiện tại, nhưng công ty chưa có Zalo Official Account. Dự án `Auto_Affiliate` của cùng đơn vị đã vận hành `zca-js` để gửi tin từ tài khoản Zalo cá nhân. Hệ thống HR sẽ dùng cùng thư viện trong một dịch vụ Node/TypeScript riêng cạnh FastAPI, với tài khoản Zalo riêng cho HR, không dùng chung tài khoản hoặc phiên đăng nhập với `Auto_Affiliate`. Cách này tận dụng kinh nghiệm vận hành thư viện đã có nhưng phụ thuộc vào giao thức Zalo cá nhân không chính thức; hệ thống ghi nhận kết quả theo từng người nhận, thử gửi bù trong 30 phút nếu mất kết nối và hiển thị lượt gửi thất bại cho admin ở cổng 8004. Màn cấu hình có nút Gửi thử để gửi tin ngay cho một HR được chọn trong mỗi lần thử.
