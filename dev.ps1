# NY Human Resources System - PowerShell Dev Launcher

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  NY Human Resources System - Launching Dev Servers" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Backend (FastAPI on 0.0.0.0:8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "[2/2] Starting Frontend (Vite on LAN 0.0.0.0:5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev -- --host"

Write-Host ""
Write-Host "Development environment started in separate terminal windows!" -ForegroundColor Green
Write-Host "  - Backend API Docs : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Local Web App    : http://localhost:5173" -ForegroundColor White
Write-Host "  - LAN Web Access   : Xem địa chỉ IP hiển thị trong cửa sổ Terminal Frontend (Vd: http://192.168.x.x:5173)" -ForegroundColor White
Write-Host ""
