"""
Stripe payment integration service.
Handles creating Checkout Sessions, UPI for India, and QR code for Cambodia.
"""
import stripe
from typing import Optional, List
from app.config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


def get_payment_methods(country: str) -> List[str]:
    """
    Return the appropriate Stripe payment method types based on the event's country.
    - India: card + UPI (Unified Payments Interface)
    - All others: card only (Stripe Checkout handles local methods automatically)
    """
    country_upper = country.upper().strip()
    if country_upper == "INDIA" or country_upper == "IN":
        return ["card", "upi"]
    return ["card"]


def create_checkout_session(
    *,
    booking_id: str,
    booking_reference: str,
    amount_cents: int,
    currency: str = "usd",
    event_title: str,
    quantity: int,
    customer_email: str,
    success_url: str,
    cancel_url: str,
    country: str = "",
) -> dict:
    """
    Create a Stripe Checkout Session for a booking.
    Automatically enables UPI for Indian events.
    Returns the session object with the URL to redirect the user to.
    """
    payment_methods = get_payment_methods(country)

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=payment_methods,
        line_items=[
            {
                "price_data": {
                    "currency": currency.lower(),
                    "product_data": {
                        "name": event_title,
                        "description": f"{quantity} ticket(s)",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": quantity,
            }
        ],
        metadata={
            "booking_id": booking_id,
            "booking_reference": booking_reference,
            "country": country,
        },
        customer_email=customer_email,
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return {
        "session_id": session.id,
        "url": session.url,
        "payment_intent": session.get("payment_intent"),
        "payment_methods": payment_methods,
    }


def construct_webhook_event(payload: bytes, sig_header: str) -> Optional[dict]:
    """
    Construct and verify a Stripe webhook event from the raw payload.
    Returns the event dict if valid, None otherwise.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        # Invalid payload or signature
        print(f"Stripe webhook verification failed: {e}")
        return None


def create_refund(payment_intent_id: str, amount_cents: Optional[int] = None) -> dict:
    """
    Create a refund for a payment intent.
    If amount_cents is None, the full amount is refunded.
    """
    refund_params = {"payment_intent": payment_intent_id}
    if amount_cents is not None:
        refund_params["amount"] = amount_cents

    refund = stripe.Refund.create(**refund_params)
    return {"refund_id": refund.id, "status": refund.status}


def format_amount_for_stripe(amount: float) -> int:
    """Convert a dollar amount to cents for Stripe."""
    return int(round(amount * 100))
