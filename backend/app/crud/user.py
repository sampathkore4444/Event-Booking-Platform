from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.core.exceptions import NotFoundException, DuplicateException


class CRUDUser:
    """CRUD operations for User model."""

    def get(self, db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
        search: Optional[str] = None,
    ) -> List[User]:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                )
            )
        return query.offset(skip).limit(limit).all()

    def count(
        self,
        db: Session,
        *,
        role: Optional[UserRole] = None,
    ) -> int:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.count()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        # Check for duplicate email
        if self.get_by_email(db, obj_in.email):
            raise DuplicateException("User", "email")
        # Check for duplicate username
        if self.get_by_username(db, obj_in.username):
            raise DuplicateException("User", "username")

        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            full_name=obj_in.full_name,
            hashed_password=get_password_hash(obj_in.password),
            role=obj_in.role if obj_in.role else UserRole.ATTENDEE,
            phone=obj_in.phone,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, user_id: str) -> User:
        db_obj = self.get(db, user_id)
        if not db_obj:
            raise NotFoundException("User", user_id)
        db.delete(db_obj)
        db.commit()
        return db_obj

    def activate(self, db: Session, *, user_id: str) -> User:
        db_obj = self.get(db, user_id)
        if not db_obj:
            raise NotFoundException("User", user_id)
        db_obj.is_active = True
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def deactivate(self, db: Session, *, user_id: str) -> User:
        db_obj = self.get(db, user_id)
        if not db_obj:
            raise NotFoundException("User", user_id)
        db_obj.is_active = False
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def verify(self, db: Session, *, user_id: str) -> User:
        db_obj = self.get(db, user_id)
        if not db_obj:
            raise NotFoundException("User", user_id)
        db_obj.is_verified = True
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def change_role(self, db: Session, *, user_id: str, new_role: UserRole) -> User:
        """Change a user's role (admin only)."""
        db_obj = self.get(db, user_id)
        if not db_obj:
            raise NotFoundException("User", user_id)
        db_obj.role = new_role
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crud_user = CRUDUser()
