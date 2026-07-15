from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime
from app.models.booking import Booking, BookingStatus
from app.models.event import Event, EventStatus
from app.schemas.booking import BookingCreate, BookingUpdate
from app.core.exceptions import (
    NotFoundException,
    BookingException,
    BadRequestException,
)
from app.utils.helpers import generate_booking_reference, calculate_total_price, generate_check_in_code


class CRUDBooking:
    """CRUD operations for Booking model."""

    def get(self, db: Session, booking_id: str) -> Optional[Booking]:
        return db.query(Booking).filter(Booking.id == booking_id).first()

    def get_by_reference(
        self, db: Session, reference: str
    ) -> Optional[Booking]:
        return db.query(Booking).filter(
            Booking.booking_reference == reference
        ).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        event_id: Optional[str] = None,
        status: Optional[BookingStatus] = None,
        organizer_id: Optional[str] = None,
    ) -> List[Booking]:
        query = db.query(Booking)

        if user_id:
            query = query.filter(Booking.user_id == user_id)
        if event_id:
            query = query.filter(Booking.event_id == event_id)
        if status:
            query = query.filter(Booking.status == status)
        if organizer_id:
            query = query.join(Event).filter(
                Event.organizer_id == organizer_id
            )

        return (
            query.order_by(desc(Booking.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count(
        self,
        db: Session,
        *,
        user_id: Optional[str] = None,
        event_id: Optional[str] = None,
        status: Optional[BookingStatus] = None,
    ) -> int:
        query = db.query(Booking)
        if user_id:
            query = query.filter(Booking.user_id == user_id)
        if event_id:
            query = query.filter(Booking.event_id == event_id)
        if status:
            query = query.filter(Booking.status == status)
        return query.count()

    def create(
        self, db: Session, *, obj_in: BookingCreate, user_id: str
    ) -> Booking:
        # Lock the event row to prevent race conditions on available_tickets
        event = (
            db.query(Event)
            .filter(Event.id == obj_in.event_id)
            .with_for_update()
            .first()
        )
        if not event:
            raise NotFoundException("Event", obj_in.event_id)

        # Check event status
        if event.status != EventStatus.PUBLISHED:
            raise BookingException("Event is not available for booking")

        # Check if event is full (inside lock, safe from race conditions)
        if event.available_tickets < obj_in.quantity:
            raise BookingException(
                f"Only {event.available_tickets} tickets available"
            )

        # Check registration deadline
        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            raise BookingException("Registration deadline has passed")

        # Check if user already has a confirmed booking
        existing_booking = (
            db.query(Booking)
            .filter(
                Booking.user_id == user_id,
                Booking.event_id == obj_in.event_id,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            )
            .first()
        )
        if existing_booking:
            raise BookingException(
                "You already have an active booking for this event"
            )

        # Calculate total price
        unit_price = event.price
        total_price = calculate_total_price(unit_price, obj_in.quantity)

        # Create booking
        db_obj = Booking(
            booking_reference=generate_booking_reference(),
            user_id=user_id,
            event_id=obj_in.event_id,
            quantity=obj_in.quantity,
            unit_price=unit_price,
            total_price=total_price,
            currency=event.currency,
            special_requests=obj_in.special_requests,
            status=BookingStatus.PENDING,
        )

        # Update available tickets (inside lock, safe from race conditions)
        event.available_tickets -= obj_in.quantity

        # If no more tickets, mark as sold out
        if event.available_tickets <= 0:
            event.status = EventStatus.SOLD_OUT

        db.add(db_obj)
        db.add(event)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Booking, obj_in: BookingUpdate
    ) -> Booking:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def confirm(self, db: Session, *, booking_id: str) -> Booking:
        booking = self.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)
        if booking.status != BookingStatus.PENDING:
            raise BookingException(
                f"Cannot confirm booking with status '{booking.status.value}'"
            )
        booking.status = BookingStatus.CONFIRMED
        booking.confirmed_at = datetime.utcnow()
        booking.is_paid = True
        # Generate unique check-in code for QR ticket
        if not booking.check_in_code:
            booking.check_in_code = generate_check_in_code()
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def check_in(self, db: Session, *, booking_id: str, checked_in_by: str) -> Booking:
        """Mark a booking as checked-in at the event door."""
        booking = self.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)
        if booking.status != BookingStatus.CONFIRMED:
            raise BookingException(
                f"Cannot check-in booking with status '{booking.status.value}'"
            )
        if booking.checked_in_at:
            raise BookingException("Booking already checked in")
        booking.checked_in_at = datetime.utcnow()
        booking.checked_in_by = checked_in_by
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def cancel(
        self, db: Session, *, booking_id: str, refund: bool = False
    ) -> Booking:
        booking = self.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)
        if booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED]:
            raise BookingException("Booking is already cancelled")

        # Return tickets to event
        event = db.query(Event).filter(Event.id == booking.event_id).first()
        if event:
            event.available_tickets += booking.quantity
            if event.status == EventStatus.SOLD_OUT:
                event.status = EventStatus.PUBLISHED
            db.add(event)

        booking.status = (
            BookingStatus.REFUNDED if refund else BookingStatus.CANCELLED
        )
        booking.cancelled_at = datetime.utcnow()
        if refund:
            booking.is_paid = False

        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def mark_no_show(self, db: Session, *, booking_id: str) -> Booking:
        booking = self.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)
        booking.status = BookingStatus.NO_SHOW
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def complete(self, db: Session, *, booking_id: str) -> Booking:
        booking = self.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)
        booking.status = BookingStatus.COMPLETED
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking


crud_booking = CRUDBooking()
