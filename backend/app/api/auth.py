from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from ..database import get_db
from ..models.project import User
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..dependencies.auth import get_current_user, get_current_approved_user
from ..config import get_settings
from ..utils.rate_limiter import limiter, RATE_LIMIT_LOGIN, RATE_LIMIT_REGISTER, RATE_LIMIT_DEFAULT

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(RATE_LIMIT_REGISTER)
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (requires admin approval)
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
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

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
@limiter.limit(RATE_LIMIT_LOGIN)
async def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/username and password
    """
    # Find user by email or username
    user = db.query(User).filter(
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
