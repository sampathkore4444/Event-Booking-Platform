from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.crud.review import crud_review
from app.crud.booking import crud_booking
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewListResponse
from app.models.booking import BookingStatus
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/reviews/event/{event_id}", response_model=ReviewListResponse)
async def get_event_reviews(
    event_id: str, db: Session = Depends(get_db),
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get all reviews for an event with stats."""
    reviews = crud_review.get_multi(db, event_id=event_id, skip=skip, limit=limit)
    stats = crud_review.get_stats(db, event_id=event_id)
    return ReviewListResponse(
        reviews=reviews,
        total=stats["total"],
        average_rating=stats["average_rating"],
        distribution=stats["distribution"],
    )


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    *, db: Session = Depends(get_db), obj_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a review for an event. Only verified attendees can review."""
    # Check user has a confirmed/completed booking for this event
    bookings = crud_booking.get_multi(
        db, user_id=current_user.id, event_id=obj_in.event_id,
        status=BookingStatus.CONFIRMED,
    )
    if not bookings and current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Only attendees who attended can review this event")
    return crud_review.create(db, obj_in=obj_in, user_id=current_user.id)


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str, *, db: Session = Depends(get_db),
    obj_in: ReviewUpdate, current_user: User = Depends(get_current_user),
) -> Any:
    """Update your own review."""
    review = crud_review.get(db, review_id)
    if not review:
        raise NotFoundException("Review", review_id)
    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Cannot edit this review")
    return crud_review.update(db, db_obj=review, obj_in=obj_in)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a review (owner or admin)."""
    review = crud_review.get(db, review_id)
    if not review:
        raise NotFoundException("Review", review_id)
    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Cannot delete this review")
    crud_review.delete(db, review_id=review_id)


@router.get("/reviews/my")
async def get_my_reviews(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get reviews written by the current user."""
    reviews = crud_review.get_multi(db, skip=skip, limit=limit)
    # Filter to current user's reviews
    user_reviews = [r for r in reviews if r.user_id == current_user.id]
    return {"reviews": user_reviews, "total": len(user_reviews)}
