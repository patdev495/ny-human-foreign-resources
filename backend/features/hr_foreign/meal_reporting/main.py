from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect

from core.database import engine, init_db

from features.hr_foreign.meal_reporting.router import router
from features.hr_foreign.end_shift_reporting.router import router as end_shift_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if os.getenv("TESTING") != "1":
        init_db()
        inspector = inspect(engine)
        if any(not inspector.has_table(table) for table in (
            "meal_reports", "meal_report_revisions", "meal_session_lock_revisions", "end_shift_reports"
        )):
            raise RuntimeError("Meal reporting tables are unavailable")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="NY Meal Reporting", lifespan=lifespan)
    app.include_router(router)
    app.include_router(end_shift_router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    portal_dist = Path(__file__).resolve().parents[4] / "frontend" / "portal-dist"
    if portal_dist.exists():
        assets = portal_dist / "assets"
        if assets.exists():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/", include_in_schema=False)
        def portal() -> FileResponse:
            return FileResponse(portal_dist / "portal.html")

    return app


app = create_app()
