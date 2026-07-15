"""
Tests for the Event Booking Platform API.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal

# Use test database
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(autouse=True)
def setup_database():
    """Set up test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """Test client fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db():
    """Database session fixture."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


class TestAuth:
    """Test authentication endpoints."""

    def test_register(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "full_name": "Test User",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"
        assert "id" in data

    def test_register_duplicate_email(self, client):
        # Register first user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "full_name": "Test User",
                "password": "TestPass123!",
            },
        )
        # Try duplicate email
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "otheruser",
                "full_name": "Other User",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 409

    def test_login(self, client):
        # Register first
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "full_name": "Test User",
                "password": "TestPass123!",
            },
        )
        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "WrongPass123!",
            },
        )
        assert response.status_code == 401


class TestEvents:
    """Test events endpoints."""

    def _create_test_user(self, client):
        """Helper to create and login a test user."""
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "organizer@example.com",
                "username": "organizer",
                "full_name": "Event Organizer",
                "password": "TestPass123!",
            },
        )
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "organizer@example.com",
                "password": "TestPass123!",
            },
        )
        return response.json()["access_token"]

    def test_create_event(self, client):
        token = self._create_test_user(client)
        response = client.post(
            "/api/v1/events",
            json={
                "title": "Test Conference 2024",
                "slug": "test-conference-2024",
                "description": "A great conference for testing purposes with enough description.",
                "short_description": "A great conference",
                "venue": "Test Convention Center",
                "city": "Test City",
                "country": "Test Country",
                "start_date": "2026-12-01T09:00:00Z",
                "end_date": "2026-12-01T17:00:00Z",
                "total_capacity": 100,
                "price": 50.0,
                "currency": "USD",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        # Note: Since the test user is ATTENDEE, this should fail with 403
        assert response.status_code == 403

    def test_list_events(self, client):
        response = client.get("/api/v1/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "total" in data


class TestBooking:
    """Test booking endpoints."""

    def test_list_bookings_unauthenticated(self, client):
        response = client.get("/api/v1/bookings")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main(["-v", __file__])
