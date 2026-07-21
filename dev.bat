@echo off
title NY Human Resources System - Dev Launcher
echo ====================================================
echo   NY Human Resources System - Launching Dev Servers
echo ====================================================
echo.
echo [1/2] Starting Backend (FastAPI on http://localhost:8000)...
start "Backend - FastAPI" cmd /k "cd backend && uv run uvicorn main:app --reload --port 8000"

echo [2/2] Starting Frontend (Vite on http://localhost:5173)...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"

echo.
echo Development environment started successfully!
echo   - Backend API Docs : http://localhost:8000/docs
echo   - Frontend Web App : http://localhost:5173
echo.
