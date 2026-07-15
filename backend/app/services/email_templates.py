"""
HTML email templates for the Event Booking Platform.
All templates use inline styles for maximum email client compatibility.
"""

from typing import Optional


def _base_template(title: str, body_html: str) -> str:
    """Wrap content in a base email template."""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🎫 EventHub</h1>
                            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{title}</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="background-color:#ffffff;padding:40px;border-radius:0 0 12px 12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                            {body_html}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 40px;text-align:center;">
                            <p style="margin:0;color:#a1a1aa;font-size:12px;">
                                EventHub &bull; Event Booking Platform<br>
                                This is an automated message. Please do not reply directly.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def booking_confirmation_email(
    attendee_name: str,
    event_title: str,
    event_date: str,
    event_location: str,
    quantity: int,
    total_price: float,
    currency: str,
    booking_reference: str,
    is_paid: bool = True,
    payment_method: Optional[str] = None,
) -> str:
    """Email sent when a booking is confirmed (free event or payment completed)."""
    payment_status = "✅ Paid" if is_paid else "⏳ Payment Pending"
    method_display = ""
    if payment_method == "stripe_upi":
        method_display = "<span style='display:inline-block;background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:4px;font-size:12px;'>UPI</span>"
    elif payment_method == "stripe_checkout":
        method_display = "<span style='display:inline-block;background:#f3e8ff;color:#7c3aed;padding:2px 8px;border-radius:4px;font-size:12px;'>Card</span>"
    elif payment_method == "cambodia_qr":
        method_display = "<span style='display:inline-block;background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;font-size:12px;'>Bakong QR</span>"

    body = f"""
    <p style="margin:0 0 24px;color:#18181b;font-size:16px;line-height:1.6;">
        Hi <strong>{attendee_name}</strong>, your booking has been confirmed! 🎉
    </p>

    <table width="100%" cellpadding="12" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:24px;">
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">EVENT</span><br>
                <span style="color:#18181b;font-size:15px;font-weight:600;">{event_title}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">DATE &amp; LOCATION</span><br>
                <span style="color:#18181b;font-size:14px;">{event_date} &bull; {event_location}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">TICKETS</span><br>
                <span style="color:#18181b;font-size:14px;">{quantity} ticket(s)</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">TOTAL</span><br>
                <span style="color:#18181b;font-size:16px;font-weight:700;">{currency} {total_price:.2f}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">PAYMENT</span><br>
                <span style="color:#059669;font-size:14px;font-weight:600;">{payment_status}</span>
                {f' {method_display}' if payment_method else ''}
            </td>
        </tr>
        <tr>
            <td>
                <span style="color:#71717a;font-size:12px;">REFERENCE</span><br>
                <span style="color:#18181b;font-size:14px;font-family:monospace;font-weight:600;">{booking_reference}</span>
            </td>
        </tr>
    </table>

    <div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
            📌 <strong>Important:</strong> Please arrive at least 15 minutes before the event starts.
            Keep your booking reference handy for check-in.
        </p>
    </div>

    <p style="margin:0;color:#71717a;font-size:13px;text-align:center;">
        Need to make changes? <a href="{{dashboard_url}}" style="color:#4F46E5;text-decoration:underline;">View your bookings</a>
    </p>
    """
    return _base_template("Booking Confirmed ✅", body)


def organizer_qr_notification_email(
    organizer_name: str,
    attendee_name: str,
    attendee_email: str,
    event_title: str,
    quantity: int,
    total_price: float,
    currency: str,
    booking_reference: str,
) -> str:
    """Email sent to the organizer when a QR payment is pending confirmation."""
    body = f"""
    <p style="margin:0 0 24px;color:#18181b;font-size:16px;line-height:1.6;">
        Hi <strong>{organizer_name}</strong>, a new QR code payment requires your attention.
    </p>

    <table width="100%" cellpadding="12" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:24px;">
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">ATTENDEE</span><br>
                <span style="color:#18181b;font-size:15px;font-weight:600;">{attendee_name}</span>
                <span style="color:#71717a;font-size:13px;"> &bull; {attendee_email}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">EVENT</span><br>
                <span style="color:#18181b;font-size:15px;font-weight:600;">{event_title}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">TICKETS</span><br>
                <span style="color:#18181b;font-size:14px;">{quantity} ticket(s)</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">AMOUNT</span><br>
                <span style="color:#18181b;font-size:16px;font-weight:700;">{currency} {total_price:.2f}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span style="color:#71717a;font-size:12px;">REFERENCE</span><br>
                <span style="color:#18181b;font-size:14px;font-family:monospace;font-weight:600;">{booking_reference}</span>
            </td>
        </tr>
    </table>

    <div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
            ⏳ <strong>Action required:</strong> Please verify the payment and confirm or reject
            this booking from your organizer dashboard.
        </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <a href="{{dashboard_url}}"
                   style="display:inline-block;background-color:#4F46E5;color:#ffffff;text-decoration:none;
                          padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                    Go to Dashboard
                </a>
            </td>
        </tr>
    </table>
    """
    return _base_template("New QR Payment Pending ⏳", body)


def qr_payment_confirmed_email(
    attendee_name: str,
    event_title: str,
    event_date: str,
    event_location: str,
    quantity: int,
    total_price: float,
    currency: str,
    booking_reference: str,
) -> str:
    """Email sent to the attendee when the organizer confirms their QR payment."""
    body = f"""
    <p style="margin:0 0 24px;color:#18181b;font-size:16px;line-height:1.6;">
        Hi <strong>{attendee_name}</strong>, your QR payment has been confirmed! 🎉
    </p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <span style="font-size:40px;">✅</span>
        <h2 style="margin:8px 0 0;color:#15803d;font-size:18px;">Payment Confirmed</h2>
        <p style="margin:4px 0 0;color:#166534;font-size:14px;">
            Your payment of {currency} {total_price:.2f} for {quantity} ticket(s) has been verified.
        </p>
    </div>

    <table width="100%" cellpadding="12" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:24px;">
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">EVENT</span><br>
                <span style="color:#18181b;font-size:15px;font-weight:600;">{event_title}</span>
            </td>
        </tr>
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <span style="color:#71717a;font-size:12px;">DATE &amp; LOCATION</span><br>
                <span style="color:#18181b;font-size:14px;">{event_date} &bull; {event_location}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span style="color:#71717a;font-size:12px;">REFERENCE</span><br>
                <span style="color:#18181b;font-size:14px;font-family:monospace;font-weight:600;">{booking_reference}</span>
            </td>
        </tr>
    </table>
    """
    return _base_template("Payment Confirmed ✅", body)


def qr_payment_rejected_email(
    attendee_name: str,
    event_title: str,
    booking_reference: str,
    reason: str = "The organizer could not verify your payment.",
) -> str:
    """Email sent to the attendee when the organizer rejects their QR payment."""
    body = f"""
    <p style="margin:0 0 24px;color:#18181b;font-size:16px;line-height:1.6;">
        Hi <strong>{attendee_name}</strong>, your QR payment for <strong>{event_title}</strong>
        could not be verified.
    </p>

    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <span style="font-size:40px;">❌</span>
        <h2 style="margin:8px 0 0;color:#dc2626;font-size:18px;">Payment Rejected</h2>
        <p style="margin:4px 0 0;color:#991b1b;font-size:14px;">
            {reason}
        </p>
    </div>

    <p style="margin:0 0 8px;color:#18181b;font-size:14px;line-height:1.6;">
        Your tickets have been returned to the event pool. Your booking (<strong>{booking_reference}</strong>)
        has been cancelled.
    </p>

    <p style="margin:0;color:#71717a;font-size:13px;">
        If you believe this was a mistake, please contact the event organizer directly.
    </p>
    """
    return _base_template("Payment Rejected ❌", body)


def booking_cancelled_email(
    attendee_name: str,
    event_title: str,
    booking_reference: str,
    is_refund: bool = False,
) -> str:
    """Email sent when a booking is cancelled."""
    refund_text = ""
    if is_refund:
        refund_text = """
        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">
                💰 Your payment has been refunded. It may take 5-10 business days to appear in your account.
            </p>
        </div>
        """

    body = f"""
    <p style="margin:0 0 24px;color:#18181b;font-size:16px;line-height:1.6;">
        Hi <strong>{attendee_name}</strong>, your booking for <strong>{event_title}</strong>
        has been cancelled.
    </p>

    {refund_text}

    <table width="100%" cellpadding="12" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:24px;">
        <tr>
            <td>
                <span style="color:#71717a;font-size:12px;">REFERENCE</span><br>
                <span style="color:#18181b;font-size:14px;font-family:monospace;font-weight:600;">{booking_reference}</span>
            </td>
        </tr>
    </table>

    <p style="margin:0;color:#71717a;font-size:13px;">
        Want to book again? <a href="{{explore_url}}" style="color:#4F46E5;text-decoration:underline;">Browse events</a>
    </p>
    """
    return _base_template("Booking Cancelled", body)
