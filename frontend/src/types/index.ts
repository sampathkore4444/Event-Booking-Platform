// User types
export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  ATTENDEE = 'attendee',
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Event types
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  SOLD_OUT = 'sold_out',
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  venue: string;
  address?: string;
  city: string;
  country: string;
  is_virtual: boolean;
  virtual_link?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  total_capacity: number;
  available_tickets: number;
  price: number;
  currency: string;
  banner_url?: string;
  thumbnail_url?: string;
  status: EventStatus;
  is_featured: boolean;
  is_approved: boolean;
  organizer_id: string;
  category_id?: string;
  category?: Category;
  organizer?: User;
  created_at: string;
  updated_at: string;
  is_free: boolean;
  is_full: boolean;
  booking_count: number;
}

export interface EventCreate {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  venue: string;
  address?: string;
  city: string;
  country: string;
  is_virtual?: boolean;
  virtual_link?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  total_capacity: number;
  price?: number;
  currency?: string;
  banner_url?: string;
  thumbnail_url?: string;
  category_id?: string;
  is_featured?: boolean;
}

export interface EventUpdate {
  title?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  total_capacity?: number;
  price?: number;
  currency?: string;
  banner_url?: string;
  thumbnail_url?: string;
  category_id?: string;
  is_featured?: boolean;
  status?: EventStatus;
}

// Booking types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export interface Booking {
  id: string;
  booking_reference: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  status: BookingStatus;
  is_paid: boolean;
  payment_method?: string;
  payment_id?: string;
  notes?: string;
  special_requests?: string;
  user_id: string;
  event_id: string;
  event?: Event;
  user?: User;
  booked_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingCreate {
  event_id: string;
  quantity?: number;
  special_requests?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
