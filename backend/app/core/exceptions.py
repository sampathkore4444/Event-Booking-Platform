from fastapi import HTTPException, status
from typing import Any, Optional, Dict


class AppException(HTTPException):
    """Base application exception."""

    def __init__(
        self,
        status_code: int,
        detail: Any = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(AppException):
    """Resource not found exception."""

    def __init__(self, resource: str = "Resource", identifier: str = ""):
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} '{identifier}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class DuplicateException(AppException):
    """Duplicate resource exception."""

    def __init__(self, resource: str = "Resource", field: str = ""):
        detail = f"{resource} already exists"
        if field:
            detail = f"{resource} with this {field} already exists"
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class UnauthorizedException(AppException):
    """Unauthorized access exception."""

    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    """Forbidden access exception."""

    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(AppException):
    """Bad request exception."""

    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ValidationException(AppException):
    """Validation exception."""

    def __init__(self, detail: Any = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class BookingException(AppException):
    """Booking-specific exception."""

    def __init__(self, detail: str = "Booking error"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
