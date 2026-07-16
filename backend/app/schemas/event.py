from pydantic import BaseModel, Field, computed_field
from typing import Optional, List
from datetime import datetime
from app.models.event import EventStatus


class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    short_description: Optional[str] = Field(None, max_length=500)
    venue: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None
    city: str = Field(..., min_length=2, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    is_virtual: bool = False
    virtual_link: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    total_capacity: int = Field(..., gt=0)
    price: float = Field(default=0.0, ge=0.0)
    currency: str = "USD"
    banner_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category_id: Optional[str] = None
    is_featured: bool = False


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    short_description: Optional[str] = Field(None, max_length=500)
    venue: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    is_virtual: Optional[bool] = None
    virtual_link: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    total_capacity: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0.0)
    currency: Optional[str] = None
    banner_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category_id: Optional[str] = None
    is_featured: Optional[bool] = None
    status: Optional[EventStatus] = None


class EventResponse(EventBase):
    id: str
    available_tickets: int
    status: EventStatus
    is_approved: bool
    organizer_id: str
    created_at: datetime
    updated_at: datetime

    # Nested relationships (lazy loaded via selectin)
    category: Optional["CategoryResponse"] = None
    organizer: Optional["UserResponse"] = None

    # Computed properties (read from SQLAlchemy @property via from_attributes)
    @computed_field
    @property
    def is_free(self) -> bool:
        return self.price == 0.0

    @computed_field
    @property
    def is_full(self) -> bool:
        return self.available_tickets <= 0

    # Read from SQLAlchemy model's @property via from_attributes
    booking_count: int = 0

    model_config = {"from_attributes": True}


# Deferred imports to avoid circular dependencies
from app.schemas.category import CategoryResponse  # noqa: E402, F811
from app.schemas.user import UserResponse  # noqa: E402, F811

EventResponse.model_rebuild()


class EventListResponse(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
