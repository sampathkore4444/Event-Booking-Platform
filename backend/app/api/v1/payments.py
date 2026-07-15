"""
Payment API endpoints for Stripe integration.
Handles creating Checkout Sessions and processing webhook events.
"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundException, BookingException
from app.crud.booking import crud_booking
from app.crud.event import crud_event
from app.models.booking import Booking, BookingStatus
from app.models.event import Event
from app.models.user import User
from app.services.payment import (
    create_checkout_session,
    construct_webhook_event,
    format_amount_for_stripe,
)
from app.services.qr_payment import (
    generate_cambodia_qr_base64,
    should_use_qr_payment,
)
from app.config import settings
from app.schemas.booking import BookingUpdate
from pydantic import BaseModel

router = APIRouter()


class CheckoutRequest(BaseModel):
    booking_id: str


class CheckoutResponse(BaseModel):
    url: str
    session_id: str
    payment_method: str = "stripe_checkout"


class QRPaymentRequest(BaseModel):
    booking_id: str


class QRPaymentResponse(BaseModel):
    qr_base64: str
    khqr_string: str
    merchant_name: str
    amount: float
    currency: str
    bill_number: str
    instructions: str


@router.post("/payments/create-checkout-session", response_model=CheckoutResponse)
async def create_booking_checkout_session(
    *,
    db: Session = Depends(get_db),
    obj_in: CheckoutRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a Stripe Checkout Session for a pending booking.
    Uses UPI for Indian events, standard card for others.
    For Cambodian events, use /payments/generate-qr instead.
    """
    # Get the booking
    booking = crud_booking.get(db, obj_in.booking_id)
    if not booking:
        raise NotFoundException("Booking", obj_in.booking_id)

    # Verify ownership
    if booking.user_id != current_user.id:
        raise BookingException("This booking does not belong to you")

    # Verify booking is pending and not paid
    if booking.status != BookingStatus.PENDING:
        raise BookingException(
            f"Cannot pay for booking with status '{booking.status.value}'"
        )

    # Verify it's not a free event
    if booking.total_price == 0:
        raise BookingException("This booking is free — no payment needed")

    # Get event details
    event = crud_event.get(db, booking.event_id)
    if not event:
        raise NotFoundException("Event", booking.event_id)

    # Cambodia events use QR code — redirect to the QR endpoint
    if should_use_qr_payment(event.country):
        raise BookingException(
            "Cambodian events use QR code payment. Please use the payment QR option."
        )

    # Build success/cancel URLs
    base_url = str(settings.CORS_ORIGINS[0]).rstrip("/") if settings.CORS_ORIGINS else "http://localhost:5173"
    success_url = f"{base_url}/dashboard?payment=success&booking={booking.booking_reference}"
    cancel_url = f"{base_url}/events/{event.slug}?payment=cancelled"

    # Create Stripe Checkout Session (UPI auto-enabled for India, card for others)
    result = create_checkout_session(
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        amount_cents=format_amount_for_stripe(booking.unit_price),
        currency=booking.currency,
        event_title=event.title,
        quantity=booking.quantity,
        customer_email=current_user.email,
        success_url=success_url,
        cancel_url=cancel_url,
        country=event.country,
    )

    # Store the Stripe session ID on the booking
    methods = result.get("payment_methods", ["card"])
    method_str = "stripe_upi" if "upi" in methods else "stripe_checkout"

    crud_booking.update(
        db,
        db_obj=booking,
        obj_in=BookingUpdate(
            payment_id=result["session_id"],
            payment_method=method_str,
            payment_status="pending",
        ),
    )

    return CheckoutResponse(
        url=result["url"],
        session_id=result["session_id"],
        payment_method=method_str,
    )


@router.post("/payments/generate-qr", response_model=QRPaymentResponse)
async def generate_qr_payment(
    *,
    db: Session = Depends(get_db),
    obj_in: QRPaymentRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate a QR code for Cambodia Bakong/KHQR payment.
    Returns a base64-encoded QR image that the frontend displays.
    The user scans it with their banking app to pay.
    """
    # Get the booking
    booking = crud_booking.get(db, obj_in.booking_id)
    if not booking:
        raise NotFoundException("Booking", obj_in.booking_id)

    # Verify ownership
    if booking.user_id != current_user.id:
        raise BookingException("This booking does not belong to you")

    # Verify booking is pending
    if booking.status != BookingStatus.PENDING:
        raise BookingException(
            f"Cannot pay for booking with status '{booking.status.value}'"
        )

    if booking.total_price == 0:
        raise BookingException("This booking is free — no payment needed")

    # Get event details
    event = crud_event.get(db, booking.event_id)
    if not event:
        raise NotFoundException("Event", booking.event_id)

    # Verify this is a Cambodian event
    if not should_use_qr_payment(event.country):
        raise BookingException(
            "QR code payment is only available for events in Cambodia. "
            "Use the standard checkout for this event."
        )

    # Generate the QR code
    merchant_name = f"EventHub/{event.organizer.full_name[:20] if event.organizer else 'Organizer'}"
    qr_base64, khqr_string = generate_cambodia_qr_base64(
        merchant_name=merchant_name,
        merchant_city=event.city[:15],
        amount=booking.total_price,
        currency=booking.currency,
        bill_number=booking.booking_reference,
    )

    # Mark payment method on booking
    crud_booking.update(
        db,
        db_obj=booking,
        obj_in=BookingUpdate(
            payment_method="cambodia_qr",
            payment_status="pending_qr",
        ),
    )

    instructions = (
        f"Scan this QR code with your Bakong or banking app to pay "
        f"${booking.total_price:.2f} {booking.currency} "
        f"for {booking.quantity} ticket(s)."
    )

    # Notify the event organizer about the new QR payment
    try:
        from app.services.email import email_service
        from app.services.email_templates import organizer_qr_notification_email

        organizer = event.organizer if event.organizer else None
        if organizer and organizer.email:
            html = organizer_qr_notification_email(
                organizer_name=organizer.full_name,
                attendee_name=current_user.full_name,
                attendee_email=current_user.email,
                event_title=event.title,
                quantity=booking.quantity,
                total_price=booking.total_price,
                currency=booking.currency,
                booking_reference=booking.booking_reference,
            ).replace("{{dashboard_url}}", f"{email_service.get_frontend_url()}/dashboard")
            await email_service.send_email(
                to_email=organizer.email,
                subject=f"New QR Payment: {event.title} - {current_user.full_name}",
                html_content=html,
            )
    except Exception as e:
        print(f"generate-qr: failed to notify organizer: {e}")

    return QRPaymentResponse(
        qr_base64=qr_base64,
        khqr_string=khqr_string,
        merchant_name=merchant_name,
        amount=booking.total_price,
        currency=booking.currency,
        bill_number=booking.booking_reference,
        instructions=instructions,
    )


@router.post("/payments/webhook")
async def stripe_webhook(request: Request) -> Any:
    """
    Stripe webhook endpoint.
    Handles checkout.session.completed and checkout.session.expired events.
    """
    # Get the raw body and signature header
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    # Verify the webhook signature
    event = construct_webhook_event(payload, sig_header)
    if not event:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Handle the event
    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data)
    elif event_type == "checkout.session.expired":
        await _handle_checkout_expired(data)
    elif event_type == "checkout.session.async_payment_failed":
        await _handle_checkout_failed(data)

    return {"status": "ok"}


async def _handle_checkout_completed(session: dict) -> None:
    """Handle a successful checkout session - confirm the booking."""
    from app.database import SessionLocal

    metadata = session.get("metadata", {})
    booking_id = metadata.get("booking_id")
    payment_intent = session.get("payment_intent")
    payment_status = session.get("payment_status")

    if not booking_id:
        print("Stripe webhook: missing booking_id in metadata")
        return

    if payment_status != "paid":
        print(f"Stripe webhook: payment not completed ({payment_status})")
        return

    db = SessionLocal()
    try:
        booking = crud_booking.get(db, booking_id)
        if not booking:
            print(f"Stripe webhook: booking {booking_id} not found")
            return

        if booking.status != BookingStatus.PENDING:
            print(f"Stripe webhook: booking {booking_id} already {booking.status}")
            return

        # Confirm the booking
        booking = crud_booking.confirm(db, booking_id=booking_id)

        # Update payment details
        crud_booking.update(
            db,
            db_obj=booking,
            obj_in=BookingUpdate(
                payment_id=str(payment_intent),
                is_paid=True,
            ),
        )
        print(f"Stripe webhook: booking {booking_id} confirmed successfully")

        # Send confirmation email to the attendee
        try:
            from app.services.email import email_service
            from app.services.email_templates import booking_confirmation_email

            user = booking.user
            event = booking.event
            if user and event:
                event_date_str = event.start_date.strftime("%b %d, %Y at %I:%M %p") if event.start_date else "TBD"
                event_location = f"{event.city}, {event.country}"
                html = booking_confirmation_email(
                    attendee_name=user.full_name,
                    event_title=event.title,
                    event_date=event_date_str,
                    event_location=event_location,
                    quantity=booking.quantity,
                    total_price=booking.total_price,
                    currency=booking.currency,
                    booking_reference=booking.booking_reference,
                    is_paid=True,
                    payment_method=booking.payment_method or "stripe_checkout",
                ).replace("{{dashboard_url}}", f"{email_service.get_frontend_url()}/dashboard")
                await email_service.send_email(
                    to_email=user.email,
                    subject=f"Payment Confirmed: {event.title} 🎉",
                    html_content=html,
                )
        except Exception as e:
            print(f"Stripe webhook: failed to send email: {e}")

    except Exception as e:
        print(f"Stripe webhook error: {e}")
    finally:
        db.close()


async def _handle_checkout_expired(session: dict) -> None:
    """Handle an expired checkout session - cancel the booking."""
    from app.database import SessionLocal

    metadata = session.get("metadata", {})
    booking_id = metadata.get("booking_id")

    if not booking_id:
        return

    db = SessionLocal()
    try:
        booking = crud_booking.get(db, booking_id)
        if booking and booking.status == BookingStatus.PENDING:
            crud_booking.cancel(db, booking_id=booking_id, refund=False)
            print(f"Stripe webhook: booking {booking_id} cancelled (session expired)")
    except Exception as e:
        print(f"Stripe webhook error: {e}")
    finally:
        db.close()


async def _handle_checkout_failed(session: dict) -> None:
    """Handle a failed payment - mark the booking appropriately."""
    from app.database import SessionLocal

    metadata = session.get("metadata", {})
    booking_id = metadata.get("booking_id")

    if not booking_id:
        return

    db = SessionLocal()
    try:
        booking = crud_booking.get(db, booking_id)
        if booking and booking.status == BookingStatus.PENDING:
            crud_booking.cancel(db, booking_id=booking_id, refund=False)
            print(f"Stripe webhook: booking {booking_id} cancelled (payment failed)")
    except Exception as e:
        print(f"Stripe webhook error: {e}")
    finally:
        db.close()



