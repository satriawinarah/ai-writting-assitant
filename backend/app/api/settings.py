from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from ..database import get_db
from ..models.project import User, UserSettings
from ..schemas.settings import UserSettingsResponse, UserSettingsUpdate
from ..dependencies.auth import get_current_approved_user
from ..services.llm_service import LLMService

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/default-prompts")
async def get_default_prompts():
    """Get all default writing style prompts"""
    llm_service = LLMService()
    return {
        "writing_styles": llm_service.WRITING_STYLES,
        "title_styles": llm_service.TITLE_STYLES
    }


@router.get("/me", response_model=UserSettingsResponse)
async def get_my_settings(
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
async def update_my_settings(
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
