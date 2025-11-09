from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


class UserSettingsBase(BaseModel):
    custom_prompts: Optional[Dict[str, str]] = {}


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(UserSettingsBase):
    pass


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
