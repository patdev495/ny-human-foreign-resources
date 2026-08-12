# 13. Bind Accommodation Stays to Travel Records and Enforce Presence Status Rules

* Status: accepted
* Date: 2026-08-12

## Context and Problem Statement

Trước thời điểm ADR này, đợt Nhập xuất cảnh (`TravelRecord`) và đợt Lưu trú chỗ ở (`Stay`) hoạt động độc lập ở tầng Database (không có Foreign Key `travel_record_id`).
Dẫn đến các bất cập:
1. Nhân sự đang ở nước ngoài (chưa có đợt nhập cảnh active) vẫn có thể được xếp phòng KTX hoặc Khách sạn.
2. Không thể truy vết chính xác một đợt lưu trú (ở KTX / Khách sạn) thuộc về chuyến di chuyển (đợt sang Việt Nam) nào của Nhân viên nước ngoài.
3. Cần làm sạch dữ liệu cũ của các bảng đợt lưu trú và đợt nhập cảnh để quản lý chuẩn hóa từ mốc hiện tại mà không làm ảnh hưởng đến dữ liệu hồ sơ cá nhân (`foreign_employees`), hợp đồng (`contracts`), hay GPLĐ (`work_permits`).

## Decision Drivers

* **Tính toàn vẹn dữ liệu (Data Integrity)**: Đảm bảo đợt Lưu trú (`Stay`) luôn thuộc về một Đợt nhập xuất cảnh (`TravelRecord`) cụ thể.
* **Quy tắc Hiện diện Chặt chẽ**: Nhân viên không có đợt nhập cảnh active (`actual_exit_date is NULL`) được coi là "Đang ở nước ngoài" và không thể xếp chỗ ở.
* **Tự động hóa vận hành**: Khi ghi nhận ngày về nước (`actual_exit_date`), hệ thống tự động đóng đợt lưu trú đang active (`end_date = actual_exit_date`) để giải phóng vị trí chỗ ở.

## Considered Options

* **Option 1**: Tách độc lập `TravelRecord` và `Stay` như cũ, chỉ đồng bộ qua service logic.
* **Option 2 (Chọn)**: Bổ sung `travel_record_id` (FK nullable/indexed) vào bảng `stays`. Một `TravelRecord` chứa 1 hoặc nhiều `Stay`. Chặn xếp chỗ ở đối với nhân sự đang ở nước ngoài.
* **Option 3**: Ép quan hệ 1-1 cứng (mỗi đợt nhập cảnh chỉ có đúng 1 đợt lưu trú).

## Decision Outcome

Chọn **Option 2**.

### Consequences

1. **Database Schema**:
   - Thêm cột `travel_record_id` (Integer, ForeignKey `travel_records.id`, nullable=True, index=True) vào model `Stay`.
   - Quan hệ SQLAlchemy: `TravelRecord.stays = relationship("Stay", back_populates="travel_record")`.
2. **Quy tắc Trạng thái Hiện diện & Xếp chỗ ở**:
   - Nếu nhân viên không có `TravelRecord` active (`actual_exit_date is NULL`), trạng thái mặc định là "Đang ở nước ngoài".
   - Không cho phép tạo `Stay` mới nếu nhân viên đang ở nước ngoài (trả về lỗi 400).
   - Khi tạo `Stay` mới cho nhân viên đang ở Việt Nam, hệ thống tự động gán `stay.travel_record_id = active_travel_record.id`.
3. **Chốt đợt ở khi xuất cảnh**:
   - Khi cập nhật `actual_exit_date` cho `TravelRecord`, hệ thống tự động chốt `end_date = actual_exit_date` cho đợt `Stay` đang active của `TravelRecord` đó (nếu `end_date` chưa có).
4. **Làm sạch dữ liệu**:
   - Xóa dữ liệu các bảng: `meal_absences`, `tam_trus`, `visas`, `stays`, `travel_records`.
   - Reset mốc ngày `entry_date`, `expected_entry_date`, `expected_exit_date`, `actual_exit_date` trên `foreign_employees` về NULL.
   - Giữ nguyên toàn bộ dữ liệu hồ sơ cá nhân (`foreign_employees`), `contracts`, `work_permits`, `rooms`, `hotels`, `meal_price_configs`, `vehicle_*`...
