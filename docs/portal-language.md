# Ngôn ngữ hiển thị của cổng nhân viên 8006

## Phạm vi

Cổng nhân viên trên cổng 8006 gồm luồng chọn/xác nhận nhân viên, Báo cơm và Báo giờ tan làm. Bộ chọn ngôn ngữ có **繁體中文** (`zh-TW`, cách viết Đài Loan) và **English** (`en`). Không thay đổi giao diện HR trên cổng 8004.

## Hành vi đã thống nhất

- Khi trình duyệt chưa lưu lựa chọn, toàn bộ giao diện mở bằng `zh-TW`, bất kể ngôn ngữ trình duyệt hoặc nhân viên được chọn.
- Đổi ngôn ngữ cập nhật ngay giao diện hiện tại và lưu lựa chọn trên trình duyệt/thiết bị. Tải lại trang, đóng rồi mở lại trình duyệt, hoặc đổi nhân viên trên cùng trình duyệt vẫn dùng lựa chọn gần nhất.
- Lựa chọn ngôn ngữ độc lập với nhân viên đang được nhớ trên cổng. Xóa dữ liệu trang của trình duyệt sẽ đưa cổng về mặc định `zh-TW`.
- Dịch toàn bộ chữ do cổng hiển thị: tiêu đề, nhãn, nút, gợi ý tìm kiếm, trạng thái, hướng dẫn, ngày/thứ, thông báo thành công, lỗi và chữ hỗ trợ truy cập. Áp dụng cho cả Báo cơm và Báo giờ tan làm.
- Giữ nguyên dữ liệu nghiệp vụ như tên nhân viên, số phòng, mã điểm đón (`CN09`, `CN15`) và giá trị gửi tới API. Mã điểm đến `KTX` hiển thị cho người dùng là **Dormitory** hoặc **宿舍** theo ngôn ngữ đang chọn. Thay đổi ngôn ngữ không sửa dữ liệu Báo cơm hoặc Báo giờ tan làm.
- Lỗi do API trả về phải được trình bày bằng ngôn ngữ đang chọn; nếu không nhận diện được lỗi, dùng thông báo lỗi chung đã dịch.

## Kiểm tra chấp nhận

1. Trình duyệt mới mở cổng 8006 thấy `zh-TW` trên mọi màn hình và ngày hiển thị theo `zh-TW`.
2. Chọn English, tải lại trang hoặc mở lại trình duyệt vẫn thấy English.
3. Đổi nhân viên hoặc đăng xuất khỏi nhân viên đang chọn không đặt lại ngôn ngữ.
4. Chọn 繁體中文 và tải lại trang vẫn thấy Trung phồn thể.
5. Trạng thái thành công, hạn gửi báo cáo và lỗi API thông thường hiển thị theo ngôn ngữ đang chọn; tên người, số phòng và mã điểm đón giữ nguyên. Điểm đến hiển thị “Dormitory” hoặc “宿舍”, còn API vẫn nhận `KTX`.

## Ghi chú triển khai

Cổng dùng khóa `ny-portal-language` trong `localStorage` để nhớ ngôn ngữ, độc lập với khóa nhớ nhân viên. Mã nguồn giao diện và bản build nằm trong `frontend/`; quy trình triển khai gốc được mô tả tại `docs/meal-reporting-deployment.md`.

Ngày 30/10/2026, bản build mới đã được chuyển lên máy chủ `192.168.209.62` bằng SSH. Bản `portal.html` trước khi thay được sao lưu tại `D:\projects_production\NY_hr_sys_new\frontend\portal-dist\portal.html.pre-zh-tw-20261030`. Kiểm tra sau triển khai: `/` trả HTML `lang="zh-TW"`, asset JavaScript mới trả HTTP 200 và `/health` trả `ok`.

Cùng ngày, nhãn điểm đến `KTX` được đổi thành “Dormitory”/“宿舍” trên giao diện. Bản HTML trước thay đổi này được sao lưu tại `D:\projects_production\NY_hr_sys_new\frontend\portal-dist\portal.html.pre-dormitory-label-20261030`.
