from .projects import router as projects_router
from .ai import router as ai_router
from .auth import router as auth_router
from .settings import router as settings_router

__all__ = ["projects_router", "ai_router", "auth_router", "settings_router"]
