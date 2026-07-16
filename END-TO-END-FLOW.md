# Event Booking Platform — End-to-End Flow Documentation

> **Platform:** Event Booking Platform (renamable)
> **Stack:** FastAPI (Python) + React (TypeScript/Vite) + SQLite/PostgreSQL
> **Target Markets:** Global (with Cambodia QR, India UPI, and international Stripe payments)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Authentication Flow](#3-authentication-flow)
4. [Feature Walkthrough by Page](#4-feature-walkthrough-by-page)
   - 4.1 Homepage
   - 4.2 Browse Events
   - 4.3 Event Detail & Booking
   - 4.4 Payment Flow (Stripe / Cambodia QR / India UPI)
   - 4.5 My Tickets (QR Code)
   - 4.6 Dashboard
   - 4.7 Create Event
   - 4.8 Reviews & Ratings
   - 4.9 Analytics
   - 4.10 Profile Settings
5. [Frontend ↔ Backend Communication](#5-frontend--backend-communication)
   - 5.1 API Client Configuration
   - 5.2 Authentication Interceptors
   - 5.3 API Endpoint Reference
6. [Backend Architecture](#6-backend-architecture)
   - 6.1 Models / Database Schema
   - 6.2 CRUD Layer
   - 6.3 API Routes
   - 6.4 Services
   - 6.5 Middleware & Security
7. [Frontend Architecture](#7-frontend-architecture)
   - 7.1 Component Tree
   - 7.2 State Management
   - 7.3 Routing
   - 7.4 Styling (Tailwind CSS)
   - 7.5 Internationalization (i18n)
   - 7.6 Theme (Dark/Light Mode)
8. [Payment Integration Details](#8-payment-integration-details)
   - 8.1 Stripe (Global + India UPI)
   - 8.2 Cambodia Bakong QR (KHQR)
   - 8.3 Organizer QR Payment Confirmation
9. [Notification System](#9-notification-system)
10. [How to Start & Stop Servers](#10-how-to-start--stop-servers)
    - 10.1 Without Docker (Development)
    - 10.2 With Docker
    - 10.3 Stopping Servers
    - 10.4 Environment Variables Reference
11. [Testing](#11-testing)
12. [Production Checklist](#12-production-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)            │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │  Pages  │ │Components│ │   Services (API)  │   │   │
│  │  └────┬────┘ └────┬─────┘ └────────┬─────────┘   │   │
│  │       │            │                │              │   │
│  │       └────────────┴────────────────┘              │   │
│  │                        │                           │   │
│  │              Axios HTTP Client                      │   │
│  └────────────────────────┬──────────────────────────┘   │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Routes  │ │  CRUD    │ │ Services │ │  Models  │   │
│  │  (API)   │ │  Layer   │ │(Payment, │ │(SQLAlch.)│   │
│  │          │ │          │ │  Email)  │ │          │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │         │
│       └─────────────┴────────────┴─────────────┘         │
│                        │                                 │
│              SQLAlchemy ORM                               │
│                        │                                 │
│              ┌─────────┴──────────┐                      │
│              │  SQLite / PostgreSQL │                     │
│              └────────────────────┘                      │
└─────────────────────────────────────────────────────────┘

External Services:
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Stripe  │  │  Twilio  │  │ Telegram │  │  Bakong  │
  │ (Cards/  │  │(WhatsApp)│  │   Bot    │  │  (KH QR) │
  │  UPI)    │  │          │  │          │  │          │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI rendering |
| Build | Vite 5 | Dev server & bundling |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Routing | React Router v6 | Client-side routing |
| HTTP | Axios | API communication |
| Backend | FastAPI (Python) | REST API server |
| ORM | SQLAlchemy 2.0 | Database abstraction |
| Auth | JWT (python-jose) | Token-based auth |
| DB (dev) | SQLite | Local development |
| DB (prod) | PostgreSQL | Production database |
| Payments | Stripe + Bakong KHQR | Payment processing |
| Containers | Docker + Docker Compose | Deployment |

---

## 2. User Roles & Permissions

### User Types Explained

| State | How the system knows | Backend dependency | Frontend property |
|-------|---------------------|-------------------|-------------------|
| **Guest** | No JWT token in request / `localStorage` | `get_optional_user` returns `None` | `isAuthenticated = false` |
| **Attendee** | `users.role = "attendee"` (default on register) | `current_user.role == UserRole.ATTENDEE` | `user?.role === 'attendee'` |
| **Organizer** | `users.role = "organizer"` (set by admin) | `current_user.role == UserRole.ORGANIZER` | `user?.role === 'organizer'` |
| **Admin** | `users.role = "admin"` (seed user or promoted) | `current_user.role == UserRole.ADMIN` | `user?.role === 'admin'` |

Detailed role determination flow:
```
User opens app
    │
    ├── No JWT token → GUEST
    │     ├─ Can browse events, view details
    │     └─ Cannot book, create events, or access /dashboard
    │
    ├── Has JWT → GET /api/v1/users/me → User object
    │     │
    │     ├── role='attendee' → ATTENDEE
    │     │     ├─ Can book tickets, leave reviews
    │     │     └─ Cannot create events, manage users
    │     │
    │     ├── role='organizer' → ORGANIZER
    │     │     ├─ Can create events, view analytics
    │     │     ├─ Can confirm QR Cambodia payments
    │     │     └─ Cannot manage users (no /admin access)
    │     │
    │     └── role='admin' → ADMIN
    │           ├─ Can manage ALL users (Admin Panel at /admin)
    │           ├─ Can change any user's role
    │           ├─ Can feature events, toggle status
    │           └─ Inherits all organizer + attendee permissions
```

### Frontend Role Detection (useAuth hook)

```typescript
const { user, isAuthenticated, isAdmin, isOrganizer } = useAuth();

isAdmin: user?.role === 'admin',                     // Strict admin check
isOrganizer: user?.role === 'organizer' || user?.role === 'admin',  // Admin inherits
```

### How Users Become Organizers

Only an `admin` user can promote an attendee to organizer:
```
Admin logs in → Profile dropdown → Admin Panel (/admin)
    │
    ├── Search or filter users
    ├── Find the attendee to promote
    └── Change their role dropdown from "Attendee" → "Organizer"
         │
         └── PUT /api/v1/users/{id}/role { role: "organizer" }
              → User's role updated instantly
              → User sees organizer features on next page load
```

### Permission Matrix

| Action | Admin | Organizer | Attendee | Guest |
|--------|-------|-----------|----------|-------|
| Browse events | ✅ | ✅ | ✅ | ✅ |
| View event detail | ✅ | ✅ | ✅ | ✅ |
| Register / Login | ✅ | ✅ | ✅ | ✅ |
| Book tickets | ✅ | ✅ | ✅ | ❌ |
| Create events | ✅ | ✅ | ❌ | ❌ |
| Manage own events | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ❌ | ❌ |
| Confirm QR payments | ✅ | ✅ | ❌ | ❌ |
| Access Admin Panel (/admin) | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| Activate/deactivate users | ✅ | ❌ | ❌ | ❌ |
| Feature events globally | ✅ | ❌ | ❌ | ❌ |
| Check in attendees | ✅ | ✅ | ❌ | ❌ |

---

## 3. Authentication Flow

### Registration
```
User → RegisterPage → POST /api/v1/auth/register
                         ↓
                    Validate input (Pydantic)
                         ↓
                    Check duplicate email/username
                         ↓
                    Hash password (bcrypt)
                         ↓
                    Create User (role=attendee by default)
                         ↓
                    Generate JWT tokens
                         ↓
                    Return { access_token, refresh_token, user }
                         ↓
                    Frontend stores tokens in localStorage
                         ↓
                    Redirect to /dashboard
```

### Login
```
User → LoginPage → POST /api/v1/auth/login
                       ↓
                  Find user by email
                       ↓
                  Verify password (passlib)
                       ↓
                  Generate access_token (30min expiry)
                  Generate refresh_token (7 day expiry)
                       ↓
                  Return { access_token, refresh_token, user }
                       ↓
                  Frontend stores tokens
                       ↓
                  Redirect to /dashboard
```

### Token Refresh (Automatic)
```
Request returns 401
       ↓
Axios interceptor detects 401
       ↓
Check if refresh_token exists in localStorage
       ↓
POST /api/v1/auth/refresh { refresh_token }
       ↓
Server validates refresh token
       ↓
Returns new access_token + refresh_token
       ↓
Frontend updates localStorage
       ↓
Retry original request with new token
```

### Logout
```
User clicks "Sign Out"
       ↓
Frontend clears localStorage (access_token, refresh_token, user)
       ↓
Redirect to /
```

---

## 4. Feature Walkthrough by Page

### 4.1 Homepage (`/`)

**Frontend:** `HomePage.tsx`
**Backend endpoints used:**
- `GET /api/v1/events/featured?limit=4` — Fetch 4 featured events
- `GET /api/v1/events/upcoming?limit=8` — Fetch 8 upcoming events
- `GET /api/v1/categories` — Fetch all event categories

**Flow:**
1. Page loads → 3 parallel API calls fetch featured events, upcoming events, and categories
2. Hero section displays search bar + quick stats (hardcoded for now)
3. Search query → redirects to `/events?search=query`
4. Category cards → link to `/events?category={id}`
5. Featured events grid → click to `/events/{slug}`
6. Upcoming events grid → click to `/events/{slug}`
7. CTA section → links to `/register` and `/events`

### 4.2 Browse Events (`/events`)

**Frontend:** `EventsPage.tsx`
**Backend endpoint:**
- `GET /api/v1/events?skip=0&limit=12&upcoming=true&search=&category_id=&city=&is_free=&is_virtual=` — Paginated event list

**Flow:**
1. URL search params read on load (search, category, city, is_free, is_virtual)
2. Filters synced to backend query params
3. Each filter change resets page to 1
4. Event cards display: gradient image placeholder, badges (Featured/Free/Sold Out), date badge, venue, title, description, price, tickets left
5. Pagination at bottom when total_pages > 1
6. Empty state: "No events found" with link to create first event or clear filters

### 4.3 Event Detail & Booking (`/events/:slug`)

**Frontend:** `EventDetailPage.tsx`
**Backend endpoints:**
- `GET /api/v1/events/slug/{slug}` — Fetch event by slug
- `POST /api/v1/bookings` — Create booking
- `POST /api/v1/payments/create-checkout-session` — Stripe checkout
- `POST /api/v1/payments/generate-qr` — Cambodia QR payment

**Booking Flow (Free Event):**
```
User clicks "Book Now"
       ↓
Booking modal opens (quantity selector + total)
       ↓
User clicks "Confirm Booking"
       ↓
POST /api/v1/bookings { event_id, quantity }
       ↓
Event is free? → Booking auto-confirmed → Redirect to /dashboard
```

**Booking Flow (Paid - Global):**
```
User clicks "Book Now" → modal → "Confirm Booking"
       ↓
POST /api/v1/bookings { event_id, quantity }
       ↓
Booking created (status: pending)
Event.available_tickets decremented (inside row lock)
       ↓
POST /api/v1/payments/create-checkout-session { booking_id }
       ↓
Stripe Checkout Session created
       ↓
Frontend redirects to Stripe Checkout URL
       ↓
User completes payment on Stripe
       ↓
Stripe sends webhook POST /api/v1/payments/webhook
       ↓
Booking status → confirmed
Check-in code generated
       ↓
Frontend detects ?payment=success&booking=REF on redirect back
       ↓
Toast: "Payment successful!"
```

**Booking Flow (Paid - Cambodia):**
```
User clicks "Book Now" → modal → "Confirm Booking"
       ↓
POST /api/v1/bookings { event_id, quantity }
       ↓
Booking created (status: pending)
       ↓
POST /api/v1/payments/generate-qr { booking_id }
       ↓
Backend returns QR code base64 string + merchant details
       ↓
PaymentQRModal opens showing the QR code
       ↓
User scans with Bakong app, transfers the amount
       ↓
User clicks "I've Made the Payment"
       ↓
Redirect to /dashboard
Booking stays "pending"
       ↓
Organizer goes to Dashboard → QR Payments tab
       ↓
Organizer verifies transfer and clicks "Confirm Payment"
       ↓
Booking status → confirmed
```

### 4.4 Payment Flow

See Section 8 for full details.

### 4.5 My Tickets (`/ticket/:bookingId`)

**Frontend:** `MyTicketPage.tsx`
**Backend endpoint:**
- `GET /api/v1/bookings/{bookingId}/ticket` — Fetch ticket QR info

**Flow:**
1. Booking reference, check-in code, event details loaded from API
2. QR code generated client-side using a self-contained QR Version 2 generator with Reed-Solomon error correction (no external npm package needed)
3. User can download ticket as PNG, copy reference
4. If checked in: shows "Checked In" badge with timestamp
5. Instructions: arrive 15 min early, keep ticket handy

### 4.6 Dashboard (`/dashboard`)

**Frontend:** `DashboardPage.tsx`
**Backend endpoints:**
- `GET /api/v1/bookings?status=` — User's bookings
- `GET /api/v1/events/my` — Organizer's events
- `GET /api/v1/bookings/organizer/pending-qr` — Pending Cambodia QR payments

**Three tabs:**

**Tab 1: My Bookings**
- List of user's bookings with status badges (pending/yellow, confirmed/green, cancelled/red)
- Status filter buttons (All, Pending, Confirmed, Cancelled, Completed)
- Cancel button for pending bookings
- Link to view event

**Tab 2: My Events** (organizer only)
- List of organizer's events with status
- Publish button for draft events
- Checks for Stripe redirect params (?payment=success / ?payment=cancelled)

**Tab 3: QR Payments** (organizer only)
- Lists pending Cambodia QR payment bookings
- Each shows: attendee name, ticket count, amount, booking reference, booked time
- Confirm / Reject buttons
- Badge count on tab header

### 4.7 Create Event (`/events/create`)

**Frontend:** `CreateEventPage.tsx`
**Backend endpoint:**
- `POST /api/v1/events` — Create event (automatic slug generation)

**Form sections:**
1. **Basic Information** — Title (auto-generates slug), Short Description, Full Description, Category (dropdown), Slug
2. **Date & Time** — Start Date/Time, End Date/Time, Registration Deadline
3. **Location** — Virtual event toggle, Venue, Address, City, Country, Virtual Link
4. **Capacity & Pricing** — Total Capacity, Price ($0 = free), Currency (USD/EUR/GBP)

**On submit:**
1. Event created with status `published` and `is_approved = true`
2. `available_tickets` initialized to `total_capacity`
3. Redirect to `/events/{slug}`

### 4.8 Reviews & Ratings

**Frontend:** `ReviewSection.tsx` (embedded in `EventDetailPage.tsx`)
**Backend endpoints:**
- `GET /api/v1/reviews/event/{eventId}` — Get reviews for event
- `GET /api/v1/reviews/event/{eventId}/stats` — Get review stats
- `POST /api/v1/reviews` — Create review
- `PUT /api/v1/reviews/{reviewId}` — Update own review
- `DELETE /api/v1/reviews/{reviewId}` — Delete own review

**Features:**
- Rating distribution bar chart (5-star breakdown)
- Interactive star rating (1-5)
- Create, edit, delete own reviews
- "Verified" badge for confirmed bookers
- User avatar with initials

### 4.9 Analytics (`/analytics`)

**Frontend:** `AnalyticsPage.tsx`
**Backend endpoint:**
- `GET /api/v1/analytics/overview?days=30` — Dashboard analytics data

**Displays:**
- 4 stat cards: Total Events, Total Bookings, Revenue, Confirmed Bookings
- Period selector: 7d / 30d / 90d
- Sales bar chart (inline CSS bars, no recharts dependency)
- Top performing events table
- Bottom stats: Active Organizers, Pending Bookings, Total Events

### 4.10 Admin Panel (`/admin`)

**Frontend:** `AdminPage.tsx`
**Backend endpoints:**
- `GET /api/v1/users` — List all users (admin only)
- `PUT /api/v1/users/{id}/role` — Change user role (admin only)
- `POST /api/v1/users/{id}/activate` — Activate user
- `POST /api/v1/users/{id}/deactivate` — Deactivate user
- `POST /api/v1/users/{id}/verify` — Verify user email

**Flow:**
1. Admin navigates to `/admin` (link in profile dropdown)
2. Stats cards show: total users, admin/organizer/attendee counts
3. Search bar: filter by name, email, or username
4. Role filter buttons: All / Attendee / Organizer / Admin
5. Users table shows: avatar, name, username, email, role (dropdown), active status (toggle), verified status
6. Role change dropdown: select new role → immediate API call
7. Active/inactive toggle: click to activate or deactivate
8. Verify button: verify unverified users
9. Pagination: Previous / Next

### 4.11 Profile Settings (`/profile`)

**Frontend:** `ProfilePage.tsx`
**Backend endpoint:**
- `PUT /api/v1/users/me` — Update profile

**Sections:**
1. **Profile header** — Avatar with initials, name, email, role badge, verified badge
2. **Edit form** — Full Name, Username, Email, Phone
3. **Account Information** — Member Since, Role, Account Status (Active/Inactive)

---

## 5. Frontend ↔ Backend Communication

### 5.1 API Client Configuration

**File:** `frontend/src/services/api.ts`

```typescript
const API_BASE_URL = '/api/v1';  // Proxied through Vite in dev

// Axios instance with:
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,  // 30 seconds
});
```

In development, Vite's `vite.config.ts` proxies `/api` requests to the FastAPI server:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

In production, both frontend and backend are served from the same domain or a reverse proxy handles routing.

### 5.2 Authentication Interceptors

**Request Interceptor:** Adds `Authorization: Bearer {token}` header from localStorage.

**Response Interceptor:** On 401 errors:
1. Checks `_retry` flag to avoid infinite loops
2. Gets refresh token from localStorage
3. Calls `POST /api/v1/auth/refresh`
4. Stores new tokens
5. Retries original request
6. If refresh fails → clears localStorage → redirects to `/login`

### 5.3 API Endpoint Reference

#### Authentication

| Method | Endpoint | Auth | Body | Response | Description |
|--------|----------|------|------|----------|-------------|
| POST | `/api/v1/auth/register` | ❌ | `{email, username, full_name, password, phone?}` | `{access_token, refresh_token, token_type, expires_in, user}` | Register new user |
| POST | `/api/v1/auth/login` | ❌ | `{email, password}` | `{access_token, refresh_token, token_type, expires_in, user}` | Login |
| POST | `/api/v1/auth/refresh` | ❌ | `{refresh_token}` | `{access_token, refresh_token}` | Refresh tokens |
| POST | `/api/v1/auth/logout` | ✅ | — | `{message}` | Invalidate tokens |

#### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/me` | ✅ | Get current user profile |
| PUT | `/api/v1/users/me` | ✅ | Update current user profile |
| GET | `/api/v1/users` | Admin | List all users (paginated) |
| GET | `/api/v1/users/{id}` | Admin | Get user by ID |
| PUT | `/api/v1/users/{id}` | Admin | Update any user |
| PUT | `/api/v1/users/{id}/role` | Admin | Change user's role (`attendee`, `organizer`, `admin`) |
| POST | `/api/v1/users/{id}/activate` | Admin | Activate a deactivated user |
| POST | `/api/v1/users/{id}/deactivate` | Admin | Deactivate a user account |
| POST | `/api/v1/users/{id}/verify` | Admin | Mark user email as verified |

#### Events

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/v1/events` | ❌ | `skip, limit, search, category_id, city, is_free, is_virtual, upcoming, status, sort_by, sort_desc` | List events (paginated) |
| GET | `/api/v1/events/featured` | ❌ | `limit` | Get featured events |
| GET | `/api/v1/events/upcoming` | ❌ | `limit` | Get upcoming events |
| GET | `/api/v1/events/my` | ✅ | — | Get organizer's events |
| GET | `/api/v1/events/{id}` | ❌ | — | Get event by ID |
| GET | `/api/v1/events/slug/{slug}` | ❌ | — | Get event by slug |
| POST | `/api/v1/events` | ✅ | — | Create event |
| PUT | `/api/v1/events/{id}` | ✅ | — | Update event |
| DELETE | `/api/v1/events/{id}` | ✅ | — | Delete event |
| POST | `/api/v1/events/{id}/publish` | ✅ | — | Publish event |
| PUT | `/api/v1/events/{id}/status` | ✅ | — | Update event status |
| POST | `/api/v1/events/{id}/feature` | Admin | — | Toggle featured |

#### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/bookings` | ✅ | Get current user's bookings |
| GET | `/api/v1/bookings/all` | Admin | Get all bookings |
| GET | `/api/v1/bookings/{id}` | ✅ | Get booking by ID |
| POST | `/api/v1/bookings` | ✅ | Create booking |
| POST | `/api/v1/bookings/{id}/confirm` | ✅ | Confirm booking |
| POST | `/api/v1/bookings/{id}/cancel` | ✅ | Cancel booking (with refund option) |
| GET | `/api/v1/bookings/{id}/ticket` | ✅ | Get QR ticket info |
| POST | `/api/v1/bookings/check-in` | ✅ | Check-in attendee by QR code |
| GET | `/api/v1/bookings/event/{id}/checkins` | ✅ | List event check-ins |
| GET | `/api/v1/bookings/organizer/pending-qr` | ✅ | List pending Cambodia QR payments |
| POST | `/api/v1/bookings/{id}/confirm-qr` | ✅ | Organizer confirms QR payment |
| POST | `/api/v1/bookings/{id}/reject-qr` | ✅ | Organizer rejects QR payment |

#### Payments

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/v1/payments/create-checkout-session` | ✅ | `{booking_id}` | Create Stripe Checkout Session |
| POST | `/api/v1/payments/generate-qr` | ✅ | `{booking_id}` | Generate Cambodia QR code |
| POST | `/api/v1/payments/webhook` | ❌ | Stripe event | Stripe webhook handler |

#### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/categories` | ❌ | List all categories |
| GET | `/api/v1/categories/{id}` | ❌ | Get category by ID |
| POST | `/api/v1/categories` | Admin | Create category |
| PUT | `/api/v1/categories/{id}` | Admin | Update category |
| DELETE | `/api/v1/categories/{id}` | Admin | Delete category |

#### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/reviews/event/{eventId}` | ❌ | Get event reviews |
| GET | `/api/v1/reviews/event/{eventId}/stats` | ❌ | Get review stats |
| POST | `/api/v1/reviews` | ✅ | Create review |
| PUT | `/api/v1/reviews/{id}` | ✅ | Update review (own only) |
| DELETE | `/api/v1/reviews/{id}` | ✅ | Delete review (own only) |

#### Analytics

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/v1/analytics/overview` | ✅ | `days=30` | Get analytics overview |
| GET | `/api/v1/analytics/events/{eventId}` | ✅ | — | Get per-event analytics |

#### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications/status` | ✅ | Get notification channel status |
| POST | `/api/v1/notifications/test/whatsapp` | ✅ | Test WhatsApp notification |
| POST | `/api/v1/notifications/test/telegram` | ✅ | Test Telegram notification |

### Frontend Service Layer

Each backend resource has a corresponding frontend service class:

```
frontend/src/services/
├── api.ts               # Axios instance + interceptors
├── event.service.ts     # Event CRUD operations
├── booking.service.ts   # Booking CRUD + QR tickets + check-in
├── payment.service.ts   # Stripe + Cambodia QR payments
├── category.service.ts  # Categories
├── review.service.ts    # Reviews
├── analytics.service.ts # Analytics data
└── api.service.ts       # Legacy (keep for reference)
```

Each service class uses `apiClient.get<T>()`, `apiClient.post<T>()`, etc. which:
1. Automatically add auth headers
2. Automatically handle token refresh
3. Return typed responses
4. Transform snake_case backend JSON to camelCase frontend types (via Axios transformResponse)

---

## 6. Backend Architecture

### 6.1 Models / Database Schema

```
backend/app/models/
├── __init__.py      # Exports all models
├── user.py          # User model
├── category.py      # Category model
├── event.py         # Event model
├── booking.py       # Booking model (with BookingStatus enum)
└── review.py        # Review model
```

#### User Model (`user.py`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid4 |
| email | String(255) | Unique, indexed, not null |
| username | String(100) | Unique, indexed, not null |
| full_name | String(255) | Not null |
| hashed_password | String(255) | Not null |
| role | Enum(UserRole) | Default: attendee |
| phone | String(20) | Nullable |
| avatar_url | String(500) | Nullable |
| is_active | Boolean | Default: true |
| is_verified | Boolean | Default: false |
| telegram_chat_id | String(100) | Nullable |
| created_at | DateTime | Default: utcnow |
| updated_at | DateTime | Auto-update |

#### Event Model (`event.py`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | String(255) | Not null |
| slug | String(255) | Unique, indexed |
| description | Text | Not null |
| short_description | String(500) | Nullable |
| venue | String(255) | Not null |
| address | String(500) | Nullable |
| city | String(100) | Not null |
| country | String(100) | Not null |
| is_virtual | Boolean | Default: false |
| virtual_link | String(500) | Nullable |
| start_date | DateTime | Not null |
| end_date | DateTime | Not null |
| registration_deadline | DateTime | Nullable |
| total_capacity | Integer | Not null |
| available_tickets | Integer | Not null |
| price | Float | Default: 0.0 |
| currency | String(3) | Default: USD |
| banner_url | String(500) | Nullable |
| thumbnail_url | String(500) | Nullable |
| status | Enum(EventStatus) | Default: draft |
| is_featured | Boolean | Default: false |
| is_approved | Boolean | Default: false |
| category_id | UUID | FK → categories.id |
| organizer_id | UUID | FK → users.id, not null |
| created_at | DateTime | |
| updated_at | DateTime | |

#### Booking Model (`booking.py`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_reference | String(20) | Unique, indexed |
| user_id | UUID | FK → users.id |
| event_id | UUID | FK → events.id |
| quantity | Integer | Not null |
| unit_price | Float | Not null |
| total_price | Float | Not null |
| currency | String(3) | Default: USD |
| status | Enum(BookingStatus) | Default: pending |
| is_paid | Boolean | Default: false |
| payment_method | String(50) | Nullable |
| payment_id | String(255) | Nullable |
| payment_status | String(50) | Nullable |
| special_requests | Text | Nullable |
| notes | Text | Nullable |
| check_in_code | String(20) | Nullable, unique |
| checked_in_at | DateTime | Nullable |
| checked_in_by | String(255) | Nullable |
| confirmed_at | DateTime | Nullable |
| cancelled_at | DateTime | Nullable |
| booked_at | DateTime | Default: utcnow |
| created_at | DateTime | |
| updated_at | DateTime | |

#### Enums

```
EventStatus: draft, published, cancelled, completed, sold_out
BookingStatus: pending, confirmed, cancelled, refunded, completed, no_show
UserRole: admin, organizer, attendee
```

### 6.2 CRUD Layer

Each model has a corresponding CRUD class in `backend/app/crud/`:

| File | Class | Key Operations |
|------|-------|---------------|
| `user.py` | `CRUDUser` | get, get_by_email, get_by_username, create, update, remove, activate, deactivate, verify |
| `event.py` | `CRUDEvent` | get, get_by_slug, get_multi (with 10+ filter params), create, update, remove, update_status, toggle_featured, get_upcoming, get_featured |
| `booking.py` | `CRUDBooking` | get, get_multi, create (with row-level lock), confirm, check_in, cancel (with refund), mark_no_show, complete |
| `category.py` | `CRUDCategory` | get, get_by_slug, get_multi, create, update, remove |
| `review.py` | `CRUDReview` | get, get_by_user_and_event, get_multi, get_stats, create, update, remove |

**Key patterns:**
- All CRUD classes use `db: Session` dependency injection
- `create()` methods use `with_for_update()` for row-level locking on race conditions
- Soft validation via `NotFoundException`, `DuplicateException`, `BookingException`

### 6.3 API Routes

```
backend/app/api/v1/
├── __init__.py        # Router aggregation
├── auth.py            # Login, register, refresh, logout
├── users.py           # User CRUD + profile management
├── events.py          # Event CRUD + featured/upcoming
├── bookings.py        # Booking CRUD + check-in + QR payment management
├── categories.py      # Category CRUD
├── payments.py        # Stripe checkout + Cambodia QR + webhook
├── reviews.py         # Review CRUD + stats
├── analytics.py       # Analytics overview + per-event
├── notifications.py   # Notification channel status + test
└── deps.py            # Dependencies (get_current_user, get_optional_user)
```

### 6.4 Services

```
backend/app/services/
├── email.py           # EmailService (SMTP via aiosmtplib)
├── email_templates.py # HTML email templates for confirmations
├── stripe_service.py  # StripeService (checkout sessions + webhooks)
├── khqr_service.py    # Bakong KHQR payment generation
├── whatsapp.py        # WhatsAppService (Twilio API)
└── telegram.py        # TelegramService (Bot API)
```

### 6.5 Middleware & Security

| Middleware | Purpose |
|-----------|---------|
| CORSMiddleware | Allow frontend origins (configurable via CORS_ORIGINS) |
| TrustedHostMiddleware | Host header validation (production only) |
| Request logging | Logs method, path, status, and timing |
| Rate limiting (slowapi) | 60 requests/minute (configurable) |
| JWT authentication | Bearer token validation on protected routes |
| AppException handler | Global error formatting |

---

## 7. Frontend Architecture

### 7.1 Component Tree

```
App.tsx
├── ThemeProvider (useTheme.ts)
│   └── AuthProvider (useAuth.tsx)
│       └── BrowserRouter
│           └── Layout.tsx
│               ├── Navbar
│               │   ├── Logo
│               │   ├── NavLinks
│               │   ├── LanguageSwitcher
│               │   ├── ThemeSwitcher
│               │   └── UserMenu / AuthButtons
│               ├── Pages (via Routes)
│               │   ├── HomePage (/)
│               │   ├── EventsPage (/events)
│               │   ├── EventDetailPage (/events/:slug)
│               │   │   └── ReviewSection
│               │   │       └── StarRating
│               │   ├── LoginPage (/login)
│               │   ├── RegisterPage (/register)
│               │   ├── CreateEventPage (/events/create)
│               │   ├── DashboardPage (/dashboard)
│               │   ├── ProfilePage (/profile)
│               │   ├── MyTicketPage (/ticket/:bookingId)
│               │   └── AnalyticsPage (/analytics)
│               │       └── PaymentQRModal
│               └── Footer
│                   └── Links + Copyright
├── Toaster (react-hot-toast)
└── i18n Initialization
```

### 7.2 State Management

The platform uses **React built-in state management** (no Redux):

| State Type | Mechanism | Location |
|-----------|-----------|----------|
| Auth state | React Context | `useAuth.tsx` — provides `user`, `isAuthenticated`, `login()`, `register()`, `logout()` |
| Theme | React Context | `useTheme.ts` — provides theme + toggle, persists to localStorage |
| Translation | Hook + Event | `useTranslation.ts` — re-renders on language change |
| Page data | `useState` + `useEffect` | Each page fetches its own data via service classes |
| Form state | `useState` | Component-local state for forms |

### 7.3 Routing

```
Path                Component        Protection         Route Guard
/                   HomePage         Public             —
/events             EventsPage       Public             —
/events/:slug       EventDetailPage  Public             —
/events/create      CreateEventPage  Authenticated       ProtectedRoute (in-page organizer check)
/login              LoginPage        Public             —
/register           RegisterPage     Public             —
/dashboard          DashboardPage    Authenticated       ProtectedRoute
/profile            ProfilePage      Authenticated       ProtectedRoute
/ticket/:bookingId  MyTicketPage     Authenticated       ProtectedRoute
/analytics          AnalyticsPage    Authenticated       ProtectedRoute
/admin              AdminPage        Admin only          AdminRoute
```

**Route guards available in `App.tsx`:**
- `ProtectedRoute` — Redirects unauthenticated users to `/login`
- `OrganizerRoute` — Redirects non-organizer users to `/` (used inside pages, not routes)
- `AdminRoute` — Redirects non-admin users to `/` (used for `/admin` route)

### 7.4 Styling (Tailwind CSS)

- **Configuration:** `frontend/tailwind.config.js` with custom brand colors (brand-500, accent-500)
- **Dark mode:** `darkMode: 'class'` — toggled by `ThemeSwitcher` via `document.documentElement.classList`
- **Component classes:** Custom `.btn`, `.card`, `.input`, `.badge` classes in `index.css`
- **Animations:** Custom `fade-in`, `scale-in`, `slide-down` animations defined in `index.css`

### 7.5 Internationalization (i18n)

- **File:** `frontend/src/i18n/index.ts`
- **Languages:** English (`en`), Khmer (`km`), Portuguese-Brazil (`pt-BR`), Hindi (`hi`)
- **Mechanism:** Module-level `currentLanguage` variable with `t()` function
- **Fallback:** Missing keys in non-English languages fall back to English automatically
- **Persistence:** Language stored in `localStorage` under `eventhub-lang` key
- **Hook:** `useTranslation()` returns `{ t, lang, changeLanguage }` — re-renders on `language-changed` custom event
- **Usage:** `{t('nav.home')}`, `{t('auth.login')}`

### 7.6 Theme (Dark/Light Mode)

- **Hook:** `useTheme.ts` — manages theme state with `useThemeProvider()`
- **Variants:** `light`, `dark`, `system` (auto-detect via `prefers-color-scheme`)
- **Persistence:** Theme stored in `localStorage` under `eventhub-theme` key
- **Implementation:** Toggles `dark` class on `<html>` element
- **Styling:** All components use Tailwind `dark:` variant classes

---

## 8. Payment Integration Details

### 8.1 Stripe (Global + India UPI)

**Flow:**
```
Frontend → POST /api/v1/payments/create-checkout-session { booking_id }
                               ↓
                Backend creates Stripe Checkout Session:
                  - Line item: event title + quantity
                  - Payment method types: ['card']
                  - For India: also ['upi'] (auto-detected by country)
                  - Mode: 'payment'
                  - Success URL: /dashboard?payment=success&booking={ref}
                  - Cancel URL: /dashboard?payment=cancelled
                               ↓
                Returns { url, session_id, payment_method }
                               ↓
                Frontend redirects to Stripe Checkout URL
                               ↓
                User pays on Stripe.com (Card / UPI)
                               ↓
                Stripe sends webhook to POST /api/v1/payments/webhook
                  - event type: checkout.session.completed
                               ↓
                Backend updates booking status → confirmed
                Backend generates unique check_in_code for QR ticket
```

**Webhook handler:**
```python
@router.post("/payments/webhook")
async def stripe_webhook(payload: dict):
    # Verify Stripe signature
    # Extract session_id from payload
    # Find booking by session_id
    # Call crud_booking.confirm(db, booking_id)
    # Send confirmation email/WhatsApp/Telegram
```

### 8.2 Cambodia Bakong QR (KHQR)

**Flow:**
```
Frontend → POST /api/v1/payments/generate-qr { booking_id }
                               ↓
                Backend:
                  - Generates KHQR payload with:
                    - Merchant Info (configured via env vars)
                    - Amount = booking.total_price
                    - Currency = USD
                    - Bill Number = booking.booking_reference
                    - Store Label = App name
                  - Encodes to QR code image (base64 PNG)
                  - Returns { qr_base64, khqr_string, merchant_name, amount, currency, bill_number, instructions }
                               ↓
                Frontend opens PaymentQRModal
                  - Shows QR code for user to scan
                  - Displays amount, merchant, bill reference
                  - Copy bill number button
                  - Instructions: "Transfer this amount using Bakong app"
                               ↓
                User scans with Bakong app and transfers
                               ↓
                User clicks "I've Made the Payment"
                  - Redirected to Dashboard
                  - Booking status: pending (organizer must confirm)
```

**Organizer Confirmation Flow:**
```
Organizer → Dashboard → QR Payments tab
                              ↓
             List of pending Cambodia QR payments
              - Attendee name, ticket count, amount, ref
                  ↓
             Organizer verifies transfer in their bank
                  ↓
             Clicks "Confirm Payment" → POST /api/v1/bookings/{id}/confirm-qr
                  ↓
             Booking status → confirmed
             Check-in code generated
             Notification sent to attendee
```

### 8.3 Country-Based Payment Routing

```typescript
// frontend logic in EventDetailPage.tsx
if (event.is_free) → confirm booking instantly

// Cambodia
if (country === 'Cambodia' || country === 'KH')
    → POST /api/v1/payments/generate-qr
    → Show PaymentQRModal with Bakong QR

// India
if (country === 'India' || country === 'IN')
    → POST /api/v1/payments/create-checkout-session
    → Stripe Checkout with UPI option enabled

// All other countries
→ POST /api/v1/payments/create-checkout-session
→ Stripe Checkout with card payment
```

---

## 9. Notification System

**File:** `backend/app/api/v1/notifications.py`

The `NotificationService` class manages:

| Channel | Service | Setup Required |
|---------|---------|---------------|
| **Email** | SMTP (aiosmtplib) | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` |
| **WhatsApp** | Twilio API | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| **Telegram** | Bot API | `TELEGRAM_BOT_TOKEN` |

**Notification triggers:**
1. `send_booking_confirmation(booking_id)` — Called when booking is confirmed (after Stripe payment or organizer QR confirmation)
   - Sends email with ticket QR code
   - Sends WhatsApp message (if configured)
   - Sends Telegram message (if configured)

2. `send_organizer_qr_notification(booking_id)` — Called when Cambodia QR payment is created
   - Notifies organizer about new pending QR payment
   - Via email/WhatsApp/Telegram

**Status endpoint:**
- `GET /api/v1/notifications/status` — Returns which channels are configured

---

## 10. How to Start & Stop Servers

### 10.1 Without Docker (Development)

#### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

#### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Or (Mac/Linux)
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
# Copy .env.example to .env and edit as needed
copy .env.example .env          # Windows
# cp .env.example .env          # Mac/Linux

# 5. Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Create SQLite database (`event_booking.db`) automatically on first run
- Seed default admin user: `admin@eventbooking.com` / `Admin123!@#`
- Seed 8 default categories (Conference, Workshop, Concert, Networking, Seminar, Festival, Sports, Charity)
- API docs available at: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

#### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```

The frontend will start at `http://localhost:5173`.
Vite proxies `/api` requests to `http://localhost:8000` automatically.

#### Running Both Together

**Option A: Two terminal windows**
```bash
# Terminal 1
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
cd frontend && npm run dev
```

**Option B: Single terminal (using background processes)**
```bash
# Start backend in background
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
# Start frontend
cd ../frontend && npm run dev
```

### 10.2 With Docker

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose v2+

#### Project Structure for Docker

The project includes:
- `backend/Dockerfile` — Multi-stage build for the FastAPI backend
- A `docker-compose.yml` should be at the project root

#### Building and Running

```bash
# From project root

# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build
```

#### docker-compose.yml (create if not exists)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/event_booking
      - SECRET_KEY=your-production-secret-key
      - APP_ENV=production
      - DEBUG=false
      - CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=event_booking
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### nginx.conf (for production)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 10.3 Stopping Servers

#### Without Docker

```bash
# Frontend: Press Ctrl+C in the terminal where npm run dev is running

# Backend: Press Ctrl+C in the terminal where uvicorn is running

# Or kill processes by port:
# Windows
netstat -ano | findstr :5173    # Find frontend PID
netstat -ano | findstr :8000    # Find backend PID
taskkill /PID <PID> /F

# Mac/Linux
kill $(lsof -t -i:5173)  # Kill frontend
kill $(lsof -t -i:8000)  # Kill backend
```

#### With Docker

```bash
# Stop all services (keeps volumes)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything (including volumes, deletes DB data)
docker-compose down -v

# View running containers
docker-compose ps
```

### 10.4 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | "Event Booking Platform" | Application name |
| `APP_VERSION` | "1.0.0" | Version number |
| `APP_ENV` | "development" | Environment (development/production) |
| `DEBUG` | true | Enable debug mode |
| `DATABASE_URL` | sqlite:///./event_booking.db | Database connection string |
| `SECRET_KEY` | "super-secret-key-change-me" | JWT signing key |
| `ALGORITHM` | "HS256" | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Refresh token TTL |
| `CORS_ORIGINS` | ["http://localhost:5173"] | Allowed CORS origins |
| `SMTP_HOST` | "" | SMTP server (empty = email disabled) |
| `SMTP_PORT` | 587 | SMTP port |
| `SMTP_USER` | "" | SMTP username |
| `SMTP_PASSWORD` | "" | SMTP password |
| `ADMIN_EMAIL` | admin@eventbooking.com | Default admin email |
| `ADMIN_PASSWORD` | Admin123!@# | Default admin password |
| `STRIPE_SECRET_KEY` | "" | Stripe secret key (required for payments) |
| `STRIPE_PUBLISHABLE_KEY` | "" | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | "" | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` | "" | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | "" | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | "+14155238886" | Twilio WhatsApp sender |
| `TELEGRAM_BOT_TOKEN` | "" | Telegram bot token |
| `RATE_LIMIT_PER_MINUTE` | 60 | API rate limit |

---

## 11. Testing

### Backend Tests

```bash
cd backend
venv\Scripts\activate

# Run all tests
pytest -v

# Run with coverage
pytest --cov=app -v

# Run specific test file
pytest tests/test_auth.py -v

# Run tests matching a keyword
pytest -k "booking" -v
```

### Frontend E2E Tests (Playwright)

```bash
cd frontend

# Install Playwright browsers
npm run test:e2e:install

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

---

## 12. Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
      Run: `python -c "import secrets; print(secrets.token_urlsafe(64))"` and paste the output into `.env`
- [ ] Set `DEBUG=false` and `APP_ENV=production`
- [ ] Switch to PostgreSQL:
      `DATABASE_URL=postgresql://user:password@localhost:5432/event_booking`
      (psycopg2-binary is already in requirements.txt)
- [ ] Configure `CORS_ORIGINS` to your actual frontend domain
- [ ] Configure Stripe keys (live keys, not test keys)
- [ ] Set up Stripe webhook endpoint in Stripe Dashboard
- [ ] Configure SMTP for transactional emails
- [ ] (Optional) Configure Twilio for WhatsApp notifications
- [ ] (Optional) Configure Telegram bot for notifications
- [ ] Run database migrations (`alembic upgrade head`)
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Set up reverse proxy (nginx/Caddy) with SSL
- [ ] Set up PostgreSQL with automated backups
- [ ] Enable Docker restart policies (`restart: unless-stopped`)
- [ ] Set up monitoring (health check endpoint at `/health`)
- [ ] Configure rate limiting for production traffic
- [ ] Add CDN for static assets
- [ ] **Promote users to organizer role** via Admin Panel at `/admin` (only the seed admin can do this)
- [ ] Remove default placeholder SECRET_KEY from `.env.example` before deployment
