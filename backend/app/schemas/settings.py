from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Dict

# Constants for validation
MAX_PROMPT_KEY_LENGTH = 50
MAX_PROMPT_VALUE_LENGTH = 5000
MAX_CUSTOM_PROMPTS = 20


class UserSettingsBase(BaseModel):
    custom_prompts: Optional[Dict[str, str]] = Field(default_factory=dict)

    @field_validator('custom_prompts')
    @classmethod
    def validate_custom_prompts(cls, v: Optional[Dict[str, str]]) -> Dict[str, str]:
        if v is None:
            return {}
        if len(v) > MAX_CUSTOM_PROMPTS:
            raise ValueError(f'Maximum {MAX_CUSTOM_PROMPTS} custom prompts allowed')
        for key, value in v.items():
            if len(key) > MAX_PROMPT_KEY_LENGTH:
                raise ValueError(f'Prompt key must be at most {MAX_PROMPT_KEY_LENGTH} characters')
            if len(value) > MAX_PROMPT_VALUE_LENGTH:
                raise ValueError(f'Prompt value must be at most {MAX_PROMPT_VALUE_LENGTH} characters')
        return v


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
