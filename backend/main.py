from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from core.config import settings
from core.database import init_db
from features.hr_foreign.router import router as hr_foreign_router
from features.vehicle_management.router import router as vehicle_management_router


import asyncio
from features.hr_foreign.services.scheduler import run_email_scheduler_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler_task = asyncio.create_task(run_email_scheduler_loop())
    try:
        yield
    finally:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass



def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(hr_foreign_router, prefix="/api/hr-foreign", tags=["HR Foreign"])
    app.include_router(vehicle_management_router)


    # Locate static frontend dist directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        static_dir = os.path.join(exe_dir, "..", "static")
        if not os.path.exists(static_dir):
            static_dir = os.path.join(exe_dir, "static")
    else:
        static_dir = os.path.join(base_dir, "..", "static")
        if not os.path.exists(static_dir):
            static_dir = os.path.join(base_dir, "..", "frontend", "dist")

    if os.path.exists(static_dir):
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}")
        async def serve_frontend(full_path: str):
            if full_path.startswith("api/"):
                return None
            target_path = os.path.join(static_dir, full_path)
            if os.path.exists(target_path) and os.path.isfile(target_path):
                return FileResponse(target_path)
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return None

    return app


app = create_app()
