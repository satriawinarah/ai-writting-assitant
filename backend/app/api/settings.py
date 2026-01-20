"""
Settings API endpoints for user preferences and configurations.

This module provides endpoints for managing user settings
including custom writing style prompts.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserSettings
from ..schemas.settings import UserSettingsResponse, UserSettingsUpdate
from ..dependencies.auth import get_current_approved_user
from ..services.llm import WRITING_STYLES, TITLE_STYLES
from ..utils.rate_limiter import limiter, RATE_LIMIT_DEFAULT

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/default-prompts")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def get_default_prompts(request: Request):
    """Get all default writing style prompts."""
    return {
        "writing_styles": WRITING_STYLES,
        "title_styles": TITLE_STYLES
    }


@router.get("/me", response_model=UserSettingsResponse)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def get_my_settings(
    request: Request,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Get current user's settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        # Create default settings if they don't exist
        settings = UserSettings(user_id=current_user.id, custom_prompts={})
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/me", response_model=UserSettingsResponse)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def update_my_settings(
    request: Request,
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Update current user's settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        # Create settings if they don't exist
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    # Update custom prompts
    settings.custom_prompts = settings_update.custom_prompts

    db.commit()
    db.refresh(settings)

    return settings
