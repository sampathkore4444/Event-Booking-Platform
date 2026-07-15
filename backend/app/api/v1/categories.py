from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.database import get_db
from app.core.deps import require_admin, get_current_user
from app.core.exceptions import NotFoundException
from app.crud.category import crud_category
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)
from app.models.user import User

router = APIRouter()


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """Get all categories."""
    categories = crud_category.get_multi(db, skip=skip, limit=limit)
    return categories


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
) -> Any:
    """Get category by ID."""
    category = crud_category.get(db, category_id)
    if not category:
        raise NotFoundException("Category", category_id)
    return category


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    *,
    db: Session = Depends(get_db),
    obj_in: CategoryCreate,
    current_user: User = Depends(require_admin),
) -> Any:
    """Create a new category (admin only)."""
    category = crud_category.create(db, obj_in=obj_in)
    return category


@router.put(
    "/categories/{category_id}",
    response_model=CategoryResponse,
)
async def update_category(
    category_id: str,
    *,
    db: Session = Depends(get_db),
    obj_in: CategoryUpdate,
    current_user: User = Depends(require_admin),
) -> Any:
    """Update a category (admin only)."""
    category = crud_category.get(db, category_id)
    if not category:
        raise NotFoundException("Category", category_id)
    category = crud_category.update(db, db_obj=category, obj_in=obj_in)
    return category


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_category(
    category_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Delete a category (admin only)."""
    crud_category.remove(db, category_id=category_id)
