"""
Event Booking Platform - Main Application
"""
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, SessionLocal
from app.api.v1 import router as api_v1_router
from app.core.exceptions import AppException
from app.core.security import get_password_hash
from app.models.user import UserRole
from app.crud.user import crud_user
from app.crud.category import crud_category
from app.schemas.user import UserCreate
from app.schemas.category import CategoryCreate
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Initialize database
    init_db()

    # Seed admin user and categories
    seed_database()

    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


def seed_database():
    """Seed database with initial data."""
    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin = crud_user.get_by_email(db, email=settings.ADMIN_EMAIL)
        if not admin:
            admin_user = UserCreate(
                email=settings.ADMIN_EMAIL,
                username="admin",
                full_name="System Administrator",
                password=settings.ADMIN_PASSWORD,
                role=UserRole.ADMIN,
            )
            admin = crud_user.create(db, obj_in=admin_user)
            crud_user.verify(db, user_id=admin.id)
            logger.info(f"Admin user created: {admin.email}")

        # Seed default categories
        default_categories = [
            {"name": "Conference", "slug": "conference", "icon": "conference", "color": "#4F46E5", "description": "Professional conferences and summits"},
            {"name": "Workshop", "slug": "workshop", "icon": "workshop", "color": "#10B981", "description": "Hands-on workshops and training sessions"},
            {"name": "Concert", "slug": "concert", "icon": "music", "color": "#F59E0B", "description": "Live music concerts and performances"},
            {"name": "Networking", "slug": "networking", "icon": "network", "color": "#EC4899", "description": "Networking events and meetups"},
            {"name": "Seminar", "slug": "seminar", "icon": "seminar", "color": "#8B5CF6", "description": "Educational seminars and talks"},
            {"name": "Festival", "slug": "festival", "icon": "festival", "color": "#EF4444", "description": "Festivals and cultural events"},
            {"name": "Sports", "slug": "sports", "icon": "sports", "color": "#14B8A6", "description": "Sports events and competitions"},
            {"name": "Charity", "slug": "charity", "icon": "charity", "color": "#F97316", "description": "Charity events and fundraisers"},
        ]
        for cat_data in default_categories:
            existing = crud_category.get_by_slug(db, cat_data["slug"])
            if not existing:
                crud_category.create(
                    db,
                    obj_in=CategoryCreate(**cat_data),
                )
        logger.info("Default categories seeded")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A production-grade event booking platform API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request information."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    return response


# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )


# Include API router
app.include_router(api_v1_router)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else None,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
    }
