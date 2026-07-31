# 12. Hotel Stay Workflow and Flexible Invoice Attachments

* Status: accepted
* Date: 2026-07-31

## Context and Problem Statement

Nghiệp vụ lưu trú tại Khách sạn đối tác (`HOTEL`) dành cho Nhân viên nước ngoài đòi hỏi quản lý chính xác thời điểm vào/ra, chi phí hóa đơn thực tế và chứng từ đính kèm (hóa đơn GTGT, giấy xác nhận tạm trú khách sạn, booking confirmation).

Khi nhân sự trả phòng Khách sạn, thời điểm nhân sự rời đi (cần nhập ngày ra `end_date` để giải phóng vị trí lưu trú trên hệ thống) thường không trùng khớp với thời điểm đối tác Khách sạn gửi hóa đơn tài chính VAT (thường xuất theo tuần/tháng hoặc gửi sau).

Cần xác định quy trình Trả phòng Khách sạn và chính sách ghi nhận số tiền hóa đơn (`invoice_amount`) cùng tài liệu đính kèm.

## Decision Drivers

* **Tính thực tế vận hành (Operational Reality)**: Nhân sự trả phòng ngay khi rời đi, nhưng chứng từ VAT khách sạn có thể chuyển về sau.
* **Tính toàn vẹn dữ liệu (Data Integrity)**: Đảm bảo mọi đợt ở Khách sạn bắt buộc có ngày vào (`start_date`), và khi trả phòng có ngày ra (`end_date`).
* **Sẵn sàng cho việc tính toán tổng hợp chi phí (Future Extensibility)**: Lưu trữ số tiền hóa đơn thanh toán thủ công (`invoice_amount`) và tài liệu đính kèm trên từng bản ghi `Stay` để làm cơ sở cho phân hệ Báo cáo Tổng hợp & Đối chiếu Chi phí Khách sạn theo khoảng ngày.

## Considered Options

* **Option 1 (Chặt chẽ)**: Bắt buộc HR phải nhập số tiền hóa đơn (`invoice_amount` > 0) và tải lên ít nhất 1 tệp chứng từ đính kèm ngay tại thời điểm bấm Trả phòng Khách sạn.
* **Option 2 (Linh hoạt)**: Bắt buộc ngày vào (`start_date`) khi tạo mới và ngày ra (`end_date`) khi bấm Trả phòng. Số tiền hóa đơn thanh toán (`invoice_amount`) và tài liệu đính kèm được phép nhập ngay lúc trả phòng hoặc cập nhật/bổ sung sau.

## Decision Outcome

Chọn **Option 2**.

### Consequences

1. **Ràng buộc Tạo mới & Trả phòng Khách sạn**:
   - Khi tạo đợt Lưu trú Khách sạn: Bắt buộc nhập ngày vào (`start_date`), chọn Khách sạn (`hotel_id`) và Số phòng khách sạn (`hotel_room_number`).
   - Khi làm thủ tục Trả phòng Khách sạn: Bắt buộc nhập ngày ra (`end_date`).
2. **Quản lý Chi phí & Chứng từ Đính kèm**:
   - Trường `invoice_amount` (Số tiền hóa đơn thanh toán) và phân hệ `Attachment` gắn liền với `Stay`.
   - HR có thể cập nhật số tiền hóa đơn và tải chứng từ bất kỳ lúc nào (ngay khi trả phòng hoặc bổ sung sau).
3. **Cơ sở dữ liệu & Báo cáo**:
   - `Stay` được bổ sung trường `invoice_amount` kiểu số thực (`Float`/`Numeric`).
   - Phân hệ sẵn sàng cho việc tính tổng chi phí tiền khách sạn theo khoảng ngày trong tương lai.
