"""
Multi-channel notification service.
Sends booking notifications via WhatsApp (Twilio) and Telegram bot
alongside the existing email service.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


class NotificationService:
    """Sends notifications via WhatsApp (Twilio) and Telegram."""

    def __init__(self):
        self._twilio_available = None
        self._telegram_available = None

    def is_whatsapp_configured(self) -> bool:
        """Check if Twilio WhatsApp credentials are set."""
        try:
            from app.config import settings
            return bool(
                hasattr(settings, 'TWILIO_ACCOUNT_SID') and settings.TWILIO_ACCOUNT_SID
                and hasattr(settings, 'TWILIO_AUTH_TOKEN') and settings.TWILIO_AUTH_TOKEN
                and hasattr(settings, 'TWILIO_WHATSAPP_FROM') and settings.TWILIO_WHATSAPP_FROM
            )
        except Exception:
            return False

    def is_telegram_configured(self) -> bool:
        """Check if Telegram bot token is set."""
        try:
            from app.config import settings
            return bool(
                hasattr(settings, 'TELEGRAM_BOT_TOKEN') and settings.TELEGRAM_BOT_TOKEN
            )
        except Exception:
            return False

    async def send_whatsapp(self, to_number: str, message: str) -> bool:
        """Send a WhatsApp message via Twilio."""
        if not self.is_whatsapp_configured():
            print(f"📱 [WHATSAPP] To: {to_number} | {message[:100]}... (not configured)")
            return False
        try:
            from twilio.rest import Client
            from app.config import settings
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message,
                from_=f'whatsapp:{settings.TWILIO_WHATSAPP_FROM}',
                to=f'whatsapp:{to_number}',
            )
            print(f"✅ WhatsApp sent to {to_number}")
            return True
        except Exception as e:
            print(f"❌ WhatsApp failed: {e}")
            return False

    async def send_telegram(self, chat_id: str, message: str) -> bool:
        """Send a Telegram message via bot."""
        if not self.is_telegram_configured():
            print(f"📱 [TELEGRAM] To: {chat_id} | {message[:100]}... (not configured)")
            return False
        try:
            import httpx
            from app.config import settings
            url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                })
                if resp.status_code == 200:
                    print(f"✅ Telegram sent to {chat_id}")
                    return True
                print(f"❌ Telegram API error: {resp.text}")
                return False
        except Exception as e:
            print(f"❌ Telegram failed: {e}")
            return False

    async def send_booking_confirmation(
        self, phone: str | None, telegram_id: str | None,
        attendee_name: str, event_title: str, booking_ref: str,
    ) -> None:
        """Send booking confirmation via configured channels."""
        message = (
            f"🎫 <b>Booking Confirmed!</b>\n\n"
            f"Hi {attendee_name},\n"
            f"Your booking for <b>{event_title}</b> is confirmed.\n"
            f"Reference: <code>{booking_ref}</code>\n\n"
            f"Thank you for using EventHub!"
        )

        if phone:
            plain_msg = message.replace("<b>", "").replace("</b>", "").replace("<code>", "").replace("</code>", "")
            await self.send_whatsapp(phone, plain_msg)
        if telegram_id:
            await self.send_telegram(telegram_id, message)


notification_service = NotificationService()


@router.get("/notifications/channels")
async def get_available_channels(current_user: User = Depends(get_current_user)) -> Any:
    """Check which notification channels are available/configured."""
    return {
        "email": True,  # Always available (console fallback)
        "whatsapp": notification_service.is_whatsapp_configured(),
        "telegram": notification_service.is_telegram_configured(),
        "user_phone": bool(current_user.phone),
        "user_telegram_id": False,  # Would come from user profile settings
    }


@router.post("/notifications/test-whatsapp")
async def test_whatsapp(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Send a test WhatsApp message to the current user's phone."""
    if not current_user.phone:
        return {"status": "error", "message": "No phone number on profile"}
    success = await notification_service.send_whatsapp(
        current_user.phone,
        "🔔 Test message from EventHub!\n\nYour WhatsApp notifications are working.",
    )
    return {"status": "sent" if success else "not_configured"}


@router.post("/notifications/test-telegram")
async def test_telegram(
    chat_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Send a test Telegram message (requires chat_id)."""
    success = await notification_service.send_telegram(
        chat_id,
        "🔔 <b>Test message from EventHub!</b>\n\nYour Telegram notifications are working.",
    )
    return {"status": "sent" if success else "not_configured"}
