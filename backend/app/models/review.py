import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Float,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class Review(Base):
    """Event ratings and reviews left by attendees after the event."""
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_user_event_review"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    is_verified = Column(Integer, default=0)  # Verified attendee review

    # Foreign Keys
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", lazy="selectin")
    event = relationship("Event", back_populates="reviews", lazy="selectin")

    def __repr__(self):
        return f"<Review {self.rating}★ by {self.user_id} on {self.event_id}>"
