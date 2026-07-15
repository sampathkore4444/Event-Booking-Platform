from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.core.exceptions import NotFoundException, DuplicateException
from app.utils.helpers import generate_unique_slug


class CRUDCategory:
    """CRUD operations for Category model."""

    def get(self, db: Session, category_id: str) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()

    def get_by_slug(self, db: Session, slug: str) -> Optional[Category]:
        return db.query(Category).filter(Category.slug == slug).first()

    def get_by_name(self, db: Session, name: str) -> Optional[Category]:
        return db.query(Category).filter(Category.name == name).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Category]:
        return db.query(Category).offset(skip).limit(limit).all()

    def count(self, db: Session) -> int:
        return db.query(Category).count()

    def create(self, db: Session, *, obj_in: CategoryCreate) -> Category:
        # Check for duplicate name
        if self.get_by_name(db, obj_in.name):
            raise DuplicateException("Category", "name")
        # Check for duplicate slug
        if self.get_by_slug(db, obj_in.slug):
            obj_in.slug = generate_unique_slug(
                obj_in.name,
                set(slug for (slug,) in db.query(Category.slug).all()),
            )

        db_obj = Category(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Category, obj_in: CategoryUpdate
    ) -> Category:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, category_id: str) -> Category:
        db_obj = self.get(db, category_id)
        if not db_obj:
            raise NotFoundException("Category", category_id)
        db.delete(db_obj)
        db.commit()
        return db_obj


crud_category = CRUDCategory()
