# Cổng Báo cơm (cổng 8006)

Cổng Báo cơm chạy như một tiến trình FastAPI riêng trên máy chủ HR `192.168.209.62`. Hai ứng dụng dùng chung SQL Server hiện tại. HR chạy trên cổng `8004` và truy cập qua `https://ns.nienyi.vn`. Cổng Báo cơm `8006` chỉ nhận kết nối trong mạng nội bộ; người dùng bên ngoài truy cập qua `https://ktx.nienyi.vn` và Caddy chuyển tiếp đến `192.168.209.62:8006`.

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

Chỉ cho phép TCP 8006 từ mạng `192.168.209.0/24` trong Windows Firewall. DNS `ktx.nienyi.vn` và `ns.nienyi.vn` cùng trỏ đến `14.241.114.2`; FortiGate chuyển tiếp TCP 80 và 443 đến `192.168.209.62` cùng cổng. Dịch vụ Windows `NY-Caddy` dùng `C:\Caddy\Caddyfile` để cấp HTTPS, chuyển tiếp `ktx.nienyi.vn` đến `192.168.209.62:8006` và `ns.nienyi.vn` đến `127.0.0.1:8004`. Windows Firewall cho phép Caddy nhận TCP 80/443. Không chuyển tiếp công khai TCP 8006 hoặc cổng HR 8004. Cổng nhân viên chỉ đăng ký `/`, `/assets/*`, `/api/meal-reporting/*`, `/api/end-shift-reporting/*` và `/health`; nó không đăng ký API HR. Startup kiểm tra thêm bảng `end_shift_reports`. Cổng HR 8004 đọc nhu cầu xe tại `/api/hr-foreign/end-shift/demand`.

## Kiểm tra

```powershell
Invoke-RestMethod http://192.168.209.62:8006/health
Invoke-WebRequest http://192.168.209.62:8006/
Invoke-RestMethod https://ktx.nienyi.vn/health
Invoke-WebRequest https://ktx.nienyi.vn/
```

`/health` phải trả `{"status":"ok"}`. Kiểm tra thêm danh sách người, gửi Báo cơm và Báo giờ tan làm thử cho ngày còn hạn, rồi xác nhận HR nhìn thấy nhu cầu xe trên cổng 8004. Khi gặp lỗi, kiểm tra trạng thái NSSM, dịch vụ `NY-Caddy`, `C:\Caddy\caddy.log`, log ứng dụng và kết nối SQL Server; không đưa bí mật cơ sở dữ liệu vào Git.
