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

**Lưu trú Khách sạn** (Hotel Stay):
Một đợt ở khách sạn của Nhân viên nước ngoài. Khi tạo mới bắt buộc phải có **Ngày vào** (`start_date`). Khi rời đi, HR thao tác Trả phòng Khách sạn để nhập **Ngày ra** (`end_date`). **Số tiền hóa đơn thanh toán** (`invoice_amount`) và các **Tài liệu đính kèm** (Hóa đơn GTGT, Giấy tờ tạm trú khách sạn, Xác nhận phòng) có thể đính kèm ngay lúc trả phòng hoặc cập nhật/bổ sung sau (linh hoạt theo thời điểm đối tác xuất hóa đơn). Dữ liệu này làm nền tảng cho chức năng tổng hợp đối chiếu chi phí khách sạn theo khoảng ngày.

**Loại chỗ ở** (Accommodation Type):
Có 2 loại: **KTX** (ký túc xá — công ty cung cấp) và **Khách sạn**. Một Lưu trú sẽ liên kết tới một **Phòng KTX** (nếu là KTX) hoặc một **Khách sạn** + **Số phòng khách sạn** (nếu là Khách sạn). Chỉ người ở KTX mới phát sinh chi phí ăn uống (`has_meals = True`). Người ở Khách sạn không phát sinh chi phí ăn KTX (`has_meals = False`) mà quản lý theo số tiền hóa đơn đợt ở.

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

**Ngày dự kiến về nước** (Expected Exit Date):
Mốc thời gian dự kiến cất cánh / kết thúc đợt lưu trú tại Việt Nam của Nhân viên nước ngoài trong một đợt di chuyển (`TravelRecord`). Dùng làm căn cứ tính toán cảnh báo quá hạn đợt lưu trú (`is_overdue_exit`) và xếp lịch điều xe đưa đón sân bay.

**Ngày thực tế đã về nước** (Actual Exit Date):
Ngày thực tế Nhân viên nước ngoài đã bay / xuất cảnh rời Việt Nam. Khi trường này có giá trị, trạng thái nhân sự chuyển sang "Đã về nước".
_Avoid_: "ngày phải về nước", "hạn về nước"

**Loại hình** (Stay Type):
Tính chất của một **Lưu trú** cụ thể: **Cố định** (đóng quân dài hạn, ăn cơm đều đặn) hoặc **Công tác** (sang ngắn hạn theo đợt). Cùng một người có thể cố định ở chuyến này, công tác ở chuyến khác — Loại hình thuộc về Lưu trú, không thuộc về Nhân viên nước ngoài.
_Avoid_: "thường trú", "tạm thời"

**Vắng ăn** (Meal Absence):
Bản ghi đăng ký vắng ăn của Nhân viên nước ngoài cho một ngày cụ thể trong đợt Lưu trú (ví dụ: về nước tạm thời, nghỉ phép, đi công tác ngoài). Hỗ trợ phân loại theo **Loại bữa vắng** (`meal_type`): **Sáng** (BREAKFAST), **Tối** (DINNER), hoặc **Cả ngày** (ALL_DAY - mặc định). Mặc định mọi ngày trong Lưu trú KTX là có ăn cả 2 bữa. Trường hợp nhân sự vắng ăn thay đổi lịch đột xuất (vd: đăng ký vắng cả ngày nhưng tối về ăn), HR sẽ chủ động điều chỉnh bản ghi Vắng ăn (chuyển từ Vắng cả ngày sang Vắng bữa Sáng) hoặc điều chỉnh số suất thực chốt tại Modal Chốt suất ăn.
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
Danh mục định nghĩa các loại ngày trong hệ thống và đơn giá bữa ăn/chi phí tương ứng cho từng bữa / Khối Nhân sự (`MealPriceConfig`):
- **Nhân viên nước ngoài**: Đơn giá bữa **Sáng** (`foreign_breakfast_price`) và bữa **Tối** (`foreign_dinner_price`) được cài đặt riêng biệt.
- **Lao công / Tạp vụ**: Đơn giá 1 bữa **Trưa** (`janitor_meal_price`) được cài đặt riêng.
- **Tiền Hoa quả**: Số tiền hoa quả theo ngày (`fruit_allowance_price`), mặc định ban đầu là 60,000đ/ngày. Mỗi ngày xác nhận báo cáo suất ăn (Meal Session Lock / Daily Forecast), HR sẽ xác nhận cả số tiền hoa quả thực tế cho ngày đó.
- **Loại ngày đặc biệt / Sự kiện do HR định nghĩa**: Khi tạo mới/chỉnh sửa sự kiện (`PRESIDENT_VISIT`, `TET`...), HR phải thiết lập đầy đủ các mức giá (không được bỏ trống). Hệ thống tự động gợi ý điền sẵn theo giá Ngày bình thường (`NORMAL`).

**Nơi làm việc Tạp vụ** (Janitor Workplace Location):
Phân loại vị trí làm việc của Nhân sự Lao công / Tạp vụ: **KTX** (`DORMITORY`) hoặc **Công ty** (`COMPANY`). Chỉ những tạp vụ có nơi làm việc tại **KTX** mới được tính chi phí suất ăn trưa vào Báo cáo Chi phí Suất ăn KTX (`Suất ăn tạp vụ`). Lao công làm tại Công ty không tính vào báo cáo KTX. Nếu Tạp vụ KTX được ghi nhận **Nghỉ** (nửa ngày hoặc cả ngày) trong Bản ghi Điểm danh Tạp vụ của ngày đó, hệ thống sẽ tự động trừ đi suất ăn trưa gợi ý tương ứng trong Báo cáo Dự báo Suất ăn & Chốt suất ăn bữa Trưa.

**Cài đặt Sự kiện / Gán loại ngày** (Event Settings & Date Assignment):
Tính năng đánh dấu loại ngày cho một ngày đơn lẻ hoặc một khoảng ngày:
- **Khoảng ngày**: Nhập từ `start_date` đến `end_date` + Chọn Loại ngày $\rightarrow$ Hệ thống tự động gán toàn bộ các ngày trong khoảng sang loại ngày đã chọn.
- **Ngày đơn lẻ**: Nhập 1 trong 2 ô ngày tháng (hoặc `start_date` == `end_date`) + Chọn Loại ngày $\rightarrow$ Gán loại ngày cho ngày đơn lẻ đó.

**Quản lý xe** (Vehicle Management):
Sub-system / Phân hệ độc lập quản lý việc điều động phương tiện di chuyển, danh mục nhà xe, xe công ty, xe thuê ngoài và hợp đồng / bảng giá chi phí điều xe. Trên Sidebar, phân hệ này hiển thị dưới dạng nhóm Accordion gồm 3 mục con tinh gọn: **Nhật ký Điều xe**, **Nhật ký Quãng đường di chuyển**, và **Quản lý Hợp đồng & Nhà xe**.

**Quản lý Hợp đồng & Nhà xe** (Unified Vehicle Contract & Provider Management):
Mục quản lý tập trung toàn bộ hợp đồng và quy tắc tính cước của tất cả các nhà xe (cả nhà xe công ty và nhà xe ngoài). Giao diện được thiết kế mô đun dạng Sub-tab mở rộng để sẵn sàng tiếp nhận thêm các loại hợp đồng/nhà xe mới trong tương lai. Hiện tại gồm 2 loại chính:
- **Hợp đồng Thuê xe Khoán tháng** (chuyến xe công ty / Đức Anh): Quản lý gói cước khoán tháng, hạn mức KM, đơn giá phụ trội KM, phụ cấp ca đêm, ngày lễ/chủ nhật, chi phí lưu đêm.
- **Hợp đồng Tuyến đường & Đơn giá chuyến** (nhà xe ngoài / Bình An...): Quản lý bảng giá tuyến cố định (khứ hồi/1 chiều), đơn giá KM ngoài hợp đồng, và phụ phí thời gian chờ.

**Nhà xe / Đơn vị vận tải** (Vehicle Provider):
Đơn vị cung cấp dịch vụ vận tải hoặc quản lý nhóm xe, gồm:
- **Xe ngoài** (`OUTSOURCED`): Các nhà xe đối tác theo hợp đồng (vd: **Bình An**). Mỗi nhà xe có bảng giá tuyến đường riêng.
- **Xe công ty** (`COMPANY_OWNED`): Nhóm xe thuộc sở hữu hoặc thuê khoán cố định theo tháng phục vụ công ty (vd: **Chú Ngọc**, **Chú Đại**, **Xe Đức Anh** - gồm 2 xe 7 chỗ TOYOTA Innova và 1 xe tải 8 tấn CNHTC).

**Bảng giá Hợp đồng Tuyến đường** (Vendor Route Matrix):
Danh mục các tuyến đường định sẵn và đơn giá cố định theo hợp đồng cho từng loại xe (4 chỗ, 7 chỗ, 16 chỗ...). Mặc định áp dụng quy tắc khứ hồi **Ngược lại đồng giá**.

**Cơ chế Tính cước Tự động**:
- **Tuyến cố định trong HĐ** (`FIXED_ROUTE`): Tự động lấy đơn giá theo tuyến đường đã thỏa thuận trong hợp đồng.
- **Chạy theo KM ngoài HĐ** (`KM_BASED`): Tính phí mặc định **14.000 đ/km** (đã bao gồm xăng dầu, cầu đường, bến đỗ).
- **Phụ phí thời gian chờ**: Mặc định **30.000 đ/giờ** (`THỜI GIAN CHỜ: 30K/h`).
- $\text{Tổng cước gợi ý} = \text{Giá cơ bản (Tuyến cố định hoặc KM)} + (\text{Số giờ chờ} \times 30.000\text{đ})$. HR có quyền điều chỉnh số tiền chốt thực tế.

**Kỳ đối chiếu thanh toán cước xe** (Vehicle Billing Cycle):
Khung thời gian lọc và chốt cước thuê xe ngoài hàng tháng, mặc định tính từ **ngày 26 tháng trước đến ngày 25 tháng này** (VD: *26.04 - 25.05*).

**Bảng giá Hợp đồng Thuê xe khoán tháng Đức Anh** (Monthly Leased Vehicle Contract Pricing Matrix):
Cấu hình bảng giá khoán tháng cho nhóm xe Đức Anh thuộc Đội xe công ty:
- **Gói Xe 7 chỗ** (2 xe TOYOTA Innova: `98A-369.00` - Lái xe **Anh Ngọc** & `98A-819.88` - Lái xe **Chú Đại**): Giá thuê cơ bản **25.000.000 VNĐ/tháng/xe** (hạn mức 3.000 km/tháng). Đơn giá km phụ trội: **6.500 VNĐ/km**.
  - *Giờ làm việc chuẩn*: 7h00 AM - 18h00 PM (Thứ 2 đến Thứ 7).
  - *Ngày thường*: Chạy trong khoảng 18h00 - 22h00 trả hỗ trợ phụ cấp cố định **100.000 VNĐ** (chạy bao nhiêu cũng 100k); Tăng ca tính **50.000 VNĐ/giờ** cho khoảng trước 7h00 AM và sau 22h00 PM.
  - *Chủ nhật & Ngày Lễ/Tết*: Mức ngày **1.000.000 VNĐ/ngày** (Chủ nhật) / **1.200.000 VNĐ/ngày** (Lễ Tết); Tăng ca tính **50.000 VNĐ/giờ** cho khoảng trước 7h30 AM và sau 18h00 PM. Qua đêm: **300.000 VNĐ/đêm**.
- **Gói Xe tải 8 tấn** (1 xe CNHTC 7.4 tấn: `99H-103.78`): Giá thuê cơ bản **42.000.000 VNĐ/tháng/xe** (hạn mức 3.000 km/tháng). Đơn giá km phụ trội: **10.000 VNĐ/km**.
  - *Giờ làm việc chuẩn*: 8h00 AM - 18h00 PM (Thứ 2 đến Thứ 7).
  - *Ngày thường*: Không có mốc cố định 100k; cứ ra ngoài khung 8h00 - 18h00 (trước 8h00 AM và sau 18h00 PM) là tính tăng ca **50.000 VNĐ/giờ**.
  - *Chủ nhật & Ngày Lễ/Tết*: Mức ngày **1.000.000 VNĐ/ngày** (Chủ nhật) / **1.200.000 VNĐ/ngày** (Lễ Tết); Tăng ca trước 8h00 AM và sau 18h00 PM tính **100.000 VNĐ/giờ**. Chi phí ăn ngoài: **50.000 VNĐ/bữa**. Qua đêm: **300.000 VNĐ/đêm**.

**Nhật ký Quãng đường di chuyển** (Daily Vehicle Distance Log):
Giao diện quản lý riêng dưới dạng Tab **"Nhật ký Quãng đường di chuyển"** trong phân hệ Quản lý xe, cho phép HR ghi nhận chỉ số công tơ mét đầu ngày (`start_km`) và cuối ngày (`end_km`) của từng xe Đức Anh (hỗ trợ tải tệp ảnh bằng chứng odometer tài xế gửi) để tính tự động tổng KM thực tế chạy trong ngày và lũy kế KM trong chu kỳ 26 tháng trước -> 25 tháng này. Các chuyến điều xe lẻ trong ngày ghi nhận hành trình (điểm đi, điểm đến) và thời điểm bắt đầu/kết thúc mà không bắt buộc nhập số KM từng chuyến. **Giờ Bắt đầu** (`Giờ B.Đầu`) và **Giờ Kết thúc** (`Giờ K.Thúc`) của xe trong ngày được hệ thống tự động tổng hợp từ giờ đón chuyến đầu tiên và giờ về chuyến cuối cùng trong ngày.


**Điều xe** (Vehicle Dispatch):
Bản ghi tạo và quản lý chuyến đi đưa đón nhân sự trực tiếp. HR có thể chọn Nhà xe, Tuyến đường HĐ hoặc nhập số KM, hệ thống tự động gợi ý giá và lưu lại thông tin tài xế, biển số, hành khách và chi phí. Bản ghi hỗ trợ lưu trữ các chi phí phát sinh theo chuyến bao gồm: **Tiền vé xe / Phí cầu đường** (`toll_fee`), **Số bữa ăn ngoài tài xế** (`meal_count`), và **Số đêm qua đêm** (`overnight_count`) để tổng hợp tự động vào Báo cáo cước tháng xe Đức Anh.






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
- **Sheet 1 (`[Sơ đồ KTX & Khách sạn]`)**: Danh sách nhân sự đang ở Việt Nam và đã xếp chỗ (KTX / Khách sạn). Cột *"Nơi ở / Phòng"* hiển thị rõ *"Phòng 1601"* (với KTX) hoặc *"Khách sạn Mường Thanh - P.201"* (với Khách sạn), kèm cột Phân loại chỗ ở (`accommodation_type`) và Số tiền hóa đơn đợt ở (`invoice_amount`).
- **Sheet 2 (`[Chưa xếp chỗ ở]`)**: Danh sách nhân sự đang ở Việt Nam nhưng chưa được phân bổ phòng.
- **Sheet 3 (`[Đã về nước]`)**: Danh sách nhân sự hiện không ở Việt Nam (kèm ngày thực tế đã về và ngày dự kiến sang đợt tới).

**Báo cáo Excel Chi phí Ăn uống theo Chu kỳ Ngày** (Daily Meal Expense Excel Report):
Báo cáo Excel 1 Sheet duy nhất (`dd.MM - dd.MM`) tính toán chi phí ăn uống chi tiết từng ngày trong chu kỳ được chọn (ví dụ: `27.07-26.08`). Layout bảng tính theo ngày chuẩn hóa gồm các cột: STT, Ngày, Buổi sáng NNN (Thực chi = Suất * Đơn giá, Số suất, Đơn giá), Buổi tối NNN (Thực chi = Suất * Đơn giá, Số suất, Đơn giá), Tiền Hoa quả (xác nhận theo ngày, mặc định 60,000đ/ngày làm việc), Suất ăn Tạp vụ (chỉ tính tạp vụ làm tại KTX, số suất * đơn giá chốt theo ngày), Tổng tiền (= Sáng + Tối + Hoa quả + Tạp vụ KTX), và Ghi chú.
- **Ràng buộc Chốt suất ăn trước khi xuất**: Khi HR thực hiện xuất báo cáo, hệ thống tự động kiểm tra tất cả các ngày làm việc trong khoảng thời gian được chọn (ngoại trừ các ngày **Chủ nhật** là ngày nghỉ mặc định không phục vụ suất ăn và không tính chi phí). Nếu có bất kỳ ngày làm việc nào chưa chốt hoặc chốt thiếu (thiếu bữa Sáng/Tối NNN, thiếu Trưa Tạp vụ KTX, hoặc chưa xác nhận Tiền hoa quả), hệ thống sẽ **từ chối xuất báo cáo** và hiển thị thông báo chi tiết danh sách các ngày / bữa chưa chốt kèm nút chuyển hướng nhanh để HR hoàn tất chốt suất ăn trước. Trên file Excel xuất ra, dòng các ngày Chủ nhật vẫn hiển thị STT và Ngày; các ô số suất ăn, đơn giá, tiền hoa quả, suất ăn tạp vụ để trống / hiển thị dấu gạch ngang (`-`) chuẩn xác giống hệt mẫu file thực tế của công ty, và ô Tổng tiền ngày bằng 0.

**Báo cáo Excel Chấm công & Lương Tạp vụ** (Janitor Attendance & Payroll Excel Report):
Báo cáo Excel chấm công và tính lương cho toàn bộ nhân sự Lao công / Tạp vụ (`employee_type = 'JANITORIAL'`) trong khoảng thời gian (chu kỳ tháng). File chứa các cột thông tin nhân sự (Mã NV, Họ và tên, Bộ phận, Nơi làm việc...), chuỗi các ngày trong tháng với ký tự chấm công ('N': ngày làm việc, 'X': nghỉ phép/vắng cả ngày, '0.5': nghỉ nửa ngày, Chủ nhật để trống), cột tổng hợp Số công (`COUNTIFS`), Mức lương (tháng hoặc ngày), và Thành tiền.

**Báo cáo Excel Xe Đức Anh Khoán tháng** (Đức Anh Leased Vehicles Excel Report):
Báo cáo cước thuê xe khoán tháng cho 3 xe công ty (Đức Anh), được xuất riêng từ Trung tâm Xuất Báo cáo Excel trên Sidebar theo khoảng thời gian tùy chọn. Kết quả trả về dạng **Tệp nén ZIP** chứa 3 file Excel riêng biệt tương ứng với từng xe (`98A-819.88`, `98A-369.00`, `99H-103.78`). Mỗi file được trình bày theo đúng mẫu bảng đối chiếu khối lượng & giá trị sử dụng xe thực tế (gồm tiêu đề công ty, chi tiết từng ngày trong kỳ, số km công tơ mét, giờ bắt đầu/kết thúc, tăng ca, tiền ăn, lưu đêm, phí cầu đường và tổng thành tiền).


**Ghi nhận Nghỉ Tạp vụ** (Janitor Daily Attendance Record):
Bản ghi điểm danh hàng ngày dành riêng cho Khối Tạp vụ (`JANITORIAL`). Mặc định tất cả Tạp vụ đi làm đủ (1.0 công). HR sử dụng giao diện Điểm danh hàng ngày (truy cập qua mục menu sổ xuống **"Nhân sự Tạp vụ"** $\rightarrow$ **"Điểm danh hàng ngày"** trên Sidebar; mục còn lại là **"Hồ sơ & Thông tin"**) để ghi nhận các trường hợp vắng/nghỉ: **Nghỉ cả ngày** (1 ngày vắng, ký hiệu `X`), hoặc **Nghỉ nửa ngày** (0.5 công, ký hiệu `0.5`), kèm theo **Lý do nghỉ** (ví dụ: nghỉ phép, nghỉ ốm, việc riêng...). Hỗ trợ ghi nhận nhanh cho một ngày đơn lẻ hoặc đăng ký nghỉ theo khoảng ngày (`start_date` đến `end_date`), cho phép xem/sửa quá khứ cũng như đăng ký trước trong tương lai. Dữ liệu này được tổng hợp trực tiếp vào Báo cáo Chấm công & Lương Tạp vụ và Báo cáo Suất ăn KTX (nếu tạp vụ KTX nghỉ trưa).


**Cấu hình Mốc Cảnh báo Giấy tờ** (Document Warning Threshold Config):
Cấu hình mốc thời gian cảnh báo hết hạn cho 5 loại giấy tờ pháp lý của Nhân viên nước ngoài: Visa, Tạm trú, Giấy phép lao động (GPLĐ), Hợp đồng lao động và Hộ chiếu. Mỗi loại giấy tờ có thể thiết lập số lượng đi kèm đơn vị tính theo **Ngày** (DAYS) hoặc **Tháng** (MONTHS) (mặc định ban đầu tất cả 5 loại là 30 Ngày). Các mốc được lưu trữ tập trung ở Backend Database để phục vụ hiển thị phân loại trên UI cũng như làm căn cứ gửi Email thông báo cảnh báo tự động.

**Thông báo Cảnh báo Giấy tờ qua Email** (Document Warning Email Notification):
Tính năng gửi email tự động dạng bản tin gộp hàng ngày (Daily Digest Email) lúc 08:00 sáng đến danh sách hòm thư nhận cảnh báo của bộ phận HR (xem qua ứng dụng email client như Foxmail, Outlook...).
- **Cấu hình kết nối SMTP Server**: Thiết lập tập trung tại file môi trường `.env` phía Backend (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`).
- **Quản lý danh sách email nhận**: Lưu trữ ở Backend DB và cho phép HR quản lý, thêm/bớt các địa chỉ email nhận thư trực tiếp trên giao diện Cấu hình Mốc Cảnh báo Giấy tờ (UI). Hỗ trợ nút **"Gửi thư kiểm tra"** (Send Test Mail) và nút **"Gửi cảnh báo ngay"** (Trigger Now) để chủ động phát hành bản tin ngoài khung giờ tự động.
- **Định dạng Email HTML**: Bảng tổng hợp hiển thị rõ nét trên Foxmail với 2 khối phân màu: 🔴 **Đỏ** (giấy tờ đã quá hạn) và 🟡 **Vàng** (giấy tờ sắp hết hạn trong ngưỡng mốc cấu hình) kèm đầy đủ thông tin nhân sự và link mở hệ thống xử lý.





## Relationships

- Một **Nhân viên nước ngoài** có nhiều **Lưu trú** theo thời gian.
- Tại một thời điểm, một **Nhân viên nước ngoài** chỉ có một **Lưu trú** đang active (end_date = null). Khi thêm nhân viên vào chỗ ở mới, nếu nhân viên đang có lượt ở active ở nơi khác, hệ thống phải cảnh báo xung đột và dừng thao tác để người dùng tự xử lý (ví dụ: làm thủ tục trả phòng cũ trước).
- Một **Phòng** có thể có nhiều **Lưu trú** đồng thời (nhiều người cùng phòng). Mỗi lưu trú có thể gán **Vị trí giường** (A, B...).
- Một **Lưu trú** có nhiều **Visa** và nhiều **Tạm trú** (gia hạn giữa chừng không về nước).
- Một **Lưu trú** có nhiều **Vắng ăn** (những ngày không tính tiền ăn).
- **Đơn giá bữa ăn** áp dụng cho một ngày được tra theo bản ghi hiệu lực gần nhất ứng với loại ngày (Đầy đủ hay Ngày sự kiện).
- Khi ghi nhận **Ngày thực tế đã về nước** (`actual_exit_date`), trạng thái nhân sự chuyển thành "Đã về nước". Nếu nhân sự đang ở KTX, HR chọn 1 trong 2 phương án: (1) **Trả phòng**: kết thúc Lưu trú (`end_date = actual_exit_date`), giải phóng giường; hoặc (2) **Giữ phòng**: duy trì Đợt lưu trú nhưng đánh dấu vắng ăn trong thời gian về nước để không tính tiền cơm.
- Một **Bản ghi Điều xe** (`VehicleDispatch`) tham chiếu tới một **Loại xe** (`Vehicle`). Mỗi **Loại xe** thuộc 1 trong 2 **Nhóm sở hữu xe** (`COMPANY_OWNED` hoặc `OUTSOURCED`).
- Khi lập bản ghi Điều xe, các trường thông tin (tài xế, biển số, đơn giá) được sao chép/gợi ý từ Danh mục xe sang Bản ghi Điều xe và cho phép HR sửa đổi tự do mà không ảnh hưởng tới dữ liệu master của Danh mục Xe.


## Flagged ambiguities

_(Chưa có)_
