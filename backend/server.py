from __future__ import annotations

import os
import sys
from dotenv import load_dotenv

# Include current directory in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env files with priority to root release/.env
if getattr(sys, "frozen", False):
    exe_dir = os.path.dirname(sys.executable)
    load_dotenv(os.path.join(exe_dir, ".env"), override=True)
    load_dotenv(os.path.join(exe_dir, "..", ".env"), override=True)
else:
    load_dotenv(override=True)

import uvicorn
import pyodbc  # Explicit import for PyInstaller bundling

from core.config import settings
from main import app

if __name__ == "__main__":
    host = settings.host
    port = settings.port
    print("====================================================")
    print(" NY Human Resources System - Server Started")
    print(f" Access URL: http://localhost:{port}")
    print("====================================================")
    uvicorn.run(app, host=host, port=port, log_level="info")
