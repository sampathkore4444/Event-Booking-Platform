from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User, UserRole
from app.crud.user import crud_user

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    """Get the current authenticated user."""
    if not token:
        raise UnauthorizedException("Not authenticated")

    user_id = verify_token(token, expected_type="access")
    if not user_id:
        raise UnauthorizedException("Invalid or expired token")

    user = crud_user.get(db, user_id)
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("User account is deactivated")

    return user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user - must be verified."""
    if not current_user.is_verified:
        raise ForbiddenException("Email not verified. Please verify your email.")
    return current_user


async def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not token:
        return None
    user_id = verify_token(token, expected_type="access")
    if not user_id:
        return None
    user = crud_user.get(db, user_id)
    return user if user and user.is_active else None


def require_role(*roles: UserRole):
    """Dependency factory to require specific user roles."""

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(
                f"Requires one of these roles: {', '.join(r.value for r in roles)}"
            )
        return current_user

    return role_checker


require_admin = require_role(UserRole.ADMIN)
require_organizer = require_role(UserRole.ORGANIZER, UserRole.ADMIN)
require_admin_or_organizer = require_role(UserRole.ADMIN, UserRole.ORGANIZER)
