import { apiClient } from './api';
import type {
  Booking,
  BookingCreate,
  BookingListResponse,
  BookingStatus,
} from '../types';

export interface TicketQRInfo {
  booking_reference: string;
  check_in_code: string;
  event_title: string;
  event_date: string | null;
  event_venue: string;
  event_city: string;
  attendee_name: string;
  quantity: number;
  checked_in: boolean;
  checked_in_at: string | null;
}

class BookingService {
  async getMyBookings(params?: {
    skip?: number;
    limit?: number;
    status?: BookingStatus;
  }): Promise<BookingListResponse> {
    return apiClient.get<BookingListResponse>('/bookings', params as Record<string, unknown>);
  }

  async getAllBookings(params?: {
    skip?: number;
    limit?: number;
    status?: BookingStatus;
    event_id?: string;
  }): Promise<BookingListResponse> {
    return apiClient.get<BookingListResponse>('/bookings/all', params as Record<string, unknown>);
  }

  async getBooking(id: string): Promise<Booking> {
    return apiClient.get<Booking>(`/bookings/${id}`);
  }

  async createBooking(data: BookingCreate): Promise<Booking> {
    return apiClient.post<Booking>('/bookings', data);
  }

  async cancelBooking(id: string, refund: boolean = false): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/cancel?refund=${refund}`);
  }

  async confirmBooking(id: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/confirm`);
  }

  async getEventBookings(eventId: string): Promise<{ bookings: Booking[]; total: number }> {
    return apiClient.get<{ bookings: Booking[]; total: number }>(`/events/${eventId}/bookings`);
  }

  // --- QR Ticket (Check-in) System ---

  /** Get QR ticket info for an attendee's confirmed booking */
  async getTicketQR(bookingId: string): Promise<TicketQRInfo> {
    return apiClient.get<TicketQRInfo>(`/bookings/${bookingId}/ticket`);
  }

  /** Check in an attendee using their QR code (organizer only) */
  async checkInAttendee(checkInCode: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/check-in?check_in_code=${encodeURIComponent(checkInCode)}`);
  }

  /** List all confirmed bookings with check-in status for an event (organizer only) */
  async getEventCheckins(eventId: string, skip: number = 0, limit: number = 50): Promise<BookingListResponse> {
    return apiClient.get<BookingListResponse>(`/bookings/event/${eventId}/checkins?skip=${skip}&limit=${limit}`);
  }

  // --- Organizer QR Payment Management ---

  /** Get all pending QR payment bookings for the organizer's events */
  async getPendingQRBookings(): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/bookings/organizer/pending-qr');
  }

  /** Confirm a Cambodia QR payment as an organizer */
  async confirmQRPayment(bookingId: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/confirm-qr`);
  }

  /** Reject a Cambodia QR payment as an organizer */
  async rejectQRPayment(bookingId: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/reject-qr`);
  }
}

export const bookingService = new BookingService();
