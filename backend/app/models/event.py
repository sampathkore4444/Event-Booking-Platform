import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Float,
    Boolean, Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    SOLD_OUT = "sold_out"


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)

    # Event details
    venue = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    is_virtual = Column(Boolean, default=False, nullable=False)
    virtual_link = Column(String(500), nullable=True)

    # Date & Time
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=True)

    # Capacity & Pricing
    total_capacity = Column(Integer, nullable=False)
    available_tickets = Column(Integer, nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)

    # Media
    banner_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)

    # Status
    status = Column(SAEnum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)

    # Foreign Keys
    organizer_id = Column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    category_id = Column(
        String(36), ForeignKey("categories.id"), nullable=True
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    organizer = relationship("User", back_populates="organized_events", lazy="selectin")
    category = relationship("Category", back_populates="events", lazy="selectin")
    bookings = relationship("Booking", back_populates="event", lazy="selectin")
    reviews = relationship("Review", back_populates="event", lazy="selectin")

    def __repr__(self):
        return f"<Event {self.title}>"

    @property
    def is_free(self) -> bool:
        return self.price == 0.0

    @property
    def is_full(self) -> bool:
        return self.available_tickets <= 0

    @property
    def booking_count(self) -> int:
        return len(self.bookings) if self.bookings else 0
