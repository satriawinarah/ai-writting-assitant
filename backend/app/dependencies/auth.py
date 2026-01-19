"""
Authentication dependencies for FastAPI endpoints.

Provides dependency injection for user authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User
from ..utils.auth import verify_token
from ..services.auth_service import AuthService

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(int(user_id))
    if user is None:
        raise credentials_exception

    return user


def get_current_approved_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current user and verify they are approved
    """
    if not current_user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not approved. Please wait for admin approval."
        )
    return current_user
