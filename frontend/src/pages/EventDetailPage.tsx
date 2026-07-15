import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Clock, Users, DollarSign, Tag,
  ArrowLeft, Share2, CheckCircle, XCircle, AlertCircle,
  ExternalLink, Globe,
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { useAuth } from '../hooks/useAuth';
import type { Event } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PaymentQRModal from '../components/PaymentQRModal';

const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPaymentInfo, setQrPaymentInfo] = useState<{
    qr_base64: string;
    amount: number;
    currency: string;
    bill_number: string;
    merchant_name: string;
    instructions: string;
  } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (slug) {
          const data = await eventService.getEventBySlug(slug);
          setEvent(data);
        }
      } catch (error) {
        console.error('Failed to fetch event:', error);
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [slug, navigate]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!event) return;

    setIsBooking(true);
    try {
      // Step 1: Create the booking
      const booking = await bookingService.createBooking({
        event_id: event.id,
        quantity,
      });

      // Step 2: If the event is free, done — redirect to dashboard
      if (event.is_free) {
        toast.success('Free booking confirmed!');
        setShowBookingModal(false);
        navigate('/dashboard');
        return;
      }

      const isCambodia = paymentService.isCambodiaEvent(event.country);

      // Step 3a: Cambodia events — show QR code for Bakong payment
      if (isCambodia) {
        const qrInfo = await paymentService.generateQRPayment(booking.id);
        setQrPaymentInfo({
          qr_base64: qrInfo.qr_base64,
          amount: qrInfo.amount,
          currency: qrInfo.currency,
          bill_number: qrInfo.bill_number,
          merchant_name: qrInfo.merchant_name,
          instructions: qrInfo.instructions,
        });
        setShowBookingModal(false);
        setShowQRModal(true);
        return;
      }

      // Step 3b: All other countries (India gets UPI, rest get card) — Stripe Checkout
      const checkout = await paymentService.createCheckoutSession(booking.id);
      const methodLabel = checkout.payment_method === 'stripe_upi' ? 'UPI' : 'Stripe';
      toast.success(`Redirecting to ${methodLabel} payment...`);
      setShowBookingModal(false);

      setTimeout(() => {
        paymentService.redirectToCheckout(checkout.url);
      }, 800);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Event not found</h2>
      </div>
    );
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isSoldOut = event.is_full;
  const isFree = event.is_free;
  const canBook = event.status === 'published' && !isSoldOut;
  const isOrganizer = user?.id === event.organizer_id;

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 lg:h-96 gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-24 h-24 text-white/20" />
        </div>

        {/* Back Button */}
        <Link
          to="/events"
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        {/* Event Status Badge */}
        <div className="absolute top-6 right-6 flex gap-2">
          {isFree && <span className="badge bg-green-500 text-white">Free Event</span>}
          {event.is_featured && <span className="badge bg-accent-500 text-white">Featured</span>}
          {isSoldOut && <span className="badge bg-red-500 text-white">Sold Out</span>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              {/* Title & Meta */}
              <div className="mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                  {event.category && (
                    <span className="badge-purple">{event.category.name}</span>
                  )}
                  <span className={`badge ${
                    event.status === 'published' ? 'badge-green' :
                    event.status === 'cancelled' ? 'badge-red' : 'badge-gray'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>

                <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}, {event.city}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Location</h4>
                    <p className="text-sm text-gray-600">
                      {event.venue}
                      {event.address && <><br />{event.address}</>}
                      <br />{event.city}, {event.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-brand-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Capacity</h4>
                    <p className="text-sm text-gray-600">
                      {event.available_tickets} / {event.total_capacity} available
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-brand-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Price</h4>
                    <p className="text-sm text-gray-600">
                      {isFree ? 'Free' : `$${event.price.toFixed(2)} per ticket`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-brand-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Type</h4>
                    <p className="text-sm text-gray-600">
                      {event.is_virtual ? 'Virtual Event' : 'In-Person Event'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-6 space-y-6">
              {/* Price */}
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="text-4xl font-bold text-gray-900">
                  {isFree ? 'Free' : `$${event.price.toFixed(2)}`}
                </div>
                {!isFree && <p className="text-sm text-gray-500 mt-1">per ticket</p>}
              </div>

              {/* Event Status */}
              <div className="space-y-3">
                {canBook ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Bookings Open
                    </div>

                    {/* Quantity Selector */}
                    <div>
                      <label className="label">Tickets</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(event.available_tickets, quantity + 1))}
                          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="btn-primary w-full py-4 text-base"
                      disabled={isSoldOut}
                    >
                      {isOrganizer ? 'Manage Event' : 'Book Now'}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      {event.available_tickets} tickets remaining
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {isSoldOut ? 'Sold Out' : 'Bookings Closed'}
                    </p>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900 font-medium">{format(startDate, 'MMM d, yyyy')}</p>
                    <p className="text-gray-500">{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900 font-medium">{event.venue}</p>
                    <p className="text-gray-500">{event.city}, {event.country}</p>
                  </div>
                </div>
                {event.is_virtual && event.virtual_link && (
                  <div className="flex items-center gap-3 text-sm">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a href={event.virtual_link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                      Join Virtually
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900 font-medium">{event.available_tickets} / {event.total_capacity}</p>
                    <p className="text-gray-500">tickets available</p>
                  </div>
                </div>
              </div>

              {/* Share */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied!');
                }}
                className="btn-secondary w-full btn-sm"
              >
                <Share2 className="w-4 h-4" />
                Share Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookingModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
              Confirm Booking
            </h3>
            <p className="text-gray-500 mb-6">{event?.title}</p>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tickets</span>
                <span className="font-medium">{quantity} x {isFree ? 'Free' : `$${event?.price.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{format(startDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  {isFree ? 'Free' : `$${(event?.price || 0) * quantity}`}
                </span>
              </div>

              {/* Show payment method hint for non-free events */}
              {!isFree && event && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  {paymentService.isCambodiaEvent(event.country) ? (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Cambodia:</span> Pay via Bakong QR code
                    </p>
                  ) : event.country.toUpperCase() === 'INDIA' || event.country.toUpperCase() === 'IN' ? (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">India:</span> Pay via UPI / Card
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Pay securely via Stripe
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="btn-primary flex-1"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Payment Modal (Cambodia) */}
      {showQRModal && qrPaymentInfo && (
        <PaymentQRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            navigate('/dashboard');
          }}
          qrBase64={qrPaymentInfo.qr_base64}
          amount={qrPaymentInfo.amount}
          currency={qrPaymentInfo.currency}
          billNumber={qrPaymentInfo.bill_number}
          merchantName={qrPaymentInfo.merchant_name}
          instructions={qrPaymentInfo.instructions}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
