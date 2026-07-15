import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Ticket, LayoutDashboard, Plus, Clock,
  CheckCircle, XCircle, Eye, Trash2, Users,
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'my-events'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | ''>('');

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
        } else if (isOrganizer) {
          const events = await eventService.getMyEvents();
          setMyEvents(events);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-gray-500 mt-1">
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
          <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
          <div className="text-sm text-gray-500">Total Bookings</div>
        </div>
        <div className="card p-5">
          <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-500">Confirmed</div>
        </div>
        <div className="card p-5">
          <Clock className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card p-5">
          <Calendar className="w-8 h-8 text-purple-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{myEvents.length}</div>
          <div className="text-sm text-gray-500">My Events</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'bookings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ticket className="w-4 h-4 inline mr-2" />
          My Bookings
        </button>
        {isOrganizer && (
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-6">Browse events and book your first experience</p>
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
                        <h3 className="font-semibold text-gray-900 mb-1">
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
                        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
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
