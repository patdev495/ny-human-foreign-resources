@echo off
title NY Human Resources System - Dev Launcher
echo ====================================================
echo   NY Human Resources System - Launching Dev Servers
echo ====================================================
echo.
echo [1/5] Starting Backend (FastAPI on http://0.0.0.0:8000)...
start "Backend - FastAPI" /D "%~dp0backend" cmd /k uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo [2/5] Starting Frontend (Vite on http://0.0.0.0:5173)...
start "Frontend - Vite" /D "%~dp0frontend" cmd /k npm run dev -- --host 0.0.0.0 --port 5173 --strictPort

echo [3/5] Starting Employee Portal API (http://0.0.0.0:8006)...
start "Employee Portal - FastAPI" /D "%~dp0backend" cmd /k uv run uvicorn features.hr_foreign.meal_reporting.main:app --reload --host 0.0.0.0 --port 8006

echo [4/5] Starting Employee Portal Frontend (http://0.0.0.0:5174/portal.html)...
start "Employee Portal - Vite" /D "%~dp0frontend" cmd /k npm run dev:portal -- --host 0.0.0.0 --port 5174 --strictPort

echo [5/5] Starting Zalo Bot (http://127.0.0.1:8016)...
start "Zalo Bot" /D "%~dp0zalo_bot" cmd /k call dev.bat

echo.
echo Launch commands sent. Check each server window for startup errors.
echo   - Backend API Docs : http://localhost:8000/docs
echo   - Local Web App    : http://localhost:5173
echo   - Employee Portal  : http://localhost:5174/portal.html (live reload)
echo   - Portal API Docs  : http://localhost:8006/docs
echo   - Zalo Bot        : http://127.0.0.1:8016 (internal)
echo   - LAN Web Access   : Xem dia chi IP hien thi trong cua so Terminal Frontend (Vd: http://192.168.x.x:5173)
echo.
