from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5 stars")
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    event_id: str


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(ReviewBase):
    id: str
    user_id: str
    event_id: str
    is_verified: int
    created_at: datetime
    updated_at: datetime

    # Nested
    user: Optional["UserResponse"] = None

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    average_rating: float
    distribution: dict  # {1: count, 2: count, ...}


from app.schemas.user import UserResponse  # noqa: E402, F811
