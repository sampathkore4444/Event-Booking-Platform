from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from typing import Any
from datetime import datetime, timedelta

from app.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.booking import Booking, BookingStatus
from app.models.event import Event, EventStatus
from app.models.user import User, UserRole
from app.crud.event import crud_event

router = APIRouter()


@router.get("/analytics/overview")
async def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """Get analytics overview for the current user's events."""
    since = datetime.utcnow() - timedelta(days=days)

    # Base query filters
    if current_user.role == UserRole.ADMIN:
        events_query = db.query(Event)
        bookings_query = db.query(Booking)
    else:
        events_query = db.query(Event).filter(Event.organizer_id == current_user.id)
        bookings_query = db.query(Booking).join(Event).filter(
            Event.organizer_id == current_user.id
        )

    # Total stats
    total_events = events_query.count()
    total_bookings = bookings_query.filter(Booking.created_at >= since).count()
    total_revenue = (
        bookings_query.filter(
            Booking.created_at >= since,
            Booking.is_paid == True,
            Booking.status != BookingStatus.CANCELLED,
            Booking.status != BookingStatus.REFUNDED,
        )
        .with_entities(func.sum(Booking.total_price))
        .scalar() or 0
    )

    # Ticket sales over time (last 7 days)
    last_7 = datetime.utcnow() - timedelta(days=7)
    sales_daily = []
    for i in range(7):
        day = last_7 + timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = bookings_query.filter(
            Booking.created_at >= day, Booking.created_at < next_day
        ).count()
        sales_daily.append({"date": day.strftime("%Y-%m-%d"), "bookings": count})

    # Events by status
    status_counts = {}
    for status in EventStatus:
        count = events_query.filter(Event.status == status).count()
        if count > 0:
            status_counts[status.value] = count

    # Top events by bookings
    top_events = (
        bookings_query
        .with_entities(
            Event.id, Event.title, Event.slug,
            func.count(Booking.id).label("booking_count"),
            func.sum(Booking.total_price).label("revenue"),
        )
        .join(Booking, Booking.event_id == Event.id)
        .filter(Booking.created_at >= since)
        .group_by(Event.id, Event.title, Event.slug)
        .order_by(desc("booking_count"))
        .limit(5)
        .all()
    )

    return {
        "period_days": days,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "total_revenue": round(float(total_revenue), 2),
        "average_bookings_per_day": round(total_bookings / max(days, 1), 1),
        "sales_daily": sales_daily,
        "events_by_status": status_counts,
        "top_events": [
            {
                "id": e.id, "title": e.title, "slug": e.slug,
                "booking_count": e.booking_count,
                "revenue": round(float(e.revenue or 0), 2),
            }
            for e in top_events
        ],
    }


@router.get("/analytics/event/{event_id}")
async def get_event_analytics(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed analytics for a specific event."""
    event = crud_event.get(db, event_id)
    if not event:
        raise NotFoundException("Event", event_id)

    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise ForbiddenException("Not your event")

    bookings = db.query(Booking).filter(Booking.event_id == event_id).all()
    total_bookings = len(bookings)
    confirmed = sum(1 for b in bookings if b.status == BookingStatus.CONFIRMED)
    pending = sum(1 for b in bookings if b.status == BookingStatus.PENDING)
    cancelled = sum(1 for b in bookings if b.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED])
    checked_in = sum(1 for b in bookings if b.checked_in_at is not None)
    revenue = sum(b.total_price for b in bookings if b.is_paid and b.status not in [BookingStatus.CANCELLED, BookingStatus.REFUNDED])

    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_bookings": total_bookings,
        "confirmed": confirmed,
        "pending": pending,
        "cancelled": cancelled,
        "checked_in": checked_in,
        "total_revenue": round(revenue, 2),
        "tickets_sold": sum(b.quantity for b in bookings if b.status == BookingStatus.CONFIRMED),
        "tickets_available": event.available_tickets,
        "total_capacity": event.total_capacity,
        "fill_rate": round((event.total_capacity - event.available_tickets) / max(event.total_capacity, 1) * 100, 1),
    }
