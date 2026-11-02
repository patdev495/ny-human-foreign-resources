@echo off
title NY Human Resources System - Dev Launcher
echo ====================================================
echo   NY Human Resources System - Launching Dev Servers
echo ====================================================
echo.
echo [1/3] Starting Backend (FastAPI on http://0.0.0.0:8000)...
start "Backend - FastAPI" /D "%~dp0backend" cmd /k uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo [2/3] Starting Frontend (Vite on http://0.0.0.0:5173)...
start "Frontend - Vite" /D "%~dp0frontend" cmd /k npm run dev -- --host

echo [3/3] Starting Zalo Bot (http://127.0.0.1:8016)...
start "Zalo Bot" /D "%~dp0zalo_bot" cmd /k call dev.bat

echo.
echo Development environment started successfully!
echo   - Backend API Docs : http://localhost:8000/docs
echo   - Local Web App    : http://localhost:5173
echo   - Zalo Bot        : http://127.0.0.1:8016 (internal)
echo   - LAN Web Access   : Xem dia chi IP hien thi trong cua so Terminal Frontend (Vd: http://192.168.x.x:5173)
echo.





