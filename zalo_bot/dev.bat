@echo off
setlocal
cd /d "%~dp0"

if not exist "..\backend\.env" (
    echo Missing backend\.env - configure HR_ZALO_BOT_SECRET first.
    exit /b 1
)

set "HR_ZALO_BOT_PORT=8016"
for /f "usebackq tokens=1,* delims==" %%A in ("..\backend\.env") do (
    if /i "%%A"=="HR_ZALO_BOT_SECRET" set "HR_ZALO_BOT_SECRET=%%B"
    if /i "%%A"=="HR_ZALO_BOT_PORT" set "HR_ZALO_BOT_PORT=%%B"
)
if not defined HR_ZALO_BOT_SECRET (
    echo Missing HR_ZALO_BOT_SECRET in backend\.env.
    exit /b 1
)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %HR_ZALO_BOT_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo Zalo bot is already running on port %HR_ZALO_BOT_PORT%.
    exit /b 0
)

if not exist "node_modules\zca-js" (
    call npm ci
    if errorlevel 1 exit /b 1
)
call npm run build
if errorlevel 1 exit /b 1
call npm start
