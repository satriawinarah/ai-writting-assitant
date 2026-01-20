"""
Authentication API endpoints.

Provides endpoints for user registration, login, and logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token
from ..services.auth_service import AuthService
from ..dependencies.auth import get_current_approved_user
from ..utils.rate_limiter import limiter, RATE_LIMIT_LOGIN, RATE_LIMIT_REGISTER, RATE_LIMIT_DEFAULT

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(RATE_LIMIT_REGISTER)
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (requires admin approval)
    """
    auth_service = AuthService(db)
    return auth_service.register_user(user_data)


@router.post("/login", response_model=Token)
@limiter.limit(RATE_LIMIT_LOGIN)
async def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/username and password
    """
    auth_service = AuthService(db)
    user, access_token = auth_service.authenticate_user(login_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_approved_user)
):
    """
    Get current authenticated user information
    """
    return current_user


@router.post("/logout")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def logout(request: Request):
    """
    Logout endpoint (client should remove token)
    """
    return {"message": "Successfully logged out"}
