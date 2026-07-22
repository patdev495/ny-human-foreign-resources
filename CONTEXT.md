# NY Human Resources System

Hệ thống quản lý nhân sự dành cho công ty có nhân viên mang quốc tịch nước ngoài, bao gồm theo dõi hồ sơ pháp lý, chỗ ở, thị thực và các thông tin liên quan.

## Language

**Nhân viên nước ngoài** (Foreign Employee):
Người nước ngoài đang lưu trú tại KTX của công ty, bất kể loại visa (LĐ2, DN1, THĂM THÂN, ĐT1…) hay quan hệ với công ty. Tất cả đều được đối xử giống nhau về ăn uống, ở và điều xe.
_Avoid_: expat, lao động nước ngoài, người nước ngoài, cán bộ nước ngoài

**KTX** (Ký túc xá / Dormitory):
Nơi ở do công ty cung cấp cho Nhân viên nước ngoài. Được tổ chức theo Phòng.

**Phòng KTX** (Dormitory Room):
Đơn vị ở thuộc KTX của công ty (vd: 1601, 1607). Được quản lý độc lập trong Danh mục phòng KTX.

**Khách sạn** (Hotel):
Cơ sở lưu trú đối tác (vd: Khách sạn Mường Thanh, Khách sạn Rex, Khách sạn Hòa Bình). Được quản lý trong Danh mục Khách sạn.

**Loại chỗ ở** (Accommodation Type):
Có 2 loại: **KTX** (ký túc xá — công ty cung cấp) và **Khách sạn**. Một Lưu trú sẽ liên kết tới một **Phòng KTX** (nếu là KTX) hoặc một **Khách sạn** + **Số phòng khách sạn** (nếu là Khách sạn). Chỉ người ở KTX mới phát sinh chi phí ăn uống (`has_meals = True`). Người ở Khách sạn không phát sinh chi phí ăn (`has_meals = False`).

**Vị trí giường** (Bed Location):
Vị trí chỗ ngủ được phân bổ cụ thể trong một **Phòng KTX** hoặc **Khách sạn** (vd: Giường A, Giường B, 2 giường, 1 giường…). Thuộc về một **Lưu trú** cụ thể.

**Lưu trú** (Stay):
Một chuyến sang Việt Nam của Nhân viên nước ngoài — từ ngày đến đến ngày về nước. Trong 1 Lưu trú: Phòng KTX là cố định; lần sang tiếp theo là Lưu trú mới.
Mỗi Lưu trú mang cờ **có ăn** (has_meals) và **Loại hình** (cố định / công tác).
Một Lưu trú có thể có **nhiều Visa** (gia hạn giữa chừng không về nước) và **nhiều Tạm trú** (gia hạn tương tự).
_Avoid_: "cập nhật phòng", "đổi phòng", "đăng ký ăn"

**Visa**:
Một lần cấp phép nhập cảnh / lưu trú hợp pháp của Nhân viên nước ngoài. Thuộc về một Lưu trú. Một Lưu trú có thể có nhiều Visa nối tiếp nhau nếu gia hạn mà không về nước. Gồm: loại visa (DN1, LĐ2, THĂM THÂN, ĐT1…), ngày cấp/ngày vào, ngày hết hạn.

**Tạm trú**:
Một lần đăng ký tạm trú tại địa phương. Thuộc về một Lưu trú. Có thể gia hạn nhiều lần trong cùng một Lưu trú → nhiều bản ghi Tạm trú trên 1 Lưu trú.

**Ngày phải về nước** (Required Exit Date):
Hạn chót lịch trình cất cánh / về nước của Nhân viên nước ngoài trong một Đợt lưu trú (phân biệt với ngày hết hạn Visa hay Tạm trú).

**Loại hình** (Stay Type):
Tính chất của một **Lưu trú** cụ thể: **Cố định** (đóng quân dài hạn, ăn cơm đều đặn) hoặc **Công tác** (sang ngắn hạn theo đợt). Cùng một người có thể cố định ở chuyến này, công tác ở chuyến khác — Loại hình thuộc về Lưu trú, không thuộc về Nhân viên nước ngoài.
_Avoid_: "thường trú", "tạm thời"

**Vắng ăn** (Meal Absence):
Ngày một Nhân viên nước ngoài không ăn (ví dụ: về nước tạm thời, nghỉ phép). Ngày vắng ăn được ghi lại rổ — mặc định mọi ngày trong Lưu trú là có ăn. Chi phí ăn chỉ tính những ngày không vắng.
_Avoid_: "điểm danh", "check-in"

**Ngày sự kiện** (Event Day):
Ngày được đánh dấu đặc biệt, hiện tại chỉ có loại **Chủ tịch sang** — khả năng mở rộng sau. Đơn giá bữa ăn của ngày đó sẽ cao hơn đơn giá bình thường.

**Đơn giá bữa ăn** (Meal Price Config):
Giá mỗi bữa ăn, có lịch sử thay đổi theo thời gian. Mỗi bản ghi gồm: loại ngày (THƯỜNG / CHỦ_TỊCH_SANG), đơn giá, hiệu lực từ ngày nào.
Giá hiện tại: 35.000 VNĐ (ngày thường) và 50.000 VNĐ (ngày Chủ tịch sang). Có 2 bữa / ngày.

**Điều xe** (Vehicle Dispatch):
Dịch vụ đăng ký đưa đón Nhân viên nước ngoài di chuyển giữa KTX, Công ty, Sân bay, Cửa khẩu hoặc đi gặp khách hàng. Phân loại theo Loại xe (4 chỗ, 7 chỗ, 16 chỗ...) và Nhà cung cấp/Tài xế.

**Tra cứu 360°** (360° History Profile):
Giao diện tra cứu tập trung toàn bộ dữ liệu lịch sử của một Nhân viên nước ngoài bao gồm Hồ sơ cá nhân master, Dòng thời gian Lưu trú/Chỗ ở, Lịch sử Visa, Lịch sử Tạm trú và Nhật ký Vắng ăn.

## Relationships

- Một **Nhân viên nước ngoài** có nhiều **Lưu trú** theo thời gian.
- Tại một thời điểm, một **Nhân viên nước ngoài** chỉ có một **Lưu trú** đang active (end_date = null). Khi thêm nhân viên vào chỗ ở mới, nếu nhân viên đang có lượt ở active ở nơi khác, hệ thống phải cảnh báo xung đột và dừng thao tác để người dùng tự xử lý (ví dụ: làm thủ tục trả phòng cũ trước).
- Một **Phòng** có thể có nhiều **Lưu trú** đồng thời (nhiều người cùng phòng). Mỗi lưu trú có thể gán **Vị trí giường** (A, B...).
- Một **Lưu trú** có nhiều **Visa** và nhiều **Tạm trú** (gia hạn giữa chừng không về nước).
- Một **Lưu trú** có nhiều **Vắng ăn** (những ngày không tính tiền ăn).
- **Đơn giá bữa ăn** áp dụng cho một ngày được tra theo bản ghi hiệu lực gần nhất ứng với loại ngày (Đầy đủ hay Ngày sự kiện).

## Flagged ambiguities

_(Chưa có)_
