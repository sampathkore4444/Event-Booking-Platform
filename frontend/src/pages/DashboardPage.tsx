import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Ticket, LayoutDashboard, Plus, Clock,
  CheckCircle, XCircle, Eye, Trash2, Users,
  Smartphone, QrCode,
} from 'lucide-react';
import { bookingService } from '../services/booking.service';
import { eventService } from '../services/event.service';
import { useAuth } from '../hooks/useAuth';
import type { Booking, Event, BookingStatus } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
  refunded: 'badge-gray',
  completed: 'badge-blue',
  no_show: 'badge-gray',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isOrganizer, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'my-events' | 'qr-payments'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | ''>('');
  const [qrBookings, setQrBookings] = useState<Booking[]>([]);
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);

  // Check for payment success/cancellation from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      const ref = params.get('booking');
      toast.success(
        ref ? `Payment successful! Booking ${ref} confirmed.` : 'Payment successful! Booking confirmed.',
        { duration: 6000 }
      );
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard');
    } else if (payment === 'cancelled') {
      toast.error('Payment was cancelled. You can try again.', { duration: 5000 });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'bookings') {
          const response = await bookingService.getMyBookings({
            ...(bookingFilter ? { status: bookingFilter as BookingStatus } : {}),
          });
          setBookings(response.bookings);
        } else if (activeTab === 'my-events' && isOrganizer) {
          const events = await eventService.getMyEvents();
          setMyEvents(events);
        } else if (activeTab === 'qr-payments' && isOrganizer) {
          const pending = await bookingService.getPendingQRBookings();
          setQrBookings(pending);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, bookingFilter, isOrganizer]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled');
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const handleConfirmQR = async (bookingId: string) => {
    setIsConfirmingId(bookingId);
    try {
      await bookingService.confirmQRPayment(bookingId);
      toast.success('QR payment confirmed! Booking is now active.');
      setQrBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to confirm payment');
    } finally {
      setIsConfirmingId(null);
    }
  };

  const handleRejectQR = async (bookingId: string) => {
    setIsConfirmingId(bookingId);
    try {
      await bookingService.rejectQRPayment(bookingId);
      toast.success('QR payment rejected. Tickets returned to pool.');
      setQrBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to reject payment');
    } finally {
      setIsConfirmingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </p>
        </div>
        <Link to="/events/create" className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <Ticket className="w-8 h-8 text-brand-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</div>
        </div>
        <div className="card p-5">
          <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Confirmed</div>
        </div>
        <div className="card p-5">
          <Clock className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </div>
        <div className="card p-5">
          <Calendar className="w-8 h-8 text-purple-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{myEvents.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">My Events</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'bookings'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Ticket className="w-4 h-4 inline mr-2" />
          My Bookings
        </button>
        {isOrganizer && (
          <>
            <button
              onClick={() => setActiveTab('my-events')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'my-events'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              My Events
            </button>
            <button
              onClick={() => setActiveTab('qr-payments')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'qr-payments'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Payments
              {qrBookings.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {qrBookings.length}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === 'bookings' ? (
        <div>
          {/* Booking Filters */}
          <div className="flex gap-2 mb-6">
            {['', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setBookingFilter(status as BookingStatus | '')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  bookingFilter === status
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Browse events and book your first experience</p>
              <Link to="/events" className="btn-primary">
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {booking.event?.title || 'Event'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" />
                            {booking.quantity} ticket(s)
                          </span>
                          <span>
                            ${booking.total_price.toFixed(2)}
                          </span>
                          <span className={statusColors[booking.status] || 'badge-gray'}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Booked {format(new Date(booking.booked_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.event && (
                        <Link
                          to={`/events/${booking.event.slug}`}
                          className="btn-ghost btn-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'qr-payments' ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pending Cambodia QR Payments</h2>
            <span className="badge bg-emerald-100 text-emerald-700">
              {qrBookings.length} pending
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : qrBookings.length === 0 ? (
            <div className="text-center py-16">
              <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending QR payments</h3>
              <p className="text-gray-500 mb-6">
                When attendees book tickets for your Cambodia events, their QR payments will appear here for you to confirm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrBookings.map((booking) => (
                <div key={booking.id} className="card p-6 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {booking.event?.title || 'Event'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {booking.user?.full_name || 'Attendee'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" />
                            {booking.quantity} ticket(s)
                          </span>
                          <span>
                            ${booking.total_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="badge-gray text-xs">
                            Ref: {booking.booking_reference}
                          </span>
                          <span className="badge-yellow text-xs">
                            Awaiting confirmation
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Booked {format(new Date(booking.booked_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConfirmQR(booking.id)}
                        disabled={isConfirmingId === booking.id}
                        className="btn-primary btn-sm"
                      >
                        {isConfirmingId === booking.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {isConfirmingId === booking.id ? 'Confirming...' : 'Confirm Payment'}
                      </button>
                      <button
                        onClick={() => handleRejectQR(booking.id)}
                        disabled={isConfirmingId === booking.id}
                        className="btn-ghost btn-sm text-red-500 hover:text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : myEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events created</h3>
              <p className="text-gray-500 mb-6">Create your first event to get started</p>
              <Link to="/events/create" className="btn-primary">
                Create Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myEvents.map((event) => (
                <div key={event.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.available_tickets}/{event.total_capacity}
                          </span>
                          <span>
                            ${event.price.toFixed(2)}
                          </span>
                          <span className={`badge ${
                            event.status === 'published' ? 'badge-green' :
                            event.status === 'draft' ? 'badge-yellow' :
                            event.status === 'cancelled' ? 'badge-red' : 'badge-gray'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/events/${event.slug}`}
                        className="btn-ghost btn-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {(isAdmin || event.status === 'draft') && (
                        <button
                          onClick={async () => {
                            try {
                              await eventService.publishEvent(event.id);
                              toast.success('Event published!');
                              const events = await eventService.getMyEvents();
                              setMyEvents(events);
                            } catch (error: unknown) {
                              const err = error as { response?: { data?: { detail?: string } } };
                              toast.error(err?.response?.data?.detail || 'Failed to publish');
                            }
                          }}
                          className="btn-primary btn-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
