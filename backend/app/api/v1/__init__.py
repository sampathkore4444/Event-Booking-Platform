from fastapi import APIRouter
from app.api.v1 import auth, users, events, bookings, categories, payments

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, tags=["Authentication"])
router.include_router(users.router, tags=["Users"])
router.include_router(events.router, tags=["Events"])
router.include_router(bookings.router, tags=["Bookings"])
router.include_router(categories.router, tags=["Categories"])
router.include_router(payments.router, tags=["Payments"])
