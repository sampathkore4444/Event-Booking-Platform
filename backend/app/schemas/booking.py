from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.booking import BookingStatus


class BookingBase(BaseModel):
    quantity: int = Field(default=1, gt=0)
    special_requests: Optional[str] = None


class BookingCreate(BookingBase):
    event_id: str


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    is_paid: Optional[bool] = None
    payment_method: Optional[str] = None
    payment_id: Optional[str] = None
    payment_status: Optional[str] = None


class BookingResponse(BookingBase):
    id: str
    booking_reference: str
    unit_price: float
    total_price: float
    currency: str
    status: BookingStatus
    is_paid: bool
    payment_method: Optional[str] = None
    payment_id: Optional[str] = None
    notes: Optional[str] = None
    user_id: str
    event_id: str
    booked_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Check-in fields (for QR ticket system)
    check_in_code: Optional[str] = None
    checked_in_at: Optional[datetime] = None

    # Nested relationships (lazy loaded via selectin)
    event: Optional["EventResponse"] = None
    user: Optional["UserResponse"] = None

    model_config = {"from_attributes": True}


# Deferred imports to avoid circular dependencies
from app.schemas.event import EventResponse  # noqa: E402, F811
from app.schemas.user import UserResponse  # noqa: E402, F811

BookingResponse.model_rebuild()


class BookingListResponse(BaseModel):
    bookings: List[BookingResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
