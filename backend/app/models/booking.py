import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Float,
    Boolean, Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_reference = Column(
        String(20), unique=True, index=True, nullable=False
    )

    # Tickets
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)

    # Status
    status = Column(SAEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    is_paid = Column(Boolean, default=False, nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Special requests
    special_requests = Column(Text, nullable=True)

    # Check-in fields (for QR code scanning at the door)
    check_in_code = Column(String(64), unique=True, index=True, nullable=True)
    checked_in_at = Column(DateTime, nullable=True)
    checked_in_by = Column(String(36), nullable=True)  # organizer user ID

    # Foreign Keys
    user_id = Column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    event_id = Column(
        String(36), ForeignKey("events.id"), nullable=False
    )

    # Timestamps
    booked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings", lazy="selectin")
    event = relationship("Event", back_populates="bookings", lazy="selectin")

    def __repr__(self):
        return f"<Booking {self.booking_reference}>"
