from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class CRUDReview:
    def get(self, db: Session, review_id: str) -> Optional[Review]:
        return db.query(Review).filter(Review.id == review_id).first()

    def get_by_user_event(self, db: Session, user_id: str, event_id: str) -> Optional[Review]:
        return db.query(Review).filter(
            Review.user_id == user_id, Review.event_id == event_id
        ).first()

    def get_multi(
        self, db: Session, *, event_id: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> List[Review]:
        query = db.query(Review)
        if event_id:
            query = query.filter(Review.event_id == event_id)
        return query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: ReviewCreate, user_id: str) -> Review:
        # Check for duplicate review
        existing = self.get_by_user_event(db, user_id, obj_in.event_id)
        if existing:
            raise BadRequestException("You have already reviewed this event")
        db_obj = Review(
            user_id=user_id,
            event_id=obj_in.event_id,
            rating=obj_in.rating,
            comment=obj_in.comment,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Review, obj_in: ReviewUpdate) -> Review:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, review_id: str) -> None:
        review = self.get(db, review_id)
        if not review:
            raise NotFoundException("Review", review_id)
        db.delete(review)
        db.commit()

    def get_stats(self, db: Session, event_id: str) -> Dict:
        """Get review stats for an event."""
        stats = db.query(
            func.count(Review.id).label("total"),
            func.avg(Review.rating).label("average"),
            func.count(Review.id).filter(Review.rating == 1).label("r1"),
            func.count(Review.id).filter(Review.rating == 2).label("r2"),
            func.count(Review.id).filter(Review.rating == 3).label("r3"),
            func.count(Review.id).filter(Review.rating == 4).label("r4"),
            func.count(Review.id).filter(Review.rating == 5).label("r5"),
        ).filter(Review.event_id == event_id).first()

        total = stats.total or 0
        return {
            "total": total,
            "average_rating": round(float(stats.average or 0), 1),
            "distribution": {
                "1": stats.r1 or 0, "2": stats.r2 or 0,
                "3": stats.r3 or 0, "4": stats.r4 or 0,
                "5": stats.r5 or 0,
            },
        }


crud_review = CRUDReview()
