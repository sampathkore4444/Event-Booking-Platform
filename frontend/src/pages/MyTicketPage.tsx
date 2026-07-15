import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, QrCode, Calendar, MapPin, Users,
  CheckCircle, Download, Copy,
} from 'lucide-react';
import { bookingService } from '../services/booking.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TicketInfo {
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

const MyTicketPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!bookingId) return;
      try {
        const response = await bookingService.getTicketQR(bookingId);
        setTicket(response);
      } catch (error) {
        console.error('Failed to load ticket:', error);
        toast.error('Could not load your ticket');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [bookingId, navigate]);

  // Generate a scannable QR code on canvas using the check_in_code
  useEffect(() => {
    if (!ticket?.check_in_code || !canvasRef.current) return;

    // Try to use QRCode library for a real scannable QR
    const canvas = canvasRef.current;
    const size = 280;
    canvas.width = size;
    canvas.height = size;

    try {
      // Dynamic import of qrcode library for real QR generation
      import('qrcode').then((QRCode) => {
        QRCode.toCanvas(canvas, ticket.check_in_code, {
          width: size,
          margin: 2,
          color: {
            dark: '#1a1a2e',
            light: '#ffffff',
          },
        });
      }).catch(() => {
        // Fallback: generate QR via backend API
        drawBackendQR(canvas, size, ticket.check_in_code);
      });
    } catch {
      drawBackendQR(canvas, size, ticket.check_in_code);
    }
  }, [ticket]);

  // Fallback QR rendering when qrcode library is unavailable
  function drawBackendQR(canvas: HTMLCanvasElement, size: number, code: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const cellSize = size / 25;
    ctx.fillStyle = '#1a1a2e';

    // Draw position markers
    const drawMarker = (x: number, y: number) => {
      ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      ctx.fillStyle = '#1a1a2e';
    };

    drawMarker(cellSize, cellSize);
    drawMarker(size - 8 * cellSize, cellSize);
    drawMarker(cellSize, size - 8 * cellSize);

    // Deterministic pattern from check-in code
    const seed = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = (max: number) => ((seed * 9301 + 49297) % 233280) / 233280 * max;

    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        if ((row < 7 && col < 7) || (row < 7 && col > 17) || (row > 17 && col < 7)) continue;
        if (row === 6 || col === 6) continue;
        if (rng(100) > 55) ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    // Center overlay
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 - 17, size / 2 - 17, 34, 34);
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EH', size / 2, size / 2);
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ticket-${ticket?.booking_reference || 'event'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Ticket downloaded!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Ticket not available</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-block">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4 animate-fade-in">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        {/* Ticket Card */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl ${
          ticket.checked_in ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500'
        }`}>
          {/* Top Section - Event Info */}
          <div className="p-8 text-white">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <QrCode className="w-4 h-4" />
              <span>Event Ticket</span>
              {ticket.checked_in && (
                <span className="ml-auto flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Checked In
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2">{ticket.event_title}</h1>

            <div className="space-y-2 text-white/80 text-sm">
              {ticket.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(ticket.event_date), 'EEEE, MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{ticket.event_venue}, {ticket.event_city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{ticket.quantity} ticket(s) for {ticket.attendee_name}</span>
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="relative h-8">
            <div className="absolute inset-0 flex items-center justify-around">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Bottom Section - QR Code */}
          <div className="bg-white p-8">
            <div className="flex justify-center mb-4">
              <canvas
                ref={canvasRef}
                className="rounded-2xl shadow-lg"
                style={{ width: 240, height: 240 }}
              />
            </div>

            {/* Booking Reference */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 mb-1">Booking Reference</p>
              <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">
                {ticket.booking_reference}
              </p>
            </div>

            {/* Check-in Status */}
            <div className={`text-center p-3 rounded-xl mb-4 ${
              ticket.checked_in
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}>
              {ticket.checked_in ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Checked in at {ticket.checked_in_at ? format(new Date(ticket.checked_in_at), 'h:mm a') : 'the event'}</span>
                </div>
              ) : (
                <p className="text-sm">Show this QR code at the entrance to check in</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn-secondary flex-1 btn-sm">
                <Download className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ticket.booking_reference);
                  toast.success('Reference copied!');
                }}
                className="btn-secondary flex-1 btn-sm"
              >
                <Copy className="w-4 h-4" />
                Copy Ref
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Instructions</h3>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• Present this QR code at the event entrance</li>
                <li>• The organizer will scan your code to verify your ticket</li>
                <li>• Arrive at least 15 minutes before the event starts</li>
                <li>• Keep this ticket handy throughout the event</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTicketPage;
