# Thảo luận Kiến trúc: Tách Module Chi phí Ăn uống & Mở rộng Quản lý Nhân sự Tạp vụ

> **Ngày lưu**: 24/07/2026  
> **Trạng thái**: Đang thảo luận (Dừng ở Câu hỏi 3 - Chờ tiếp tục)  
> **Tài liệu Domain liên quan**: [CONTEXT.md](../../CONTEXT.md) (Đã cập nhật các thuật ngữ liên quan)

---

## 1. Bối cảnh & Mục tiêu

Hệ thống sắp tới sẽ mở rộng để quản lý thêm nhóm **Nhân viên Tạp vụ** (`hr_janitor`) bên cạnh **Nhân viên Nước ngoài** (`hr_foreign`).  
Chi phí ăn uống (tiền suất ăn) cần được tính toán tổng hợp cho cả 2 khối trong cùng một **Báo cáo Chi phí Ăn uống**.  
Do đó, hệ thống cần:
1. **Tách module Chi phí Ăn uống (`meals`)** thành một feature module độc lập, ngang cấp với `hr_foreign` và `hr_janitor`.
2. **Hỗ trợ đơn giá suất ăn khác nhau** theo từng khối nhân sự (VD: Người nước ngoài 30.000 VNĐ/bữa, Tạp vụ 25.000 VNĐ/bữa).
3. **Thao tác Chốt suất ăn tập trung** nhưng hiển thị chi tiết (breakdown) theo từng khối.

---

## 2. Các quyết định đã đồng thuận (Resolved Decisions)

### ✅ Quyết định 1: Kiến trúc Module & Liên kết Nhân sự (Polymorphic Participant Reference)
- Module `meals` hoàn toàn decoupled với `hr_foreign` và `hr_janitor`.
- Các bản ghi suất ăn/vắng ăn liên kết với nhân sự bằng cặp `(participant_type, participant_id)` (với `participant_type` = `FOREIGN_EMPLOYEE` | `JANITOR`).
- `MealPriceConfig` quản lý đơn giá theo `participant_type` + `day_type` (`NORMAL`, `PRESIDENT_VISIT`, `TET`...).
- **Đã cập nhật vào [CONTEXT.md](../../CONTEXT.md)**.

### ✅ Quyết định 2: Quy trình Chốt suất ăn tập trung & Breakdown
- Mỗi bữa ăn trong ngày (`BREAKFAST`, `LUNCH`, `DINNER`) thực hiện **Chốt 1 lần duy nhất** cho toàn bộ công ty.
- **Modal Chốt suất ăn**: Hiển thị bảng liệt kê chi tiết từng Khối nhân sự (Nước ngoài: số suất + đơn giá; Tạp vụ: số suất + đơn giá).
- HR có quyền điều chỉnh số suất thực chốt (`final_meal_count`) và đơn giá thực chốt (`locked_price_per_meal`) cho từng khối trước khi đóng băng snapshot.
- **Đã cập nhật vào [CONTEXT.md](../../CONTEXT.md)**.

---

## 3. Các câu hỏi đang dang dở / Cần thảo luận tiếp (Open Questions for Next Session)

### ❓ Câu hỏi 3: Cơ chế tính số suất ăn mặc định cho Tạp vụ (`calculated_meal_count`)
- **Tình huống**: Người nước ngoài ở KTX mặc định có 2 bữa (Sáng/Tối). Tạp vụ không ở KTX, làm việc theo ca và ăn bữa Trưa/suất ăn theo ca.
- **Các phương án**:
  - *Phương án A*: Đăng ký lịch ăn cố định (VD: T2 - T6) + Ghi nhận vắng ăn (`MealAbsence`) khi nghỉ.
  - *Phương án B*: Tự động đồng bộ từ Lịch phân ca / Chấm công ngày của `hr_janitor`.
  - *Phương án C*: HR/Quản lý tạp vụ điểm danh chọn trực tiếp danh sách ăn mỗi ngày.
- **Đề xuất hiện tại**: Áp dụng Phương án A cho giai đoạn 1, chuẩn bị sẵn API cho Phương án B ở giai đoạn 2.

### ❓ Câu hỏi 4: Chiến lược Migration dữ liệu cũ
- Chuyển đổi các bảng hiện tại (`meal_absences`, `meal_price_configs`, `meal_session_locks`) từ `hr_foreign` sang schema mới của `meals`.

### ❓ Câu hỏi 5: Cấu trúc File Excel Báo cáo Chi phí Ăn uống
- Thiết kế các Tab Excel trong Báo cáo (Tab 1: Tổng hợp chi phí toàn công ty theo ngày/tháng x phân loại khối; Tab 2: Nhật ký chi tiết Nước ngoài; Tab 3: Nhật ký chi tiết Tạp vụ).

---

## 4. Hướng dẫn tiếp tục buổi thảo luận

Khi quay lại làm việc, bạn chỉ cần gửi lệnh:
> *"Tiếp tục thảo luận file `.scratch/meals/architecture-discussion-janitors-and-decoupled-meals.md`"*  
> hoặc lệnh `/grill-with-docs` để chúng ta đi tiếp **Câu hỏi 3**.
