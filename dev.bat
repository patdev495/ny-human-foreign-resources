@echo off
title NY Human Resources System - Dev Launcher
echo ====================================================
echo   NY Human Resources System - Launching Dev Servers
echo ====================================================
echo.
echo [1/2] Starting Backend (FastAPI on http://0.0.0.0:8000)...
start "Backend - FastAPI" cmd /k "cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting Frontend (Vite on http://0.0.0.0:5173)...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo Development environment started successfully!
echo   - Backend API Docs : http://localhost:8000/docs
echo   - Local Web App    : http://localhost:5173
echo   - LAN Web Access   : Xem dia chi IP hien thi trong cua so Terminal Frontend (Vd: http://192.168.x.x:5173)
echo.





