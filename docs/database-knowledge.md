# Kiến thức cơ sở dữ liệu — NY Human Resources System

> Phạm vi: tài liệu này mô tả CSDL **theo mã nguồn hiện tại** (backend SQLAlchemy), quy tắc dữ liệu được tầng dịch vụ thực thi, cùng các script khởi tạo/migration/seed. Đây không phải là bản dump của một môi trường cụ thể.

## 1. Tổng quan kỹ thuật

- DB sản xuất là **Microsoft SQL Server 2008 R2**; backend truy cập qua SQLAlchemy 2.x với dialect `mssql+pyodbc` và **ODBC Driver 18 for SQL Server**.
- Chuỗi kết nối được tạo từ `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DRIVER`; có `TrustServerCertificate=yes`.
- Mỗi yêu cầu lấy một `SessionLocal`; session không tự commit và luôn được đóng sau khi dùng.
- `init_db()` nạp model của cả hai feature rồi gọi `Base.metadata.create_all()`. Sau đó nó thực hiện một loạt `ALTER TABLE` idempotent cho một số cột cũ/mới.
- Tên tiếng Việt và tiếng Trung dùng `Unicode`/`UnicodeText`, tương ứng với kiểu Unicode của SQL Server. Các trường số tiền và quãng đường hiện dùng `Float`, không phải `DECIMAL`.
- Bảng được chia theo hai phân hệ: `hr_foreign` (nhân sự nước ngoài, KTX, tạp vụ) và `vehicle_management` (nhà xe, xe, điều xe).

```text
ForeignEmployee 1 ── * TravelRecord 1 ── * Stay
       │                                  ├── 0..1 Room
       │                                  └── 0..1 Hotel
       ├── * Visa
       ├── * TamTru
       ├── * WorkPermit
       ├── * Contract
       └── * JanitorAttendanceRecord

Stay 1 ── * MealAbsence
Stay 1 ── * MealExtra

VehicleProvider 1 ── * Vehicle ── 0..1 MonthlyVehicleContract
       │                    ├── * VehicleDispatch
       │                    └── * DailyOdometerLog
       └── * VendorRoute
```

`DocumentAttachment` dùng cặp khóa nghiệp vụ `entity_type` + `entity_id`, nên **không có foreign key vật lý** tới bảng giấy tờ. `EventDay`, cấu hình suất ăn, cấu hình cảnh báo và log email là các bảng độc lập.

## 2. Quy ước chung

- Mọi bảng model hiện tại dùng khóa chính số nguyên `id`; đa số được tạo tự tăng.
- `index=True` tạo index đơn trên cột tương ứng. Những index được khai báo rõ trong model có ý nghĩa quan trọng ở các danh sách tra cứu.
- `unique=True`/`UniqueConstraint` mới là ràng buộc duy nhất thật sự ở DB. Các ràng buộc còn lại như “mã nhân viên không được trùng nếu có giá trị” được kiểm tra trong service.
- `NULL` được dùng rộng rãi cho dữ liệu chưa biết/chưa phát sinh. Đừng diễn giải `NULL` là giá trị mặc định nghiệp vụ nếu không kiểm tra service.
- Quan hệ `cascade="all, delete-orphan"` là cascade ở ORM khi xóa qua đối tượng SQLAlchemy; chỉ một số foreign key có `ON DELETE CASCADE`/`SET NULL` trực tiếp trong SQL Server.

## 3. Phân hệ Nhân sự nước ngoài, lưu trú và pháp lý

### 3.1. Nhân sự và đợt nhập xuất cảnh

| Bảng | Mục đích | Khóa/ràng buộc đáng chú ý |
|---|---|---|
| `foreign_employees` | Hồ sơ master cho Nhân viên nước ngoài và cả nhân sự tạp vụ. | PK `id`; index: `employee_code`, `name_latin`, `passport_number`. `employee_code` không có unique constraint DB do nhiều giá trị rỗng có thể tồn tại. |
| `travel_records` | Nhật ký từng đợt sang Việt Nam/về nước. | `employee_id` FK bắt buộc → `foreign_employees.id`, có index. |
| `stays` | Từng đợt bố trí KTX hoặc khách sạn. | FK bắt buộc `employee_id`; FK tùy chọn `travel_record_id`, `room_id`, `hotel_id`; đều được index. |
| `rooms` | Danh mục Phòng KTX. | `room_number` bắt buộc, unique, indexed. |
| `hotels` | Danh mục Khách sạn đối tác. | `name` bắt buộc và indexed; tên không bị ép unique. |

**Các cột trọng tâm của `foreign_employees`**

- Định danh và hồ sơ: `employee_code`, `name_latin` (bắt buộc), `name_chinese`, `gender` (bắt buộc), `nationality`, `date_of_birth`, `passport_number`, `passport_expiry`, `phone`.
- Công việc: `department`, `role`, `work_type` (`CO_DINH` mặc định, hoặc `CONG_TAC`), `workplace_location` (`DORMITORY` mặc định; còn có `CN09`, `CN15`, `COMPANY`), `salary`, `salary_unit` (`MONTH`/`DAY`).
- Phân loại và trạng thái: `employee_type` (`FOREIGN` mặc định hoặc `JANITORIAL`), `status` (`WORKING` mặc định hoặc `RESIGNED`), `resignation_date` và `notes`.
- Các mốc ngày legacy trên master: `entry_date`, `expected_entry_date`, `expected_exit_date`, `actual_exit_date`. Khi có dữ liệu `TravelRecord`, đó là nơi theo dõi lịch sử đợt đi/về chuẩn hơn.

**Các cột trọng tâm của `travel_records`**: `employee_id`, `entry_date`, `expected_entry_date`, `expected_exit_date`, `actual_exit_date`, `notes`. `actual_exit_date IS NULL` biểu thị đợt đang mở/nhân sự đang ở Việt Nam.

**Các cột trọng tâm của `stays`**: `employee_id`, `travel_record_id`, `accommodation_type` (`KTX`/`HOTEL`), `room_id`, `hotel_id`, `hotel_room_number`, `bed_location`, `stay_type` (`CO_DINH`/`CONG_TAC`), `has_meals`, `invoice_amount`, `start_date`, `expected_end_date`, `end_date`, `notes`.

### 3.2. Quy tắc nhập xuất cảnh và bố trí chỗ ở

- Ngày đến thực tế và ngày về thực tế không được là ngày tương lai; ngày về (dự kiến hay thực tế) không được trước ngày đến.
- Service chặn đổi `entry_date` của một đợt đang mở sang đợt mới trước khi ghi `actual_exit_date` của đợt cũ.
- Khi tạo `Stay`, hệ thống tìm `TravelRecord` mở gần nhất (`actual_exit_date IS NULL`) của nhân viên. Nếu không có, chỉ có thể tạo từ dữ liệu legacy của master khi `entry_date` đã đến và chưa có ngày về; nếu không thì trả lỗi 400.
- Nếu request không nêu `travel_record_id`, service tự gán đợt nhập xuất cảnh đang mở. Một `TravelRecord` có thể có nhiều `Stay` (ví dụ chuyển KTX/khách sạn trong cùng đợt).
- Điều kiện “đang active” trong nhiều truy vấn là `end_date IS NULL OR end_date > target_date`; vì vậy ngày `end_date` được xem là không còn ở từ chính ngày đó.
- Domain glossary yêu cầu một nhân viên chỉ có một `Stay` active tại một thời điểm, nhưng `create_stay()` hiện không gọi hàm phát hiện `Stay` active có sẵn và DB cũng không có unique/exclusion constraint theo khoảng ngày. Cần giữ quy tắc này ở workflow HR hoặc bổ sung enforcement trước khi dựa vào nó để đảm bảo dữ liệu.
- Việc checkout một `Stay` chỉ đóng chỗ ở; hàm đồng bộ ngược sang `TravelRecord` hiện để trống. Xuất cảnh phải được ghi nhận riêng tại `TravelRecord`.
- Với khách sạn, quy trình nghiệp vụ yêu cầu `start_date`, `hotel_id`, `hotel_room_number` khi tạo và `end_date` khi trả phòng; `invoice_amount` cùng chứng từ có thể bổ sung sau. Một phần các điều kiện này nằm ở schema/router, không phải CHECK constraint DB.

### 3.3. Giấy tờ pháp lý

| Bảng | Liên kết | Dữ liệu chính |
|---|---|---|
| `visas` | `employee_id` FK bắt buộc → nhân viên | `visa_type`, `issue_date`, `expiry_date`, `notes` |
| `tam_trus` | `employee_id` FK bắt buộc → nhân viên | `registration_date`, `expiry_date`, `notes` |
| `work_permits` | `employee_id` FK bắt buộc → nhân viên | `permit_number`, `issue_date`, `valid_from`, `valid_to`, `issue_type`, `notes` |
| `contracts` | `employee_id` FK bắt buộc → nhân viên | `contract_number`, `contract_type`, `start_date`, `end_date`, `notes` |
| `document_attachments` | liên kết đa hình bằng `entity_type` + `entity_id` | `file_name`, `file_path`, `file_size`, `mime_type`, `created_at` |

Visa và Tạm trú là các thực thể riêng, quản lý trực tiếp theo Nhân viên nước ngoài. Schema hiện tại không có `stay_id` hay `travel_record_id` cho hai bảng này.

`DocumentAttachment` hỗ trợ loại `PASSPORT`, `VISA`, `TAM_TRU`, `WORK_PERMIT`, `CONTRACT`; service tự lưu tệp dưới thư mục `uploads/`. Vì đây là liên kết đa hình không có FK, cần xóa attachment liên quan bằng service để tránh bản ghi/tệp mồ côi.

### 3.4. Cảnh báo giấy tờ và email

| Bảng | Vai trò | Ràng buộc |
|---|---|---|
| `doc_warning_configs` | Số ngày/tháng cảnh báo trước hạn theo loại giấy tờ. | `doc_type` unique và indexed; mặc định 30 ngày cho `VISA`, `TAM_TRU`, `GPLD`, `CONTRACT`, `PASSPORT`. |
| `email_notification_configs` | Cấu hình nhận email và lịch gửi. | `config_key` unique/indexed; `recipient_emails`, `is_enabled`, `scheduled_time`, `last_sent_at`. |
| `email_delivery_logs` | Nhật ký gửi email. | Lưu thời điểm gửi, trigger `AUTO`/`MANUAL`/`TEST`, người nhận, số lượng, trạng thái và lỗi. |

Khi tính cảnh báo, hệ thống loại nhân sự `JANITORIAL`. Với nhân sự đang làm việc không phải tạp vụ, nó còn coi thiếu các thông tin hộ chiếu/visa/tạm trú là mục cảnh báo; GPLĐ và hợp đồng chỉ bị kiểm tra thiếu khi chưa về nước.

## 4. Suất ăn, ngày sự kiện và tạp vụ

| Bảng | Mục đích | Ràng buộc/ghi chú |
|---|---|---|
| `meal_absences` | Vắng ăn của một `Stay`. | FK `stay_id` bắt buộc, indexed; `absence_date`, `meal_type` (`BREAKFAST`, `DINNER`, `ALL_DAY`), `reason`. |
| `meal_extras` | Đăng ký ăn thêm cho một `Stay`. | FK `stay_id` bắt buộc, indexed; `extra_date`, `meal_type`, `reason`. |
| `meal_price_configs` | Bảng giá theo loại ngày. | `day_type`, `day_type_name`, giá sáng/tối nhân sự nước ngoài, giá trưa tạp vụ, `fruit_allowance_price`, `effective_from`, `notes`. Không có unique constraint trên `day_type`/ngày hiệu lực. |
| `event_days` | Gán loại ngày cho lịch. | `event_date` unique/indexed; `event_type` mặc định `PRESIDENT_VISIT`. |
| `meal_session_locks` | Snapshot chốt một bữa của một ngày. | Unique (`lock_date`, `meal_session`); lưu số suất tính toán/chốt, đơn giá chốt, người chốt, thời điểm và ghi chú. |
| `janitor_attendance_records` | Ngoại lệ vắng nghỉ từng ngày của tạp vụ. | FK `employee_id` có `ON DELETE CASCADE`; unique (`employee_id`, `attendance_date`). |

**Quy tắc suất ăn**

- Dự báo cho Nhân viên nước ngoài dựa trên người ở KTX có `has_meals=True`: số mặc định trừ Vắng ăn theo bữa/cả ngày, cộng Đăng ký ăn thêm theo bữa.
- Mỗi `MealSessionLock` chỉ có một snapshot cho một cặp ngày + bữa. Cột `meal_session` được migration bổ sung với mặc định `BREAKFAST` cho dữ liệu cũ.
- Đơn giá mặc định trong model: sáng nhân sự nước ngoài 30.000, tối 40.000, trưa tạp vụ 25.000, hoa quả 60.000. Giá thực tế khi chốt được lưu riêng trong `meal_session_locks`.
- Tạp vụ theo mô hình “ghi nhận ngoại lệ”: không có bản ghi nghĩa là đi làm; `FULL_DAY` trừ một công, `HALF_DAY` trừ nửa công. Tạp vụ ở `DORMITORY` có bản ghi nghỉ bị trừ suất trưa gợi ý.
- Service chống ghi hai lần điểm danh cho cùng nhân viên/ngày bằng cả unique constraint và upsert; đăng ký nghỉ theo dải ngày bỏ qua Chủ nhật.

## 5. Phân hệ quản lý xe

### 5.1. Danh mục, hợp đồng và bảng giá

| Bảng | Liên kết | Dữ liệu chính |
|---|---|---|
| `vehicle_providers` | cha của xe và tuyến | `name` indexed, `provider_type` (`COMPANY_OWNED`/`OUTSOURCED`), liên hệ, active, thời điểm tạo |
| `vendor_routes` | `provider_id` FK `ON DELETE CASCADE` | mục đích, điểm đón/trả, loại ghế, giá tuyến, giá chờ/giờ, cờ khứ hồi đồng giá |
| `vehicles` | `provider_id` FK `ON DELETE SET NULL` | nhóm sở hữu, tên/driver/biển số/số điện thoại, chi phí mặc định, active |
| `monthly_vehicle_contracts` | `vehicle_id` FK `ON DELETE CASCADE`, unique | giá khoán tháng, hạn mức km, đơn giá km dư, giờ chuẩn và các phụ phí |

`MonthlyVehicleContract` có quan hệ 1–1 với `Vehicle` vì `vehicle_id` unique. Các cấu hình chính gồm `base_monthly_cost`, `km_allowance`, `excess_km_rate`, giờ chuẩn ngày thường/chủ nhật, phụ cấp tối cố định, đơn giá tăng ca, đơn giá chủ nhật/ngày lễ, phí qua đêm và tiền ăn.

Tuyến nhà xe (`VendorRoute`) lưu `fixed_price`, `waiting_fee_per_hour`, và `is_two_way_same_price`. Cước gợi ý của chuyến là giá tuyến cố định hoặc giá theo km, cộng tiền chờ; HR có thể sửa giá cuối cùng.

### 5.2. Nhật ký điều xe và công tơ mét

| Bảng | Liên kết | Dữ liệu chính |
|---|---|---|
| `vehicle_dispatches` | FK tùy chọn tới `vehicle_providers`, `vehicles`, `vendor_routes`, đều `ON DELETE SET NULL` | ngày điều xe, snapshot tên xe/tài xế, lịch trình, giờ, người đi, km, loại tính cước, chi phí và phụ phí |
| `daily_odometer_logs` | `vehicle_id` FK `ON DELETE CASCADE` | `log_date` dạng chuỗi `YYYY-MM-DD`, km đầu/cuối/ngày, URL ảnh, ghi chú |

`vehicle_dispatches` giữ các trường snapshot như `provider_name`, `vehicle_name`, `driver_name`, `license_plate`, `driver_phone` để lịch sử chuyến vẫn đọc được nếu danh mục bị sửa/xóa. Tuy vậy, `vehicle_name` là bắt buộc.

`DailyOdometerLog` chưa có unique constraint (`vehicle_id`, `log_date`). Service thực hiện upsert bằng truy vấn trước khi tạo; dữ liệu được chèn trực tiếp có thể tạo trùng. `daily_km` được service tính là `max(0, end_km - start_km)` nếu có km cuối.

Chu kỳ đối chiếu xe là **26 tháng trước đến 25 tháng đang chọn**. Báo cáo khoán tháng tính: giá cơ bản + km vượt hạn mức × đơn giá + tăng ca + phụ phí. Các chi phí ngày lễ và một số phụ phí được lưu cấu hình nhưng cần kiểm tra implementation hiện hành trước khi kỳ vọng chúng được cộng tự động trong mọi trường hợp.

## 6. Cascade, xóa dữ liệu và toàn vẹn tham chiếu

- Xóa `ForeignEmployee` qua ORM sẽ xóa mồ côi các `Stay`, `TravelRecord`, `Visa`, `TamTru`, `WorkPermit`, `Contract`; các `MealAbsence`/`MealExtra` của Stay tiếp tục bị xóa qua cascade ORM.
- `JanitorAttendanceRecord` có thêm cascade DB khi xóa nhân viên.
- Xóa `VehicleProvider` cascade DB sang `VendorRoute`, nhưng xe và chuyến điều xe chỉ được đặt `provider_id = NULL`.
- Xóa `Vehicle` cascade DB sang hợp đồng tháng và log công tơ mét; các chuyến điều xe chỉ được đặt `vehicle_id = NULL`.
- Xóa Room/Hotel có thể bị SQL Server chặn nếu còn Stay tham chiếu (model không khai báo `ON DELETE` cho các FK này). Service hiện không tự kiểm tra trước khi xóa.
- Các mã enum/chọn lựa như `employee_type`, `work_type`, `accommodation_type`, `meal_type`, trạng thái… chủ yếu là quy ước application; phần lớn không có CHECK constraint trong DB.

## 7. Khởi tạo, migration và seed

### Khi khởi động backend

`init_db()` tự tạo bảng còn thiếu và chạy các sửa đổi nhẹ có điều kiện, gồm: bổ sung cột chỗ ở khách sạn, ngày dự kiến, `work_type`, trạng thái nghỉ việc; đổi `visas.entry_date` thành `issue_date`; bổ sung loại bữa, cấu hình giá, trường bổ sung cho điều xe; chuyển một số cột xe sang `NVARCHAR`; bổ sung mốc giờ Chủ nhật cho hợp đồng tháng.

Các lệnh migration này được bọc trong `try/except` rộng. Nếu lỗi, ứng dụng có thể vẫn khởi động nhưng schema không được nâng cấp hoàn toàn; cần kiểm tra schema thực tế trước khi vận hành sau một lần nâng version.

### Script chuyên dụng

| Script | Tác động |
|---|---|
| `backend/migrate_travel_records.py` | Tạo `travel_records`; sao chép ngày đi/về cũ của nhân viên sang bản ghi đầu tiên nếu chưa có. |
| `backend/migrate_travel_dates.py` | Bổ sung các cột ngày đi/về legacy vào `foreign_employees`. |
| `backend/migrate_accommodation_refactor.py` | Thay đổi schema chỗ ở, bao gồm `invoice_amount`; cần đọc script trước khi chạy vì có thao tác xóa cột cũ. |
| `backend/fix_vehicle_schema_and_dups.py` | Sửa cột xe và xử lý nhà xe trùng; có thao tác xóa dữ liệu trùng. |
| `backend/core/migrate_vehicle_contracts.py` | Bổ sung giờ chuẩn Chủ nhật cho hợp đồng xe tháng. |
| `backend/seed_janitors.py` | Thêm/cập nhật danh sách tạp vụ mẫu theo mã hoặc tên. |
| `backend/seed_from_excel.py` | **Xóa toàn bộ schema/data qua `drop_all()` rồi tạo lại**, seed từ Excel và danh mục giá; chỉ chạy với môi trường có thể bị reset. |

Không chạy các script seed/migration trên production chỉ để “thử”; sao lưu và kiểm tra môi trường trước. Đặc biệt `seed_from_excel.py` là destructive.

## 8. Checklist khi thay đổi CSDL

1. Sửa model SQLAlchemy và schema Pydantic tương ứng; giữ các file nguồn dưới giới hạn độ dài của repo.
2. Tạo migration idempotent cho SQL Server 2008 R2; tránh `RETURNING`, `OUTPUT INSERTED`, `OFFSET/FETCH`, JSON function và `SEQUENCE`.
3. Cân nhắc dữ liệu cũ: migration lúc khởi động chỉ phù hợp thay đổi nhỏ, không thay thế migration có version/lịch sử rõ ràng.
4. Kiểm tra cả ràng buộc database và validation trong service. Nếu một invariant quan trọng chỉ nằm trong service, tránh ghi dữ liệu trực tiếp vào DB.
5. Với trường tiền tệ, cân nhắc rủi ro làm tròn của `Float` nếu cần độ chính xác kế toán cao.
6. Chạy test backend bằng `uv run pytest` sau thay đổi schema hoặc quy tắc dữ liệu.

## 9. Nguồn đối chiếu

- Model: `backend/features/hr_foreign/models.py`, `backend/features/vehicle_management/models.py`.
- Kết nối/khởi tạo: `backend/core/config.py`, `backend/core/database.py`.
- Quy tắc dữ liệu: các service trong `backend/features/hr_foreign/services/`, `backend/features/hr_foreign/status_engine/`, và `backend/features/vehicle_management/services/`.
- Quyết định nghiệp vụ: `CONTEXT.md` và các ADR trong `docs/adr/`, đặc biệt ADR 0009–0013.
