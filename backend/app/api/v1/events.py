from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Any, Optional, List

from app.database import get_db
from app.core.deps import (
    get_current_user,
    get_optional_user,
    require_admin,
)
from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.event import crud_event
from app.crud.booking import crud_booking
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
)
from app.models.event import EventStatus
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/events", response_model=EventListResponse)
async def list_events(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=50),
    status: Optional[EventStatus] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    city: Optional[str] = None,
    is_free: Optional[bool] = None,
    is_virtual: Optional[bool] = None,
    upcoming: bool = Query(True),
    sort_by: str = Query("start_date"),
    sort_desc: bool = Query(False),
) -> Any:
    """List published events with filters."""
    events = crud_event.get_multi(
        db,
        skip=skip,
        limit=limit,
        status=status,
        category_id=category_id,
        search=search,
        city=city,
        is_free=is_free,
        is_virtual=is_virtual,
        upcoming=upcoming,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )
    total = crud_event.count(
        db,
        status=status or EventStatus.PUBLISHED,
        category_id=category_id,
        search=search,
    )
    total_pages = max(1, (total + limit - 1) // limit)

    return EventListResponse(
        events=events,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit,
        total_pages=total_pages,
    )


@router.get("/events/featured", response_model=List[EventResponse])
async def get_featured_events(
    db: Session = Depends(get_db),
    limit: int = Query(6, ge=1, le=20),
) -> Any:
    """Get featured events."""
    events = crud_event.get_featured(db, limit=limit)
    return events


@router.get("/events/upcoming", response_model=List[EventResponse])
async def get_upcoming_events(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
) -> Any:
    """Get upcoming events."""
    events = crud_event.get_upcoming(db, limit=limit)
    return events


@router.get("/events/my", response_model=List[EventResponse])
async def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get events created by the current user (organizer)."""
    events = crud_event.get_multi(
        db,
        organizer_id=current_user.id,
        skip_status_filter=True,
    )
    return events


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Any:
    """Get event by ID."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)
    if (
        event.status != EventStatus.PUBLISHED
        and (not current_user or current_user.id != event.organizer_id)
        and (not current_user or current_user.role != UserRole.ADMIN)
    ):
        raise NotFoundException("Event", event_id)
    return event


@router.get("/events/slug/{slug}", response_model=EventResponse)
async def get_event_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Any:
    """Get event by slug."""
    event = crud_event.get_by_slug(db, slug)
    if not event:
        raise NotFoundException("Event", slug)
    if (
        event.status != EventStatus.PUBLISHED
        and (not current_user or current_user.id != event.organizer_id)
        and (not current_user or current_user.role != UserRole.ADMIN)
    ):
        raise NotFoundException("Event", slug)
    return event


@router.post(
    "/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    *,
    db: Session = Depends(get_db),
    obj_in: EventCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new event. Any authenticated user can become an organizer."""
    event = crud_event.create(
        db, obj_in=obj_in, organizer_id=current_user.id
    )
    return event


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    *,
    db: Session = Depends(get_db),
    obj_in: EventUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update an event."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)
    if (
        current_user.role != UserRole.ADMIN
        and event.organizer_id != current_user.id
    ):
        raise ForbiddenException("Cannot edit this event")
    event = crud_event.update(db, db_obj=event, obj_in=obj_in)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an event."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)
    if (
        current_user.role != UserRole.ADMIN
        and event.organizer_id != current_user.id
    ):
        raise ForbiddenException("Cannot delete this event")
    crud_event.remove(db, event_id=event_id)


@router.put("/events/{event_id}/status", response_model=EventResponse)
async def update_event_status(
    event_id: str,
    *,
    db: Session = Depends(get_db),
    status: EventStatus,
    current_user: User = Depends(require_admin),
) -> Any:
    """Update event status (admin only)."""
    event = crud_event.update_status(db, event_id=event_id, status=status)
    return event


@router.post("/events/{event_id}/publish", response_model=EventResponse)
async def publish_event(
    event_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Publish an event."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)
    if (
        current_user.role != UserRole.ADMIN
        and event.organizer_id != current_user.id
    ):
        raise ForbiddenException("Cannot publish this event")
    event = crud_event.update_status(
        db, event_id=event_id, status=EventStatus.PUBLISHED
    )
    return event


@router.post("/events/{event_id}/feature", response_model=EventResponse)
async def toggle_featured_event(
    event_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Toggle featured status (admin only)."""
    event = crud_event.toggle_featured(db, event_id=event_id)
    return event


@router.get(
    "/events/{event_id}/bookings",
)
async def get_event_bookings(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get bookings for an event (organizer/admin only)."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)
    if (
        current_user.role != UserRole.ADMIN
        and event.organizer_id != current_user.id
    ):
        raise ForbiddenException("Cannot view bookings for this event")

    bookings = crud_booking.get_multi(db, event_id=event_id)
    from app.schemas.booking import BookingResponse
    from app.crud.user import crud_user

    booking_responses = []
    for booking in bookings:
        booking_response = BookingResponse.model_validate(booking)
        booking_responses.append(booking_response)

    return {
        "bookings": booking_responses,
        "total": len(booking_responses),
    }
