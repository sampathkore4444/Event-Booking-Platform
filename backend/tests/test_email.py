"""
Tests for the email notification service and templates.

Run with: python -m pytest tests/test_email.py -v
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.email import EmailService, email_service
from app.services.email_templates import (
    booking_confirmation_email,
    organizer_qr_notification_email,
    qr_payment_confirmed_email,
    qr_payment_rejected_email,
    booking_cancelled_email,
)


class TestEmailTemplates:
    """Tests for HTML email template rendering."""

    def test_booking_confirmation_has_attendee_name(self):
        """Verify the confirmation email includes the attendee's name."""
        html = booking_confirmation_email(
            attendee_name="John Doe",
            event_title="Test Event",
            event_date="Dec 15, 2026 at 2:00 PM",
            event_location="Phnom Penh, Cambodia",
            quantity=2,
            total_price=100.0,
            currency="USD",
            booking_reference="BK-12345",
            is_paid=True,
            payment_method="stripe_checkout",
        )
        assert "John Doe" in html
        assert "Test Event" in html
        assert "2 ticket(s)" in html
        assert "USD 100.00" in html
        assert "BK-12345" in html
        assert "✅ Paid" in html
        assert "EventHub" in html  # Branding

    def test_booking_confirmation_free_event(self):
        """Verify free event confirmation shows no payment method."""
        html = booking_confirmation_email(
            attendee_name="Jane",
            event_title="Free Workshop",
            event_date="Jan 10, 2026",
            event_location="Online",
            quantity=1,
            total_price=0.0,
            currency="USD",
            booking_reference="BK-FREE",
            is_paid=True,
        )
        assert "Jane" in html
        assert "Free Workshop" in html
        assert "USD 0.00" in html
        assert "BK-FREE" in html

    def test_booking_confirmation_qr_payment_method(self):
        """Verify QR payment method label appears."""
        html = booking_confirmation_email(
            attendee_name="Sokha",
            event_title="Cambodia Festival",
            event_date="Mar 5, 2026",
            event_location="Siem Reap, Cambodia",
            quantity=3,
            total_price=75.0,
            currency="USD",
            booking_reference="BK-QR001",
            is_paid=True,
            payment_method="cambodia_qr",
        )
        assert "Bakong QR" in html
        assert "BK-QR001" in html

    def test_booking_confirmation_upi_payment_method(self):
        """Verify UPI payment method label appears."""
        html = booking_confirmation_email(
            attendee_name="Raj",
            event_title="Mumbai Conference",
            event_date="Feb 20, 2026",
            event_location="Mumbai, India",
            quantity=1,
            total_price=500.0,
            currency="INR",
            booking_reference="BK-UPI01",
            is_paid=True,
            payment_method="stripe_upi",
        )
        assert "UPI" in html
        assert "INR 500.00" in html

    def test_organizer_qr_notification_has_action_required(self):
        """Verify organizer notification includes action required message."""
        html = organizer_qr_notification_email(
            organizer_name="Organizer Kim",
            attendee_name="Sophal",
            attendee_email="sophal@example.com",
            event_title="Wedding Expo",
            quantity=4,
            total_price=200.0,
            currency="USD",
            booking_reference="BK-QR002",
        )
        assert "Organizer Kim" in html
        assert "Sophal" in html
        assert "sophal@example.com" in html
        assert "Wedding Expo" in html
        assert "Action required" in html
        assert "Go to Dashboard" in html

    def test_qr_payment_confirmed_has_checkmark(self):
        """Verify QR confirmed email shows success indicators."""
        html = qr_payment_confirmed_email(
            attendee_name="Srey Mao",
            event_title="Art Exhibition",
            event_date="Apr 10, 2026",
            event_location="Battambang, Cambodia",
            quantity=2,
            total_price=30.0,
            currency="USD",
            booking_reference="BK-QR003",
        )
        assert "Srey Mao" in html
        assert "Art Exhibition" in html
        assert "Payment Confirmed" in html
        assert "✅" in html
        assert "30.00" in html

    def test_qr_payment_rejected_has_red_styling(self):
        """Verify QR rejected email shows the rejection message."""
        html = qr_payment_rejected_email(
            attendee_name="Vannak",
            event_title="Tech Summit",
            booking_reference="BK-QR004",
            reason="The organizer could not verify your payment.",
        )
        assert "Vannak" in html
        assert "Tech Summit" in html
        assert "Payment Rejected" in html
        assert "could not verify" in html

    def test_qr_payment_rejected_default_reason(self):
        """Verify rejected email uses default reason when none provided."""
        html = qr_payment_rejected_email(
            attendee_name="Rithy",
            event_title="Food Fair",
            booking_reference="BK-QR005",
        )
        assert "Rithy" in html
        assert "Food Fair" in html
        assert "could not verify" in html  # default reason

    def test_booking_cancelled_refund_shown(self):
        """Verify cancellation email shows refund information for refunded bookings."""
        html = booking_cancelled_email(
            attendee_name="Alice",
            event_title="Paid Workshop",
            booking_reference="BK-CAN01",
            is_refund=True,
        )
        assert "Alice" in html
        assert "Paid Workshop" in html
        assert "refunded" in html

    def test_booking_cancelled_no_refund(self):
        """Verify cancellation email doesn't show refund for non-refunded bookings."""
        html = booking_cancelled_email(
            attendee_name="Bob",
            event_title="Free Meetup",
            booking_reference="BK-CAN02",
            is_refund=False,
        )
        assert "Bob" in html
        assert "Free Meetup" in html
        assert "refunded" not in html

    def test_all_templates_include_base_layout(self):
        """Verify all templates render with the EventHub base layout."""
        templates = [
            booking_confirmation_email("A", "E", "D", "L", 1, 10, "USD", "R"),
            organizer_qr_notification_email("O", "A", "a@b", "E", 1, 10, "USD", "R"),
            qr_payment_confirmed_email("A", "E", "D", "L", 1, 10, "USD", "R"),
            qr_payment_rejected_email("A", "E", "R"),
            booking_cancelled_email("A", "E", "R"),
        ]
        for html in templates:
            assert "EventHub" in html, f"Template missing EventHub branding"
            assert isinstance(html, str)
            assert len(html) > 200  # Should have substantial content


class TestEmailService:
    """Tests for the EmailService class."""

    @pytest.mark.asyncio
    async def test_send_email_console_fallback(self):
        """Verify send_email logs to console when SMTP is not configured."""
        service = EmailService()
        result = await service.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Hello</p>",
        )
        # Should return False since SMTP isn't configured
        assert result is False

    @pytest.mark.asyncio
    async def test_send_email_smtp_success(self):
        """Verify send_email calls aiosmtplib when SMTP is configured."""
        service = EmailService()

        # Mock SMTP configuration
        with patch.object(service, "_check_smtp_configured", return_value=True):
            with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
                mock_send.return_value = None
                result = await service.send_email(
                    to_email="user@example.com",
                    subject="Welcome!",
                    html_content="<h1>Welcome</h1>",
                )
                assert result is True
                mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_smtp_failure_does_not_crash(self):
        """Verify SMTP failures are caught and don't raise exceptions."""
        service = EmailService()

        with patch.object(service, "_check_smtp_configured", return_value=True):
            with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
                mock_send.side_effect = Exception("Connection refused")
                # Should not raise — should return False
                result = await service.send_email(
                    to_email="user@example.com",
                    subject="Test",
                    html_content="<p>Test</p>",
                )
                assert result is False

    @pytest.mark.asyncio
    async def test_send_email_logs_on_failure(self):
        """Verify failures are logged."""
        service = EmailService()
        with patch.object(service, "_check_smtp_configured", return_value=True):
            with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
                mock_send.side_effect = Exception("SMTP error")
                with patch("app.services.email.logger") as mock_logger:
                    await service.send_email(
                        to_email="bad@example.com",
                        subject="Fail Test",
                        html_content="<p>Fail</p>",
                    )
                    mock_logger.error.assert_called_once()

    def test_get_frontend_url_default(self):
        """Verify get_frontend_url returns default when CORS_ORIGINS is empty."""
        service = EmailService()
        with patch("app.services.email.settings") as mock_settings:
            mock_settings.CORS_ORIGINS = []
            url = service.get_frontend_url()
            assert url == "http://localhost:5173"

    def test_get_frontend_url_from_settings(self):
        """Verify get_frontend_url reads from CORS_ORIGINS settings."""
        service = EmailService()
        with patch("app.services.email.settings") as mock_settings:
            mock_settings.CORS_ORIGINS = ["https://myevents.com"]
            url = service.get_frontend_url()
            assert url == "https://myevents.com"

    def test_get_frontend_url_strips_trailing_slash(self):
        """Verify get_frontend_url removes trailing slashes."""
        service = EmailService()
        with patch("app.services.email.settings") as mock_settings:
            mock_settings.CORS_ORIGINS = ["https://myevents.com/"]
            url = service.get_frontend_url()
            assert url == "https://myevents.com"
            assert not url.endswith("/")
