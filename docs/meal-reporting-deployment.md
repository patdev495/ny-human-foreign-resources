# Cổng Báo cơm nội bộ (cổng 8006)

Cổng Báo cơm chạy như một tiến trình FastAPI riêng trên máy chủ HR `192.168.209.62`. Hai ứng dụng dùng chung SQL Server hiện tại. HR tiếp tục chạy trên cổng `8004`; cổng Báo cơm chỉ mở cho mạng nội bộ `192.168.209.0/24`. Chưa cấu hình tên miền, HTTPS hoặc đường vào từ Internet.

## Build và triển khai

Trên máy phát triển, trong `frontend/`:

```powershell
npm run build
npm run build:portal
```

`frontend/dist/` được commit cùng mã nguồn. `frontend/portal-dist/` được build trên máy phát triển và chuyển riêng vào `D:\projects_production\NY_hr_sys_new\frontend\portal-dist` trên máy chủ, vì máy chủ hiện không có npm trong PATH.

Trên máy chủ, trong `D:\projects_production\NY_hr_sys_new\backend`:

```powershell
C:\Users\Admin\.local\bin\uv.exe sync
C:\Users\Admin\.local\bin\uv.exe run uvicorn features.hr_foreign.meal_reporting.main:app --host 192.168.209.62 --port 8006
```

Giữ các biến `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` và `DB_DRIVER` (nếu có) trong `backend/.env` trên máy chủ. `MEAL_REPORTING_START_DATE` là ngày đầu tiên dùng Báo cơm làm nguồn dự báo và chi phí; giữ cố định sau khi phát hành. ODBC Driver 18 for SQL Server phải được cài trên máy chủ. Startup tạo/kiểm tra các bảng `meal_reports`, `meal_report_revisions` và `meal_session_lock_revisions` trong SQL Server hiện tại.

Dùng NSSM để chạy cổng như dịch vụ Windows, với `Application` là `C:\Users\Admin\.local\bin\uv.exe`, `AppDirectory` là thư mục `backend` trên và `AppParameters` là phần `run uvicorn ...` ở lệnh trên. Sau mỗi lần cập nhật mã nguồn, chuyển bản build mới, chạy `uv sync` rồi khởi động lại dịch vụ HR và cổng Báo cơm.

Chỉ cho phép TCP 8006 từ mạng `192.168.209.0/24` trong Windows Firewall. Không tạo luật NAT, tunnel hoặc reverse proxy công khai. Cổng nhân viên chỉ đăng ký `/`, `/assets/*`, `/api/meal-reporting/*`, `/api/end-shift-reporting/*` và `/health`; nó không đăng ký API HR. Startup kiểm tra thêm bảng `end_shift_reports`. Cổng HR 8004 đọc nhu cầu xe tại `/api/hr-foreign/end-shift/demand`.

## Kiểm tra

```powershell
Invoke-RestMethod http://192.168.209.62:8006/health
Invoke-WebRequest http://192.168.209.62:8006/
```

`/health` phải trả `{"status":"ok"}`. Kiểm tra thêm danh sách người, gửi Báo cơm và Báo giờ tan làm thử cho ngày còn hạn, rồi xác nhận HR nhìn thấy nhu cầu xe trên cổng 8004. Khi gặp lỗi, kiểm tra trạng thái NSSM, log của dịch vụ và kết nối SQL Server; không đưa bí mật cơ sở dữ liệu vào Git.
