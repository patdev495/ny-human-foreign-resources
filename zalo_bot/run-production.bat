@echo off
setlocal
cd /d "%~dp0"

if not exist "..\backend\.env" (
    echo Missing backend\.env.
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("..\backend\.env") do (
    if /i "%%A"=="HR_ZALO_BOT_SECRET" set "HR_ZALO_BOT_SECRET=%%B"
    if /i "%%A"=="HR_ZALO_BOT_PORT" set "HR_ZALO_BOT_PORT=%%B"
)
if not defined HR_ZALO_BOT_SECRET (
    echo Missing HR_ZALO_BOT_SECRET in backend\.env.
    exit /b 1
)
if not exist "runtime\node.exe" (
    echo Missing runtime\node.exe.
    exit /b 1
)

runtime\node.exe dist\index.mjs
