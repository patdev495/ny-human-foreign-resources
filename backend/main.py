from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

from core.config import settings
from core.database import init_db
from features.hr_foreign.router import router as hr_foreign_router
from features.vehicle_management.router import router as vehicle_management_router
from features.auth.router import router as auth_router, admin_router
from features.auth.security import require_user


import asyncio
from features.hr_foreign.services.scheduler import run_email_scheduler_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler_task = None
    if os.getenv("TESTING") != "1":
        scheduler_task = asyncio.create_task(run_email_scheduler_loop())
    try:
        yield
    finally:
        if scheduler_task:
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
        allow_origins=[origin for origin in settings.cors_origins if origin != "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def reject_cross_origin_writes(request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            own_origin = f"{request.url.scheme}://{request.headers.get('host', '')}"
            if origin and origin != own_origin and origin not in settings.cors_origins:
                return JSONResponse(status_code=403, content={"detail": "Cross-origin request denied"})
        return await call_next(request)

    app.include_router(auth_router)
    app.include_router(admin_router)
    app.include_router(
        hr_foreign_router, prefix="/api/hr-foreign", tags=["HR Foreign"],
        dependencies=[Depends(require_user)],
    )
    app.include_router(vehicle_management_router, dependencies=[Depends(require_user)])


    # Locate static frontend dist directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        static_dir = os.path.join(exe_dir, "..", "static")
        if not os.path.exists(static_dir):
            static_dir = os.path.join(exe_dir, "static")
    else:
        frontend_dist_dir = os.path.join(base_dir, "..", "frontend", "dist")
        legacy_static_dir = os.path.join(base_dir, "..", "static")
        static_dir = (
            frontend_dist_dir
            if os.path.exists(frontend_dist_dir)
            else legacy_static_dir
        )

    if os.path.exists(static_dir):
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}", response_model=None)
        async def serve_frontend(full_path: str) -> FileResponse | None:
            if full_path.startswith("api/"):
                return None
            target_path = os.path.join(static_dir, full_path)
            if os.path.exists(target_path) and os.path.isfile(target_path):
                headers = {"Cache-Control": "no-store"} if full_path == "index.html" else None
                return FileResponse(target_path, headers=headers)
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path, headers={"Cache-Control": "no-store"})
            return None

    return app


app = create_app()
