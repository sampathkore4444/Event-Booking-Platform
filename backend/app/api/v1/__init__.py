from fastapi import APIRouter
from app.api.v1 import (
    auth, users, events, bookings, categories, payments,
    reviews, analytics, notifications,
)

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, tags=["Authentication"])
router.include_router(users.router, tags=["Users"])
router.include_router(events.router, tags=["Events"])
router.include_router(bookings.router, tags=["Bookings"])
router.include_router(categories.router, tags=["Categories"])
router.include_router(payments.router, tags=["Payments"])
router.include_router(reviews.router, tags=["Reviews"])
router.include_router(analytics.router, tags=["Analytics"])
router.include_router(notifications.router, tags=["Notifications"])
