from __future__ import annotations

import os
import sys
import uvicorn

# Include current directory in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.config import settings
from main import app

if __name__ == "__main__":
    host = os.environ.get("HOST", settings.host)
    port = int(os.environ.get("PORT", str(settings.port)))
    print("====================================================")
    print(" NY Human Resources System - Server Started")
    print(f" Access URL: http://localhost:{port}")
    print("====================================================")
    uvicorn.run(app, host=host, port=port, log_level="info")
