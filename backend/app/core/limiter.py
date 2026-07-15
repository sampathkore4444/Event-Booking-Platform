"""
Rate limiter configuration for the Event Booking Platform.
Extracted to its own module to avoid circular imports between main.py and api routes.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

# Rate Limiter instance shared across the application
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)
