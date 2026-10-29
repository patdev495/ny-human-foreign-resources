# 14. Lấy Báo cơm làm căn cứ cho suất ăn của Nhân viên nước ngoài

## Status

Accepted

## Context and decision

Quy trình hiện tại theo ADR-0005 mặc định tính cả bữa Sáng và bữa Tối cho Nhân viên nước ngoài ở KTX rồi trừ Vắng ăn. Trong quy trình mới, Báo cơm từ trang tự khai báo là nguồn duy nhất xác định từng người ăn hay không ăn; cờ Có ăn, Vắng ăn và Đăng ký ăn thêm của hệ thống HR hiện tại không quyết định suất Sáng/Tối của ngày áp dụng quy trình mới. Người chưa gửi được tính 0 suất nhưng có trạng thái Chưa báo cơm riêng với người đã báo không ăn. Chỉ người còn ở KTX vào ngày ăn mới được tính suất; bản khai báo đã gửi trước khi chuyển chỗ ở hoặc về nước được giữ để đối chiếu.

Người ở KTX được chọn ngày trong tuần hiện tại; từ Chủ nhật được chọn cả tuần kế tiếp. Chủ nhật không nhận Báo cơm vì không phục vụ suất ăn. Mỗi ngày ăn được gửi hoặc sửa trước 17h ngày hôm trước; bữa Sáng và Tối được HR chốt từ 17h00 ngày hôm trước. Mỗi lần sửa Báo cơm được giữ trong lịch sử để HR đối chiếu, còn số suất dự báo dựa trên lựa chọn mới nhất. HR thấy thay đổi ngay sau khi người dùng gửi hoặc sửa; trang mới chỉ xác nhận thành công khi dữ liệu đã lưu để HR xem được, còn lỗi gửi phải được báo rõ.

Trên hệ thống HR, người quản lý được mở danh sách chi tiết người ăn, không ăn và chưa báo nhưng không sửa trạng thái từng người. HR chỉ điều chỉnh tổng số suất trong lúc chốt và bắt buộc nhập lý do khi số chốt khác số đề xuất từ Báo cơm. HR có thể chốt lại một bữa đã chốt; mỗi lần chốt lại phải ghi lý do và giữ bản chốt trước để đối chiếu. Quy tắc bữa Trưa của Lao công và tiền Hoa quả giữ như hiện tại. Không cần chuyển đổi dữ liệu suất ăn lịch sử; Báo cơm là nguồn từ ngày trang mới bắt đầu được sử dụng. Quyết định này thay thế riêng giả định mặc định ăn và cách tính dự báo Sáng/Tối trong ADR-0005; cơ chế chốt suất ăn theo bữa của ADR đó vẫn áp dụng.
