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
Bản ghi đăng ký vắng ăn của Nhân viên nước ngoài cho một ngày cụ thể trong đợt Lưu trú (ví dụ: về nước tạm thời, nghỉ phép, đi công tác ngoài). Hỗ trợ phân loại theo **Loại bữa vắng** (`meal_type`): **Sáng** (BREAKFAST), **Tối** (DINNER), hoặc **Cả ngày** (ALL_DAY - mặc định). Mặc định mọi ngày trong Lưu trú KTX là có ăn cả 2 bữa.
_Avoid_: "điểm danh", "check-in"

**Đăng ký ăn thêm** (Extra Meal Request):
Bản ghi đăng ký ăn bổ sung cho nhân sự không thuộc diện mặc định ăn KTX (ví dụ: nhân sự ở Khách sạn, người vắng ăn đổi lịch, hoặc khách công tác), phục vụ việc chốt dự báo số lượng suất ăn với nhà bếp.

**Báo cáo Dự báo Suất ăn** (Daily Meal Forecast Report):
Báo cáo thống kê tổng hợp số lượng suất ăn cần chuẩn bị cho từng bữa (Sáng/Tối) vào một ngày cụ thể (hoặc một khoảng ngày). HR có thể tra cứu danh sách chi tiết (ai ăn, ai vắng) và bật/tắt trạng thái ăn/vắng của từng người bất kể lúc nào. Công thức: Số người ở KTX - (Vắng theo bữa + Vắng cả ngày) + (Đăng ký ăn thêm theo bữa).

**Chốt suất ăn theo Bữa** (Meal Session Lock):
Thao tác đóng băng (Snapshot) tập trung số lượng suất ăn chính thức báo nhà bếp cho từng bữa cụ thể: **Sáng** (`BREAKFAST` - NNN), **Trưa** (`LUNCH` - Lao công), hoặc **Tối** (`DINNER` - NNN) trong ngày. Mỗi bữa chỉ được phép Chốt duy nhất **1 lần** cho toàn bộ hệ thống.
- **Giao diện Modal Chốt suất ăn**: Liệt kê chi tiết danh sách breakdown theo từng **Khối Nhân sự** (VD: Nhân viên nước ngoài bao nhiêu suất / đơn giá bao nhiêu; Lao công bao nhiêu suất / đơn giá bao nhiêu).
- **Hệ thống đề xuất**: Số suất tính toán tự động và đơn giá theo từng Khối Nhân sự (tra từ Danh mục Loại ngày & Đơn giá Suất ăn).
- **Quyền điều chỉnh**: HR có quyền điều chỉnh số suất thực chốt (`final_meal_count`), đơn giá thực chốt (`locked_price_per_meal`) của từng Khối Nhân sự, và nhập ghi chú lý do điều chỉnh.
- **Đóng băng (Snapshot)**: Khi bấm Chốt, hệ thống lưu trữ bản ghi Chốt chung kèm danh sách chi tiết (details) từng khối: $\text{Tổng tiền bữa chốt} = \sum (\text{final\_meal\_count}_{\text{khối}} \times \text{locked\_price\_per\_meal}_{\text{khối}})$.

**Khối Nhân sự** (Participant / Employee Group):
Phân loại các đối tượng nhân sự tham gia hệ thống và có chế độ ăn uống hoặc quản lý chuyên biệt: **Nhân viên nước ngoài** (`FOREIGN_EMPLOYEE` - ăn bữa Sáng & Tối), **Lao công** (`JANITOR` - ăn 1 bữa Trưa), v.v.

**Danh mục Loại ngày & Đơn giá Suất ăn** (Day Type & Meal Price Config):
Danh mục định nghĩa các loại ngày trong hệ thống và đơn giá bữa ăn tương ứng cho từng bữa / Khối Nhân sự (`MealPriceConfig`):
- **Nhân viên nước ngoài**: Đơn giá bữa **Sáng** (`foreign_breakfast_price`) và bữa **Tối** (`foreign_dinner_price`) được cài đặt riêng biệt.
- **Lao công**: Đơn giá 1 bữa **Trưa** (`janitor_meal_price`) được cài đặt riêng.
- **Loại ngày đặc biệt / Sự kiện do HR định nghĩa**: Khi tạo mới/chỉnh sửa sự kiện (`PRESIDENT_VISIT`, `TET`...), HR phải thiết lập đầy đủ cả 3 mức giá (không được bỏ trống). Hệ thống tự động gợi ý điền sẵn theo giá Ngày bình thường (`NORMAL`).

**Cài đặt Sự kiện / Gán loại ngày** (Event Settings & Date Assignment):
Tính năng đánh dấu loại ngày cho một ngày đơn lẻ hoặc một khoảng ngày:
- **Khoảng ngày**: Nhập từ `start_date` đến `end_date` + Chọn Loại ngày $\rightarrow$ Hệ thống tự động gán toàn bộ các ngày trong khoảng sang loại ngày đã chọn.
- **Ngày đơn lẻ**: Nhập 1 trong 2 ô ngày tháng (hoặc `start_date` == `end_date`) + Chọn Loại ngày $\rightarrow$ Gán loại ngày cho ngày đơn lẻ đó.

**Điều xe** (Vehicle Dispatch):
Dịch vụ đăng ký đưa đón Nhân viên nước ngoài di chuyển giữa KTX, Công ty, Sân bay, Cửa khẩu hoặc đi gặp khách hàng. Phân loại theo Loại xe (4 chỗ, 7 chỗ, 16 chỗ...) và Nhà cung cấp/Tài xế.

**Tra cứu 360°** (360° History Profile):
Giao diện tra cứu tập trung toàn bộ dữ liệu lịch sử của một Nhân viên nước ngoài bao gồm Hồ sơ cá nhân master, Dòng thời gian Lưu trú/Chỗ ở, Lịch sử Visa, Lịch sử Tạm trú và Nhật ký Vắng ăn.

**Tài liệu đính kèm** (Document Attachment):
Tệp tin hình ảnh (PNG, JPEG, WEBP...) hoặc tệp tài liệu PDF được đính kèm vào các bản ghi giấy tờ của Nhân viên nước ngoài (Hộ chiếu, Visa, Tạm trú, Giấy phép lao động, Hợp đồng lao động). Một bản ghi giấy tờ có thể đính kèm nhiều tệp tin.

**Nhật ký Nhập xuất cảnh** (Travel Record):
Bản ghi theo dõi các đợt di chuyển giữa Việt Nam và nước ngoài của Nhân viên nước ngoài. Mỗi đợt có **Ngày đến Việt Nam** (entry_date), **Ngày dự kiến sang** (expected_entry_date), **Ngày dự kiến về** (expected_exit_date) và **Ngày thực tế đã về** (actual_exit_date).
- Khi nhân sự đang ở Việt Nam $\rightarrow$ Nhãn hiển thị là **Ngày dự kiến về**.
- Khi nhân sự đang ở nước ngoài (đã về nước) $\rightarrow$ Nhãn hiển thị chuyển thành **Ngày dự kiến sang** đợt tiếp theo để theo dõi và chuẩn bị cảnh báo.

**Trung tâm Xuất Báo cáo** (Report Hub / Center):
Giao diện tập trung trên thanh Sidebar dành riêng cho việc chọn loại báo cáo, thiết lập tham số lọc và xuất các file Excel chuẩn hóa theo từng nghiệp vụ (Pháp lý, KTX, Chi phí Ăn uống, Nhật ký Điều xe). Hỗ trợ tùy chọn **"Xuất trọn gói ZIP"** nén file Excel kèm toàn bộ tệp đính kèm (Hình ảnh Hộ chiếu/Visa/GPLĐ/HĐLĐ & tệp PDF) được phân loại theo thư mục từng nhân viên.

**Báo cáo Excel Hồ sơ & Pháp lý** (Master & Legal Profile Excel Report):
Báo cáo Excel 2 Tab gồm:
- **Sheet 1 (`[Danh sách Nhân sự]`)**: Mỗi nhân viên đúng 1 dòng, hiển thị đầy đủ thông tin Master cá nhân + các giấy tờ Visa/Tạm trú/GPLĐ/HĐLĐ mới nhất đang hiệu lực, tự động tô màu cảnh báo hạn (Đỏ: hết hạn, Vàng: sắp hết hạn <= 30 ngày).
- **Sheet 2 (`[Lịch sử Giấy tờ]`)**: Nhật ký ghi nhận toàn bộ lịch sử các đợt cấp Visa, Tạm trú, GPLĐ, HĐLĐ của từng nhân viên.

**Báo cáo Excel Hiện diện & Chỗ ở** (Presence & Accommodation Excel Report):
Báo cáo Excel 3 Tab gồm:
- **Sheet 1 (`[Sơ đồ KTX & Khách sạn]`)**: Danh sách nhân sự đang ở Việt Nam và đã xếp chỗ (KTX / Khách sạn).
- **Sheet 2 (`[Chưa xếp chỗ ở]`)**: Danh sách nhân sự đang ở Việt Nam nhưng chưa được phân bổ phòng.
- **Sheet 3 (`[Đã về nước]`)**: Danh sách nhân sự hiện không ở Việt Nam (kèm ngày thực tế đã về và ngày dự kiến sang đợt tới).
**Cấu hình Mốc Cảnh báo Giấy tờ** (Document Warning Threshold Config):
Cấu hình mốc thời gian cảnh báo hết hạn cho 5 loại giấy tờ pháp lý của Nhân viên nước ngoài: Visa, Tạm trú, Giấy phép lao động (GPLĐ), Hợp đồng lao động và Hộ chiếu. Mỗi loại giấy tờ có thể thiết lập số lượng đi kèm đơn vị tính theo **Ngày** (DAYS) hoặc **Tháng** (MONTHS) (mặc định ban đầu tất cả 5 loại là 30 Ngày). Các mốc được lưu trữ tập trung ở Backend Database để phục vụ hiển thị phân loại trên UI cũng như làm căn cứ gửi Email thông báo cảnh báo tự động.




## Relationships

- Một **Nhân viên nước ngoài** có nhiều **Lưu trú** theo thời gian.
- Tại một thời điểm, một **Nhân viên nước ngoài** chỉ có một **Lưu trú** đang active (end_date = null). Khi thêm nhân viên vào chỗ ở mới, nếu nhân viên đang có lượt ở active ở nơi khác, hệ thống phải cảnh báo xung đột và dừng thao tác để người dùng tự xử lý (ví dụ: làm thủ tục trả phòng cũ trước).
- Một **Phòng** có thể có nhiều **Lưu trú** đồng thời (nhiều người cùng phòng). Mỗi lưu trú có thể gán **Vị trí giường** (A, B...).
- Một **Lưu trú** có nhiều **Visa** và nhiều **Tạm trú** (gia hạn giữa chừng không về nước).
- Một **Lưu trú** có nhiều **Vắng ăn** (những ngày không tính tiền ăn).
- **Đơn giá bữa ăn** áp dụng cho một ngày được tra theo bản ghi hiệu lực gần nhất ứng với loại ngày (Đầy đủ hay Ngày sự kiện).
- Khi ghi nhận **Ngày thực tế đã về nước** (`actual_exit_date`), trạng thái nhân sự chuyển thành "Đã về nước". Nếu nhân sự đang ở KTX, HR chọn 1 trong 2 phương án: (1) **Trả phòng**: kết thúc Lưu trú (`end_date = actual_exit_date`), giải phóng giường; hoặc (2) **Giữ phòng**: duy trì Đợt lưu trú nhưng đánh dấu vắng ăn trong thời gian về nước để không tính tiền cơm.

## Flagged ambiguities

_(Chưa có)_
