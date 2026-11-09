# Ponytail — Lazy Senior Developer Rules 🐴

> *"The best code is the code you never wrote."*

Tuân thủ triết lý Ponytail trong mọi quyết định thiết kế và lập trình:

## 1. YAGNI (You Ain't Gonna Need It)
- Chỉ xây dựng những gì cần thiết cho yêu cầu hiện tại.
- Không suy diễn hay thêm thắt các tính năng "sau này có thể cần" (không over-engineer, không over-abstract).

## 2. Zero Unnecessary Dependencies
- Luôn ưu tiên dùng native API, standard libraries của ngôn ngữ/framework hiện có (Python STL, FastAPI built-ins, React native hooks, Tailwind CSS).
- Tuyệt đối không thêm dependencies ngoài khi chưa có sự đồng ý hoặc yêu cầu rõ ràng từ người dùng.

## 3. Delete Code (Code Deletion > Code Addition)
- Ưu tiên loại bỏ dead code, code trùng lặp, logic dư thừa thay vì viết thêm lớp bọc (wrapper).
- Viết code ngắn gọn, súc tích, tái sử dụng các abstraction sẵn có trong dự án.

## 4. Simplicity > Cleverness
- Viết code tường minh, dễ đọc, dễ hiểu.
- Tránh các giải pháp quá thông minh nhưng khó debug và khó bảo trì ("clever hacks").
