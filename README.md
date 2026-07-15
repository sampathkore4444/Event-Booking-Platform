# Event Booking Platform

A production-grade event booking platform built with FastAPI and React.

## Features

- **User Management**: Registration, authentication, profile management
- **Event Management**: Create, update, publish events with categories
- **Booking System**: Book tickets, manage reservations
- **Admin Dashboard**: User and event administration
- **Role-based Access**: Admin, Organizer, and Attendee roles
- **API Documentation**: Interactive Swagger/OpenAPI docs

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **JWT** - JSON Web Token authentication
- **Pydantic** - Data validation
- **PostgreSQL/SQLite** - Database options

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

### Default Admin Account
- Email: admin@eventbooking.com
- Password: Admin123!@#

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Users (Admin)
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Events
- `GET /api/v1/events` - List events
- `GET /api/v1/events/{id}` - Get event
- `POST /api/v1/events` - Create event
- `PUT /api/v1/events/{id}` - Update event
- `DELETE /api/v1/events/{id}` - Delete event

### Bookings
- `GET /api/v1/bookings` - List bookings
- `POST /api/v1/bookings` - Create booking
- `POST /api/v1/bookings/{id}/cancel` - Cancel booking

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category (admin)
