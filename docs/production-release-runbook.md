# Phát hành production: HR 8004, cổng nhân viên 8006 và bot Zalo

Quy trình này ghi lại cách triển khai đã dùng ngày 02/11/2026. Chạy lệnh PowerShell ở **máy phát triển** trừ khi có ghi “trên máy chủ”. Không chép `.env`, dữ liệu phiên Zalo, `uploads/` hoặc báo cáo cá nhân vào Git.

## Địa chỉ và dịch vụ cố định

| Thành phần | Đường dẫn / địa chỉ | Dịch vụ Windows |
|---|---|---|
| Mã production | `D:\projects_production\NY_hr_sys_new` trên `Admin@192.168.209.62` | — |
| HR | `https://ns.nienyi.vn` → `127.0.0.1:8004` | `ny-foreign-hr-8004` |
| Cổng nhân viên | `https://ktx.nienyi.vn` → `192.168.209.62:8006` | `ny-meal-reporting-8006` |
| Bot Zalo | `127.0.0.1:8016`, không mở ra mạng | `ny-zalo-reminder-bot` |
| HTTPS | `C:\Caddy\Caddyfile` | `NY-Caddy` |

Hai cổng Python dùng `C:\Users\Admin\.local\bin\uv.exe` và cùng `backend/.env`/SQL Server. Máy chủ hiện không có npm/Node trong `PATH`: bot chạy bằng `zalo_bot/runtime/node.exe` và `zalo_bot/node_modules/`; cổng nhân viên dùng bản build `frontend/portal-dist/` chuyển riêng. `frontend/dist/` được commit theo mã nguồn. Bot chạy `zalo_bot/run-production.bat`, đọc `HR_ZALO_BOT_SECRET` từ `backend/.env`; không ghi secret vào lệnh hoặc log.

## 1. Hoàn tất mã trên máy phát triển

1. Chạy kiểm thử và build liên quan, tối thiểu:

   ```powershell
   cd backend
   uv run pytest
   cd ..\frontend
   npm run build
   npm run build:portal
   cd ..\zalo_bot
   npm test
   npm run typecheck
   npm run build
   cd ..
   git diff --check
   ```

2. Commit theo Conventional Commits trên nhánh `feature/*` hoặc `fix/*`. Xem `git status --short` và chỉ stage file của thay đổi; giữ `.env`, dữ liệu, file của người khác ngoài commit.
3. Merge và đẩy nhánh chính. Nếu `origin/master` có commit mới, tích hợp và kiểm thử lại trước khi merge.

   ```powershell
   git fetch origin master
   git switch master
   git merge --ff-only origin/master
   $feature = 'feature/ten-nhanh'
   git merge --ff-only $feature
   git push origin master
   ```

   Nếu merge không thể fast-forward, giải quyết trên nhánh tính năng rồi kiểm thử lại; không dùng `--force` với `master`.
   Sau khi merge, build lại portal từ `master`; nếu bản `frontend/dist/` thay đổi thì commit bản build đó trước khi push.

## 2. Đóng gói từ máy phát triển

Tạo thư mục staging mới cho mỗi lần phát hành. Lấy SHA đang chạy trên máy chủ để tạo Git bundle chứa đúng phần chênh lệch:

```powershell
$release = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path (Get-Location).Path ".scratch\deploy-$release"
New-Item -ItemType Directory -Path $stage | Out-Null
$old = (ssh -o BatchMode=yes Admin@192.168.209.62 'git -C D:/projects_production/NY_hr_sys_new rev-parse HEAD').Trim()
git merge-base --is-ancestor $old HEAD
if ($LASTEXITCODE -ne 0) { throw 'Production HEAD không nằm trong lịch sử master hiện tại' }
git bundle create (Join-Path $stage 'source.bundle') "$old..master"
git bundle verify (Join-Path $stage 'source.bundle')
Compress-Archive -Path 'frontend\portal-dist\*' -DestinationPath (Join-Path $stage 'portal-dist.zip')
```

Luôn chép bản build bot để máy chủ dùng đúng commit vừa phát hành. Nếu `package-lock.json` thay đổi, tạo lại `node_modules` production bằng `npm ci --omit=dev` trong thư mục staging rồi đóng gói; không chạy npm trên máy chủ. `zalo_bot/runtime/node.exe` chỉ cần chuyển lại khi nâng cấp Node. Lần đầu đã dùng Node `v26.12.1` từ `D:\PAT\nodejs\node.exe` trên máy phát triển.

```powershell
New-Item -ItemType Directory -Path (Join-Path $stage 'bot-dist') | Out-Null
Copy-Item 'zalo_bot\dist\index.mjs' (Join-Path $stage 'bot-dist\index.mjs')
```

Chỉ khi dependency bot đổi, chuẩn bị thêm gói dependency:

```powershell
$botDeps = Join-Path $stage 'bot-deps'
New-Item -ItemType Directory -Path $botDeps | Out-Null
Copy-Item 'zalo_bot\package.json','zalo_bot\package-lock.json' $botDeps
npm ci --omit=dev --prefix $botDeps --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm ci thất bại' }
Compress-Archive -Path "$botDeps\node_modules" -DestinationPath (Join-Path $stage 'bot-deps.zip')
```

Chuyển artifact lên staging **ngoài repo** trên máy chủ. Tạo thư mục trước qua SSH (`ssh` trên máy chủ mở `cmd.exe`):

```powershell
ssh Admin@192.168.209.62 "mkdir D:\projects_production\deploy-staging\$release"
scp (Join-Path $stage 'source.bundle') "Admin@192.168.209.62:D:/projects_production/deploy-staging/$release/"
scp (Join-Path $stage 'portal-dist.zip') "Admin@192.168.209.62:D:/projects_production/deploy-staging/$release/"
scp (Join-Path $stage 'bot-dist\index.mjs') "Admin@192.168.209.62:D:/projects_production/deploy-staging/$release/"
if (Test-Path (Join-Path $stage 'bot-deps.zip')) {
    scp (Join-Path $stage 'bot-deps.zip') "Admin@192.168.209.62:D:/projects_production/deploy-staging/$release/"
}
```

So sánh SHA-256 của các artifact ở hai máy bằng `Get-FileHash` trước khi thay production.

## 3. Cập nhật trên máy chủ

Vào máy chủ bằng `ssh Admin@192.168.209.62`, rồi gõ `powershell -NoProfile` để dùng các lệnh dưới đây. Thay `<release>` bằng tên staging ở bước 2. Bản backup nằm ngoài repo.

```powershell
$root = 'D:\projects_production\NY_hr_sys_new'
$release = '<release>'
$stage = "D:\projects_production\deploy-staging\$release"
$backup = "D:\projects_production\deploy-backups\NY_hr_sys_new\$release"
if ((git -C $root status --porcelain).Count -gt 0) { throw 'Repo production có thay đổi chưa lưu' }
New-Item -ItemType Directory -Path $backup | Out-Null
$old = (git -C $root rev-parse HEAD).Trim()
git -C $root branch "backup/pre-$release" $old
Copy-Item "$root\backend\.env" "$backup\backend.env"
Compress-Archive -Path "$root\frontend\portal-dist\*" -DestinationPath "$backup\portal-dist.zip"
if (Test-Path "$root\zalo_bot\dist\index.mjs") {
    Copy-Item "$root\zalo_bot\dist\index.mjs" "$backup\bot-index.mjs"
}
if (Test-Path "$stage\bot-deps.zip") {
    Compress-Archive -Path "$root\zalo_bot\node_modules" -DestinationPath "$backup\bot-deps.zip"
}
git -C $root fetch "$stage\source.bundle" refs/heads/master
if ($LASTEXITCODE -ne 0) { throw 'Không đọc được Git bundle' }
git -C $root merge-base --is-ancestor $old FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw 'Bundle không tiếp nối bản production hiện tại' }
```

Dừng hai cổng, cập nhật mã theo fast-forward, cài đúng dependency Python, rồi chép asset mới **trước** khi thay `portal.html`. Bot được khởi động lại với bản build cùng commit; phiên đăng nhập trong `zalo_bot/data/` được giữ nguyên.

```powershell
Stop-Service 'ny-foreign-hr-8004','ny-meal-reporting-8006'
git -C $root merge --ff-only FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw 'Git merge thất bại; quay lại và bật dịch vụ cũ' }
Push-Location "$root\backend"
try { & 'C:\Users\Admin\.local\bin\uv.exe' sync; if ($LASTEXITCODE -ne 0) { throw 'uv sync thất bại' } }
finally { Pop-Location }
Expand-Archive "$stage\portal-dist.zip" "$stage\portal" -Force
Copy-Item "$stage\portal\assets\*" "$root\frontend\portal-dist\assets" -Force
Copy-Item "$stage\portal\portal.html" "$root\frontend\portal-dist\portal.html" -Force
if (Test-Path "$stage\index.mjs") {
    Stop-Service 'ny-zalo-reminder-bot'
    if (Test-Path "$stage\bot-deps.zip") {
        Expand-Archive "$stage\bot-deps.zip" "$stage\bot-deps" -Force
        $oldDeps = "$backup\node_modules"
        Move-Item "$root\zalo_bot\node_modules" $oldDeps
        Copy-Item "$stage\bot-deps\node_modules" "$root\zalo_bot\node_modules" -Recurse
    }
    Copy-Item "$stage\index.mjs" "$root\zalo_bot\dist\index.mjs" -Force
    Start-Service 'ny-zalo-reminder-bot'
}
Start-Service 'ny-meal-reporting-8006','ny-foreign-hr-8004'
```

Giữ nguyên `backend/.env`, `backend/uploads/`, `zalo_bot/data/` và `zalo_bot/runtime/` qua mỗi lần cập nhật. `zalo_bot/node_modules/` chỉ thay khi `package-lock.json` đổi. Nếu thay schema dữ liệu hiện có, chuẩn bị migration và bản sao lưu SQL Server riêng trước bước 3; `uv sync` không phải lệnh migration. Trước khi di chuyển `node_modules`, xác nhận `$root` và `$backup` đúng hai đường dẫn production đã nêu; không trỏ lệnh di chuyển đến thư mục khác.

## 4. Kiểm tra sau cập nhật

Trên máy chủ:

```powershell
Get-Service 'ny-foreign-hr-8004','ny-meal-reporting-8006','ny-zalo-reminder-bot','NY-Caddy'
Invoke-WebRequest http://127.0.0.1:8004/ -UseBasicParsing
Invoke-RestMethod http://192.168.209.62:8006/health
git -C $root rev-parse --short HEAD
git -C $root status --short
```

Trên máy phát triển:

```powershell
Invoke-WebRequest https://ns.nienyi.vn/ -UseBasicParsing
Invoke-RestMethod https://ktx.nienyi.vn/health
Invoke-RestMethod https://ktx.nienyi.vn/api/meal-reporting/dates
```

Kỳ vọng: HTTPS trả 200, `health` trả `ok`, `/api/meal-reporting/dates` có `cutoff_time`, Git production sạch và đúng SHA `master`. API `/api/zalo-reminder/status` trả 401 nếu chưa đăng nhập. Với tài khoản admin, mở **Cài đặt → Thông báo Zalo** để xem trạng thái bot/QR, người nhận và lịch sử; chỉ bấm **Gửi thử ngay** khi đã chọn đúng người nhận thật. Kiểm tra log bot tại `zalo_bot/data/stderr.log` nếu QR không xuất hiện.

## Quay lại khi lỗi

Nếu kiểm tra thất bại, dừng các dịch vụ liên quan, xác nhận không có thay đổi mới trong repo production, rồi đưa Git về nhánh backup của lần phát hành. Lệnh `reset --hard` chỉ dùng cho repo production đã xác nhận sạch trước release; không chạy với thư mục dữ liệu hoặc `.env`.

```powershell
Stop-Service 'ny-foreign-hr-8004','ny-meal-reporting-8006'
Stop-Service 'ny-zalo-reminder-bot' -ErrorAction SilentlyContinue
git -C $root reset --hard "backup/pre-$release"
Copy-Item "$backup\backend.env" "$root\backend\.env" -Force
Expand-Archive "$backup\portal-dist.zip" "$backup\portal" -Force
Copy-Item "$backup\portal\assets\*" "$root\frontend\portal-dist\assets" -Force
Copy-Item "$backup\portal\portal.html" "$root\frontend\portal-dist\portal.html" -Force
if (Test-Path "$backup\bot-index.mjs") {
    Copy-Item "$backup\bot-index.mjs" "$root\zalo_bot\dist\index.mjs" -Force
    if (Test-Path "$backup\node_modules") {
        $failedDeps = "$stage\failed-node_modules"
        Move-Item "$root\zalo_bot\node_modules" $failedDeps
        Move-Item "$backup\node_modules" "$root\zalo_bot\node_modules"
    }
    Start-Service 'ny-zalo-reminder-bot'
}
Push-Location "$root\backend"
try { & 'C:\Users\Admin\.local\bin\uv.exe' sync }
finally { Pop-Location }
Start-Service 'ny-meal-reporting-8006','ny-foreign-hr-8004'
```

Kiểm tra lại mục 4. Việc quay lại Git **không tự khôi phục dữ liệu SQL Server**; nếu release có migration thay đổi dữ liệu, dùng kế hoạch khôi phục DB đã chuẩn bị riêng.

Bản sao của lần triển khai Zalo đầu tiên nằm tại `D:\projects_production\deploy-backups\NY_hr_sys_new\zalo-20261102`; Git backup là `backup/pre-zalo-20261102` (commit `4b8c7ed`).
