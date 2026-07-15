import re
import uuid
import secrets
import string
from datetime import datetime
from typing import Optional


def generate_slug(text: str) -> str:
    """Generate a URL-friendly slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    slug = slug.strip("-")
    return slug


def generate_unique_slug(text: str, existing_slugs: set) -> str:
    """Generate a unique slug by appending a short ID if needed."""
    base_slug = generate_slug(text)
    slug = base_slug
    counter = 1
    while slug in existing_slugs:
        suffix = secrets.token_hex(3)
        slug = f"{base_slug}-{suffix}"
        counter += 1
    return slug


def generate_booking_reference() -> str:
    """Generate a unique booking reference code."""
    prefix = "BK"
    timestamp = datetime.utcnow().strftime("%y%m%d")
    random_part = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"{prefix}-{timestamp}-{random_part}"


def validate_date_range(start_date: datetime, end_date: datetime) -> bool:
    """Validate that start date is before end date."""
    return start_date < end_date


def calculate_total_price(unit_price: float, quantity: int) -> float:
    """Calculate total price with proper rounding."""
    return round(unit_price * quantity, 2)


def truncate_text(text: str, max_length: int = 200) -> str:
    """Truncate text to a maximum length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


def generate_check_in_code() -> str:
    """Generate a unique check-in code for ticket QR verification."""
    return secrets.token_hex(16)


def verify_check_in_code(stored_code: str, provided_code: str) -> bool:
    """Constant-time comparison to prevent timing attacks on check-in codes."""
    return secrets.compare_digest(stored_code, provided_code)
