from __future__ import annotations

import os
import shutil
import subprocess
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
RELEASE_DIR = os.path.join(ROOT_DIR, "release")


def log(msg: str) -> None:
    print(f"\n====================================================")
    print(f"  {msg}")
    print(f"====================================================\n")


def build_frontend() -> None:
    log("Building Frontend SPA (React + Vite)...")
    cmd = "npm.cmd run build" if sys.platform == "win32" else "npm run build"
    res = subprocess.run(cmd, shell=True, cwd=FRONTEND_DIR)
    if res.returncode != 0:
        print("[ERROR] Frontend build failed!")
        sys.exit(1)
    dist_dir = os.path.join(FRONTEND_DIR, "dist")
    if not os.path.exists(dist_dir):
        print("[ERROR] frontend/dist directory not found after build!")
        sys.exit(1)
    print("[SUCCESS] Frontend build completed.")


def build_backend() -> None:
    log("Building Backend Executable (PyInstaller onedir)...")
    # Ensure pyinstaller is installed via uv
    subprocess.run("uv add --dev pyinstaller", shell=True, cwd=BACKEND_DIR)

    cmd = (
        "uv run pyinstaller --noconfirm --onedir --name ny_hr_server --clean "
        "--hidden-import pyodbc "
        "--hidden-import sqlalchemy.dialects.mssql.pyodbc "
        "server.py"
    )
    res = subprocess.run(cmd, shell=True, cwd=BACKEND_DIR)
    if res.returncode != 0:
        print("[ERROR] PyInstaller backend build failed!")
        sys.exit(1)
    
    built_server_dir = os.path.join(BACKEND_DIR, "dist", "ny_hr_server")
    if not os.path.exists(built_server_dir):
        print("[ERROR] PyInstaller output directory not found!")
        sys.exit(1)
    print("[SUCCESS] Backend PyInstaller build completed.")


def package_release() -> None:
    log("Packaging Release Directory...")
    if os.path.exists(RELEASE_DIR):
        print(f"Removing existing {RELEASE_DIR}...")
        shutil.rmtree(RELEASE_DIR)

    os.makedirs(RELEASE_DIR, exist_ok=True)

    # 1. Copy PyInstaller onedir backend to release/server
    src_server = os.path.join(BACKEND_DIR, "dist", "ny_hr_server")
    dst_server = os.path.join(RELEASE_DIR, "server")
    print(f"Copying {src_server} -> {dst_server}...")
    shutil.copytree(src_server, dst_server)

    # 2. Copy Frontend dist to release/static
    src_static = os.path.join(FRONTEND_DIR, "dist")
    dst_static = os.path.join(RELEASE_DIR, "static")
    print(f"Copying {src_static} -> {dst_static}...")
    shutil.copytree(src_static, dst_static)

    # 3. Create uploads directory
    uploads_dir = os.path.join(RELEASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    print(f"Created {uploads_dir} directory.")

    # 4. Copy .env.example & create initial .env
    src_env = os.path.join(BACKEND_DIR, ".env.example")
    if not os.path.exists(src_env):
        src_env = os.path.join(BACKEND_DIR, ".env")

    if os.path.exists(src_env):
        shutil.copy(src_env, os.path.join(RELEASE_DIR, ".env.example"))
        shutil.copy(src_env, os.path.join(RELEASE_DIR, ".env"))
        shutil.copy(src_env, os.path.join(dst_server, ".env"))
        print("Copied environment configuration files.")

    # 5. Create release/run.bat
    run_bat_content = """@echo off
chcp 65001 > NUL
title NY Human Resources System Server
echo ====================================================
echo  NY Human Resources System - Windows Server Runner
echo ====================================================
echo.

if not exist ".env" (
    echo [WARNING] Missing .env file! Copying .env.example to .env ...
    copy .env.example .env
    echo [INFO] Please update .env with your SQL Server connection details.
    echo.
)

if exist ".env" (
    copy /Y .env server\.env > NUL
)

if not exist "uploads" (
    mkdir uploads
)

echo Starting NY HR System on http://0.0.0.0:8000 ...
cd /d "%~dp0server"
ny_hr_server.exe
pause
"""
    with open(os.path.join(RELEASE_DIR, "run.bat"), "w", encoding="utf-8") as f:
        f.write(run_bat_content)

    # 6. Create release/README_DEPLOY.md
    readme_content = """# HƯỚNG DẪN TRIỂN KHAI NY HUMAN RESOURCES SYSTEM TRÊN WINDOWS SERVER

Thư mục `release/` này đã chứa đầy đủ Backend (dạng `onedir` EXE), Frontend (React SPA) và các tài nguyên cần thiết.

---

## 1. Yêu cầu Hệ thống (Prerequisites)

1. **Hệ điều hành**: Windows Server 2012 R2 / 2016 / 2019 / 2022 hoặc Windows 10 / 11 (64-bit).
2. **Microsoft SQL Server**:
   - Tương thích với SQL Server 2008 R2 trở lên.
3. **ODBC Driver for SQL Server**:
   - Yêu cầu cài đặt **ODBC Driver 18 for SQL Server** (hoặc ODBC Driver 17) trên máy chủ chạy ứng dụng.
   - Tải về từ Microsoft: `https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server`

---

## 2. Các bước Triển khai (Deployment Steps)

1. **Copy thư mục `release`**:
   - Sao chép toàn bộ thư mục `release` sang máy chủ Windows mới (ví dụ: đặt tại `C:\\NY_HR_System\\`).

2. **Cấu hình file `.env`**:
   - Mở file `C:\\NY_HR_System\\.env` bằng Notepad hoặc Text Editor.
   - Chỉnh sửa thông số cổng web (`PORT`) và CSDL SQL Server:
     ```ini
     # Cổng khởi chạy ứng dụng (Mặc định: 8000)
     HOST=0.0.0.0
     PORT=8000

     # CSDL SQL Server
     DB_SERVER=YOUR_SERVER_NAME_OR_IP\\SQLEXPRESS
     DB_NAME=NY_HR_DB
     DB_USER=sa
     DB_PASSWORD=YourStrongPassword123
     DB_DRIVER=ODBC Driver 18 for SQL Server
     ```

3. **Khởi chạy ứng dụng**:
   - Nhấp đôi chuột vào file `run.bat` (hoặc chạy qua Command Prompt / PowerShell với quyền Administrator).
   - Màn hình Console sẽ hiển thị thông báo thành công:
     ```text
     ====================================================
      NY Human Resources System - Server Started
      Access URL: http://localhost:8000
     ====================================================
     ```

4. **Truy cập hệ thống**:
   - **Tại máy chủ**: Mở trình duyệt web truy cập `http://localhost:<PORT>` (ví dụ: `http://localhost:8000`)
   - **Từ máy trạm trong mạng LAN**: Truy cập `http://<IP_MAY_CHU_SERVER>:<PORT>` (Lưu ý: Mở cổng Firewall inbound trên Windows Server cho cổng đã chọn, ví dụ: 8000 hoặc 8080).

---

## 3. Cấu hình tự động chạy theo Hệ thống (Windows Service - Optional)

Nếu muốn ứng dụng tự động chạy ngầm khi bật máy chủ Windows mà không cần mở CMD, bạn có thể dùng **NSSM (Non-Sucking Service Manager)**:
1. Tải NSSM từ `https://nssm.cc/download`.
2. Mở Command Prompt với quyền Admin và chạy:
   ```cmd
   nssm install NY_HR_Service "C:\\NY_HR_System\\release\\server\\ny_hr_server.exe"
   nssm set NY_HR_Service AppDirectory "C:\\NY_HR_System\\release"
   nssm start NY_HR_Service
   ```
"""
    with open(os.path.join(RELEASE_DIR, "README_DEPLOY.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    log("RELEASE PACKAGING COMPLETE!")
    print(f"Release folder location: {RELEASE_DIR}\n")


if __name__ == "__main__":
    build_frontend()
    build_backend()
    package_release()
