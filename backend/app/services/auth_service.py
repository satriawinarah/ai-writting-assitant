"""
Authentication service for business logic.

This module separates authentication business logic from API endpoints,
making it easier to test and maintain.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import timedelta
from typing import Optional

from ..models import User
from ..schemas.user import UserCreate, UserLogin
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..config import get_settings

settings = get_settings()


class AuthService:
    """Service class for authentication operations."""

    def __init__(self, db: Session):
        self.db = db

    def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user with validation.

        Args:
            user_data: User registration data

        Returns:
            Created user instance

        Raises:
            HTTPException: If email or username already exists
        """
        # Check if email already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if username already exists
        existing_user = self.db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_approved=False  # Requires admin approval
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        return new_user

    def authenticate_user(self, login_data: UserLogin) -> tuple[User, str]:
        """
        Authenticate user and generate access token.

        Args:
            login_data: Login credentials

        Returns:
            Tuple of (user, access_token)

        Raises:
            HTTPException: If authentication fails
        """
        # Find user by email or username
        user = self.db.query(User).filter(
            (User.email == login_data.login) | (User.username == login_data.login)
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password"
            )

        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password"
            )

        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending approval. Please contact an administrator."
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
        if login_data.remember_me:
            # Extend token expiry for remember me (30 days)
            access_token_expires = timedelta(days=30)

        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )

        return user, access_token

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User instance or None
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email.

        Args:
            email: User email

        Returns:
            User instance or None
        """
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username

        Returns:
            User instance or None
        """
        return self.db.query(User).filter(User.username == username).first()
