"""
API v1 router.

This module aggregates all v1 API routes under a single versioned prefix.
"""

from fastapi import APIRouter

from ..projects import router as projects_router
from ..ai import router as ai_router
from ..auth import router as auth_router
from ..settings import router as settings_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(projects_router)
router.include_router(ai_router)
router.include_router(settings_router)
