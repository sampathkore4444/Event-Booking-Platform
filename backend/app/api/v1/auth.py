from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.deps import get_current_user
from app.core.exceptions import UnauthorizedException, DuplicateException
from app.crud.user import crud_user
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    TokenRefresh,
)
from app.schemas.user import UserResponse
from app.models.user import User
from app.core.limiter import limiter

router = APIRouter()


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request,
    *,
    db: Session = Depends(get_db),
    obj_in: RegisterRequest,
) -> Any:
    """Register a new user account."""
    # Check for existing user
    if crud_user.get_by_email(db, email=obj_in.email):
        raise DuplicateException("User", "email")
    if crud_user.get_by_username(db, username=obj_in.username):
        raise DuplicateException("User", "username")

    from app.schemas.user import UserCreate

    user = crud_user.create(
        db,
        obj_in=UserCreate(
            email=obj_in.email,
            username=obj_in.username,
            full_name=obj_in.full_name,
            password=obj_in.password,
            phone=obj_in.phone,
        ),
    )
    return user


@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    *,
    db: Session = Depends(get_db),
    obj_in: LoginRequest,
) -> Any:
    """Authenticate user and return tokens."""
    user = crud_user.get_by_email(db, email=obj_in.email)
    if not user:
        raise UnauthorizedException("Incorrect email or password")
    if not verify_password(obj_in.password, user.hashed_password):
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise UnauthorizedException("User account is deactivated")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30,  # minutes
    )


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(
    *,
    db: Session = Depends(get_db),
    obj_in: TokenRefresh,
) -> Any:
    """Refresh access token using refresh token."""
    payload = decode_token(obj_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid refresh token")

    user = crud_user.get(db, user_id)
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=30,
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current authenticated user."""
    return current_user


@router.post("/auth/logout")
async def logout(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Logout (in a stateless JWT setup, this is a no-op on server side)."""
    return {"message": "Successfully logged out"}
