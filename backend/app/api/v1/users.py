from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Any, Optional, List

from app.database import get_db
from app.core.deps import get_current_user, require_admin
from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.user import crud_user
from app.schemas.user import UserResponse, UserUpdate, UserRoleUpdate
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
) -> Any:
    """Get list of users (admin only)."""
    users = crud_user.get_multi(
        db, skip=skip, limit=limit, role=role, search=search
    )
    return users


@router.get("/users/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current user's profile."""
    return current_user


@router.put("/users/me", response_model=UserResponse)
async def update_my_profile(
    *,
    db: Session = Depends(get_db),
    obj_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update current user's profile."""
    user = crud_user.update(db, db_obj=current_user, obj_in=obj_in)
    return user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get user by ID."""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise ForbiddenException("Cannot view other user profiles")
    user = crud_user.get(db, user_id)
    if not user:
        raise NotFoundException("User", user_id)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    obj_in: UserUpdate,
    current_user: User = Depends(require_admin),
) -> Any:
    """Update user (admin only)."""
    user = crud_user.get(db, user_id)
    if not user:
        raise NotFoundException("User", user_id)
    user = crud_user.update(db, db_obj=user, obj_in=obj_in)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Delete user (admin only)."""
    crud_user.remove(db, user_id=user_id)


@router.post("/users/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Activate user account (admin only)."""
    user = crud_user.activate(db, user_id=user_id)
    return user


@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Deactivate user account (admin only)."""
    user = crud_user.deactivate(db, user_id=user_id)
    return user


@router.post("/users/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Verify user email (admin only)."""
    user = crud_user.verify(db, user_id=user_id)
    return user


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def change_user_role(
    user_id: str,
    *,
    db: Session = Depends(get_db),
    obj_in: UserRoleUpdate,
    current_user: User = Depends(require_admin),
) -> Any:
    """Change a user's role (admin only).
    
    Available roles: attendee, organizer, admin
    """
    if current_user.id == user_id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Cannot change your own role")
    user = crud_user.change_role(db, user_id=user_id, new_role=obj_in.role)
    return user
