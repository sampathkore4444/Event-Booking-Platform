"""
Email notification service for the Event Booking Platform.
Supports SMTP (with STARTTLS) and logs to console in development.
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Handles sending transactional emails for bookings and payments."""

    def __init__(self):
        self._smtp_available = None  # Lazy check

    def _check_smtp_configured(self) -> bool:
        """Check if SMTP credentials are configured."""
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        to_name: Optional[str] = None,
    ) -> bool:
        """
        Send an HTML email.

        Falls back to logging the email content if SMTP is not configured
        (useful for development).
        """
        if not self._check_smtp_configured():
            logger.info(
                f"📧 [EMAIL] To: {to_email} | Subject: {subject}\n"
                f"SMTP not configured. Email content logged below:\n"
                f"{html_content[:500]}..."
            )
            return False

        try:
            await self._send_via_smtp(to_email, subject, html_content)
            logger.info(f"✅ Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}")
            return False

    async def _send_via_smtp(
        self, to_email: str, subject: str, html_content: str
    ) -> None:
        """Send email via SMTP with STARTTLS."""
        import aiosmtplib

        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        part = MIMEText(html_content, "html")
        msg.attach(part)

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )

    def get_frontend_url(self) -> str:
        """Get the base frontend URL from CORS origins."""
        origins = settings.CORS_ORIGINS
        if origins:
            return origins[0].rstrip("/")
        return "http://localhost:5173"


# Singleton instance
email_service = EmailService()
