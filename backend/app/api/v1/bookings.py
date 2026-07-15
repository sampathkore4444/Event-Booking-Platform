from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Any, Optional, List

from app.database import get_db
from app.core.deps import (
    get_current_user,
    get_optional_user,
    require_admin,
)
from app.core.exceptions import ForbiddenException, NotFoundException, BookingException
from app.crud.booking import crud_booking
from app.crud.event import crud_event
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingListResponse,
)
from app.models.booking import BookingStatus
from app.models.user import User, UserRole
from app.services.email import email_service
from app.services.email_templates import (
    booking_confirmation_email,
    booking_cancelled_email,
    qr_payment_confirmed_email,
    qr_payment_rejected_email,
)

router = APIRouter()


@router.get("/bookings", response_model=BookingListResponse)
async def list_bookings(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get bookings for current user."""
    bookings = crud_booking.get_multi(
        db,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        status=status,
    )
    total = crud_booking.count(
        db, user_id=current_user.id, status=status
    )
    total_pages = max(1, (total + limit - 1) // limit)

    return BookingListResponse(
        bookings=bookings,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit,
        total_pages=total_pages,
    )


@router.get("/bookings/all", response_model=BookingListResponse)
async def list_all_bookings(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[BookingStatus] = None,
    event_id: Optional[str] = None,
    current_user: User = Depends(require_admin),
) -> Any:
    """Get all bookings (admin only)."""
    bookings = crud_booking.get_multi(
        db,
        skip=skip,
        limit=limit,
        event_id=event_id,
        status=status,
    )
    total = crud_booking.count(db, event_id=event_id, status=status)
    total_pages = max(1, (total + limit - 1) // limit)

    return BookingListResponse(
        bookings=bookings,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit,
        total_pages=total_pages,
    )


@router.get(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
)
async def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get booking by ID."""
    booking = crud_booking.get(db, booking_id)
    if not booking:
        raise NotFoundException("Booking", booking_id)
    if (
        current_user.role != UserRole.ADMIN
        and booking.user_id != current_user.id
    ):
        raise ForbiddenException("Cannot view this booking")
    return booking


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    *,
    db: Session = Depends(get_db),
    obj_in: BookingCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new booking."""
    booking = crud_booking.create(
        db, obj_in=obj_in, user_id=current_user.id
    )

    # Send confirmation email for free events (auto-confirmed)
    if booking.total_price == 0 and booking.status == BookingStatus.CONFIRMED:
        event = crud_event.get(db, booking.event_id)
        if event and event.organizer:
            event_date_str = event.start_date.strftime("%b %d, %Y at %I:%M %p") if event.start_date else "TBD"
            event_location = f"{event.city}, {event.country}"
            html = booking_confirmation_email(
                attendee_name=current_user.full_name,
                event_title=event.title,
                event_date=event_date_str,
                event_location=event_location,
                quantity=booking.quantity,
                total_price=booking.total_price,
                currency=booking.currency,
                booking_reference=booking.booking_reference,
                is_paid=True,
            ).replace("{{dashboard_url}}", f"{email_service.get_frontend_url()}/dashboard")
            await email_service.send_email(
                to_email=current_user.email,
                subject=f"Booking Confirmed: {event.title} 🎉",
                html_content=html,
            )

    return booking


@router.put(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
)
async def update_booking(
    booking_id: str,
    *,
    db: Session = Depends(get_db),
    obj_in: BookingUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update a booking."""
    booking = crud_booking.get(db, booking_id)
    if not booking:
        raise NotFoundException("Booking", booking_id)
    if (
        current_user.role != UserRole.ADMIN
        and booking.user_id != current_user.id
    ):
        raise ForbiddenException("Cannot update this booking")
    booking = crud_booking.update(db, db_obj=booking, obj_in=obj_in)
    return booking


@router.get("/bookings/organizer/pending-qr", response_model=List[BookingResponse])
async def get_organizer_pending_qr_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all pending QR code payment bookings for the current user's events.
    Used by organizers to view and manually confirm Cambodia QR payments.
    """
    bookings = crud_booking.get_multi(
        db,
        organizer_id=current_user.id,
        status=BookingStatus.PENDING,
    )
    # Filter to only Cambodia QR payment bookings
    qr_bookings = []
    for booking in bookings:
        if booking.payment_method == "cambodia_qr" or booking.payment_status == "pending_qr":
            qr_bookings.append(booking)
    return qr_bookings


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=BookingResponse,
)
async def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    refund: bool = Query(False),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Cancel a booking."""
    booking = crud_booking.get(db, booking_id)
    if not booking:
        raise NotFoundException("Booking", booking_id)
    if (
        current_user.role != UserRole.ADMIN
        and booking.user_id != current_user.id
    ):
        raise ForbiddenException("Cannot cancel this booking")
    booking = crud_booking.cancel(db, booking_id=booking_id, refund=refund)

    # Get the attendee and event for the email
    user = booking.user
    event = booking.event
    if user and event:
        html = booking_cancelled_email(
            attendee_name=user.full_name,
            event_title=event.title,
            booking_reference=booking.booking_reference,
            is_refund=refund,
        ).replace("{{explore_url}}", f"{email_service.get_frontend_url()}/events")
        await email_service.send_email(
            to_email=user.email,
            subject=f"Booking Cancelled: {event.title}",
            html_content=html,
        )

    return booking


@router.post(
    "/bookings/{booking_id}/confirm-qr",
    response_model=BookingResponse,
)
async def confirm_qr_payment(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Organizer manually confirms a Cambodia QR payment.
    Marks the booking as confirmed and paid.
    Only the event organizer can confirm QR payments for their events.
    """
    booking = crud_booking.get(db, booking_id)
    if not booking:
        raise NotFoundException("Booking", booking_id)

    # Get the event to check organizer
    event = crud_event.get(db, booking.event_id)
    if not event:
        raise NotFoundException("Event", booking.event_id)

    # Only admin or the event organizer can confirm
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise ForbiddenException("Only the event organizer can confirm QR payments")

    # Verify it's a QR payment
    if booking.payment_method != "cambodia_qr":
        raise BookingException("This booking doesn't use QR code payment")

    # Verify it's still pending
    if booking.status != BookingStatus.PENDING:
        raise BookingException(
            f"Cannot confirm booking with status '{booking.status.value}'"
        )

    # Confirm the booking
    booking = crud_booking.confirm(db, booking_id=booking_id)

    # Update payment status
    crud_booking.update(
        db,
        db_obj=booking,
        obj_in=BookingUpdate(
            payment_status="confirmed_by_organizer",
        ),
    )

    # Send confirmation email to attendee
    user = booking.user
    if user and event:
        event_date_str = event.start_date.strftime("%b %d, %Y at %I:%M %p") if event.start_date else "TBD"
        event_location = f"{event.city}, {event.country}"
        html = qr_payment_confirmed_email(
            attendee_name=user.full_name,
            event_title=event.title,
            event_date=event_date_str,
            event_location=event_location,
            quantity=booking.quantity,
            total_price=booking.total_price,
            currency=booking.currency,
            booking_reference=booking.booking_reference,
        ).replace("{{dashboard_url}}", f"{email_service.get_frontend_url()}/dashboard")
        await email_service.send_email(
            to_email=user.email,
            subject=f"Payment Confirmed: {event.title} ✅",
            html_content=html,
        )

    return booking


@router.post(
    "/bookings/{booking_id}/reject-qr",
    response_model=BookingResponse,
)
async def reject_qr_payment(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Organizer rejects a Cambodia QR payment.
    Cancels the booking and returns tickets to the event pool.
    """
    booking = crud_booking.get(db, booking_id)
    if not booking:
        raise NotFoundException("Booking", booking_id)

    event = crud_event.get(db, booking.event_id)
    if not event:
        raise NotFoundException("Event", booking.event_id)

    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise ForbiddenException("Only the event organizer can reject QR payments")

    if booking.payment_method != "cambodia_qr":
        raise BookingException("This booking doesn't use QR code payment")

    if booking.status != BookingStatus.PENDING:
        raise BookingException(
            f"Cannot reject booking with status '{booking.status.value}'"
        )

    booking = crud_booking.cancel(db, booking_id=booking_id, refund=False)

    # Send rejection email to attendee
    user = booking.user
    if user and event:
        html = qr_payment_rejected_email(
            attendee_name=user.full_name,
            event_title=event.title,
            booking_reference=booking.booking_reference,
        ).replace("{{dashboard_url}}", f"{email_service.get_frontend_url()}/dashboard")
        await email_service.send_email(
            to_email=user.email,
            subject=f"Payment Not Confirmed: {event.title}",
            html_content=html,
        )

    return booking


@router.post(
    "/bookings/{booking_id}/confirm",
    response_model=BookingResponse,
)
async def confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Confirm a booking (admin only)."""
    booking = crud_booking.confirm(db, booking_id=booking_id)
    return booking


@router.post(
    "/bookings/{booking_id}/no-show",
    response_model=BookingResponse,
)
async def mark_no_show(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Mark booking as no-show (admin only)."""
    booking = crud_booking.mark_no_show(db, booking_id=booking_id)
    return booking
