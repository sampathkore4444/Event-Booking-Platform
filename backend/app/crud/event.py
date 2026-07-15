from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from datetime import datetime
from app.models.event import Event, EventStatus
from app.models.category import Category
from app.schemas.event import EventCreate, EventUpdate
from app.core.exceptions import NotFoundException, DuplicateException, BookingException
from app.utils.helpers import generate_unique_slug


class CRUDEvent:
    """CRUD operations for Event model."""

    def get(self, db: Session, event_id: str) -> Optional[Event]:
        return db.query(Event).filter(Event.id == event_id).first()

    def get_by_slug(self, db: Session, slug: str) -> Optional[Event]:
        return db.query(Event).filter(Event.slug == slug).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        status: Optional[EventStatus] = None,
        category_id: Optional[str] = None,
        organizer_id: Optional[str] = None,
        search: Optional[str] = None,
        city: Optional[str] = None,
        is_featured: Optional[bool] = None,
        is_virtual: Optional[bool] = None,
        is_free: Optional[bool] = None,
        upcoming: bool = False,
        sort_by: str = "created_at",
        sort_desc: bool = True,
        skip_status_filter: bool = False,
    ) -> List[Event]:
        query = db.query(Event)

        # Filters
        if skip_status_filter:
            pass  # Don't filter by status at all
        elif status:
            query = query.filter(Event.status == status)
        else:
            query = query.filter(Event.status == EventStatus.PUBLISHED)

        if category_id:
            query = query.filter(Event.category_id == category_id)
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
        if search:
            query = query.filter(
                or_(
                    Event.title.ilike(f"%{search}%"),
                    Event.description.ilike(f"%{search}%"),
                    Event.venue.ilike(f"%{search}%"),
                    Event.city.ilike(f"%{search}%"),
                    Event.short_description.ilike(f"%{search}%"),
                )
            )
        if city:
            query = query.filter(Event.city.ilike(f"%{city}%"))
        if is_featured is not None:
            query = query.filter(Event.is_featured == is_featured)
        if is_virtual is not None:
            query = query.filter(Event.is_virtual == is_virtual)
        if is_free:
            query = query.filter(Event.price == 0.0)
        if upcoming:
            now = datetime.utcnow()
            query = query.filter(Event.start_date >= now)

        # Sorting
        sort_column = getattr(Event, sort_by, Event.created_at)
        if sort_desc:
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        return query.offset(skip).limit(limit).all()

    def count(
        self,
        db: Session,
        *,
        status: Optional[EventStatus] = None,
        category_id: Optional[str] = None,
        organizer_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        query = db.query(Event)
        if status:
            query = query.filter(Event.status == status)
        if category_id:
            query = query.filter(Event.category_id == category_id)
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
        if search:
            query = query.filter(Event.title.ilike(f"%{search}%"))
        return query.count()

    def create(
        self, db: Session, *, obj_in: EventCreate, organizer_id: str
    ) -> Event:
        # Check for duplicate slug
        existing = self.get_by_slug(db, obj_in.slug)
        if existing:
            obj_in.slug = generate_unique_slug(
                obj_in.title,
                set(
                    slug
                    for (slug,) in db.query(Event.slug).all()
                ),
            )

        # Convert empty strings to None for nullable fields
        data = obj_in.model_dump()
        for nullable_field in ['category_id', 'address', 'short_description', 'virtual_link', 'banner_url', 'thumbnail_url']:
            if nullable_field in data and data[nullable_field] == '':
                data[nullable_field] = None

        db_obj = Event(
            **data,
            organizer_id=organizer_id,
            available_tickets=obj_in.total_capacity,
            status=EventStatus.PUBLISHED,
            is_approved=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Event, obj_in: EventUpdate
    ) -> Event:
        update_data = obj_in.model_dump(exclude_unset=True)

        # If capacity is updated, adjust available_tickets
        if "total_capacity" in update_data:
            old_capacity = db_obj.total_capacity
            new_capacity = update_data["total_capacity"]
            booked_count = db_obj.total_capacity - db_obj.available_tickets
            if new_capacity < booked_count:
                raise BookingException(
                    f"Cannot reduce capacity to {new_capacity}. "
                    f"{booked_count} tickets are already booked."
                )
            capacity_diff = new_capacity - old_capacity
            db_obj.available_tickets = max(
                0, db_obj.available_tickets + capacity_diff
            )

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, event_id: str) -> Event:
        db_obj = self.get(db, event_id)
        if not db_obj:
            raise NotFoundException("Event", event_id)
        db.delete(db_obj)
        db.commit()
        return db_obj

    def update_status(
        self, db: Session, *, event_id: str, status: EventStatus
    ) -> Event:
        db_obj = self.get(db, event_id)
        if not db_obj:
            raise NotFoundException("Event", event_id)
        db_obj.status = status
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def toggle_featured(
        self, db: Session, *, event_id: str
    ) -> Event:
        db_obj = self.get(db, event_id)
        if not db_obj:
            raise NotFoundException("Event", event_id)
        db_obj.is_featured = not db_obj.is_featured
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_upcoming(
        self, db: Session, *, limit: int = 10
    ) -> List[Event]:
        now = datetime.utcnow()
        return (
            db.query(Event)
            .filter(
                Event.status == EventStatus.PUBLISHED,
                Event.start_date >= now,
            )
            .order_by(Event.start_date.asc())
            .limit(limit)
            .all()
        )

    def get_featured(
        self, db: Session, *, limit: int = 6
    ) -> List[Event]:
        now = datetime.utcnow()
        return (
            db.query(Event)
            .filter(
                Event.status == EventStatus.PUBLISHED,
                Event.is_featured == True,
                Event.start_date >= now,
            )
            .order_by(Event.start_date.asc())
            .limit(limit)
            .all()
        )


crud_event = CRUDEvent()
