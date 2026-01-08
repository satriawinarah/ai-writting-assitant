from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
from pathlib import Path

from .api import projects_router, ai_router, auth_router, settings_router
from .database import engine, Base
from .config import get_settings
from .utils.rate_limiter import limiter

settings = get_settings()

# Create database tables
# NOTE: Using Alembic for migrations now
# Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="DiksiAI API",
    description="AI-powered writing assistant for Indonesian language",
    version="0.1.0",
    debug=settings.debug,
)

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(ai_router)
app.include_router(settings_router)


# Health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "0.1.0"}


# Serve static files (React build)
static_dir = Path(__file__).parent.parent / "static"

if static_dir.exists():
    # Mount static files
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # Serve index.html for all non-API routes (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't serve SPA for API routes
        if full_path.startswith("api/"):
            return {"error": "Not found"}

        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend not built yet"}
else:
    @app.get("/")
    def root():
        return {
            "message": "DiksiAI API",
            "docs": "/docs",
            "frontend": "not built yet - run build script first"
        }
