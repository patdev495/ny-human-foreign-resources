"""Facade module re-exporting master APIRouter from `routers/` package.
Ensures 100% backward compatibility for main.py router registration.
"""
from features.hr_foreign.routers import router

__all__ = ["router"]
