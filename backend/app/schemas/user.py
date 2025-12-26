from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re

# Constants for validation
MAX_USERNAME_LENGTH = 50
MAX_FULLNAME_LENGTH = 100
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=MAX_USERNAME_LENGTH, pattern=r'^[a-zA-Z0-9_]+$')
    full_name: str = Field(..., min_length=1, max_length=MAX_FULLNAME_LENGTH)


class UserCreate(UserBase):
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserResponse(UserBase):
    id: int
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    login: str = Field(..., min_length=3, max_length=255)  # Can be email or username
    password: str = Field(..., min_length=1, max_length=MAX_PASSWORD_LENGTH)
    remember_me: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
