from fastapi import APIRouter

from .employee_router import router as employee_router
from .stay_router import router as stay_router
from .meal_router import router as meal_router
from .legal_doc_router import router as legal_doc_router
from .accommodation_router import router as accommodation_router
from .email_router import router as email_router

router = APIRouter()

router.include_router(employee_router)
router.include_router(stay_router)
router.include_router(meal_router)
router.include_router(legal_doc_router)
router.include_router(accommodation_router)
router.include_router(email_router)

__all__ = ["router"]

