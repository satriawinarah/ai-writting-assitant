from .projects import router as projects_router
from .ai import router as ai_router
from .auth import router as auth_router
from .settings import router as settings_router
from .v1 import router as v1_router

__all__ = ["projects_router", "ai_router", "auth_router", "settings_router", "v1_router"]
