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

  // Generate a QR code on canvas using the check_in_code
  useEffect(() => {
    if (!ticket?.check_in_code || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const size = 280;
    canvas.width = size;
    canvas.height = size;

    drawQRCode(canvas, size, ticket.check_in_code);
  }, [ticket]);

  // Self-contained QR code generator — no external packages needed.
  // Encodes alphanumeric data into a QR Version 2 (25×25) matrix
  // with Reed-Solomon error correction (M-level, 16 EC codewords).
  function drawQRCode(canvas: HTMLCanvasElement, size: number, data: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const MODULE_COUNT = 25; // QR Version 2
    const cellSize = size / MODULE_COUNT;

    // ── Reed-Solomon error correction for QR (GF(256), M-level) ──
    // Generator polynomial for 16 EC codewords (M-level, Version 2)
    const gfExp = new Array(512);
    const gfLog = new Array(256);
    (() => {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        gfExp[i] = x;
        gfLog[x] = i;
        x = (x * 2) ^ (x >= 128 ? 0x11d : 0);
      }
      for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];
    })();

    function gfMul(a: number, b: number) {
      return a === 0 || b === 0 ? 0 : gfExp[gfLog[a] + gfLog[b]];
    }

    function rsEncode(msg: number[], ecLen: number): number[] {
      const gen = [1];
      for (let i = 0; i < ecLen; i++) {
        gen.push(0);
        for (let j = gen.length - 1; j > 0; j--) {
          gen[j] = gen[j - 1] ^ gfMul(gen[j], gfExp[i]);
        }
        gen[0] = gfMul(gen[0], gfExp[i]);
      }
      const res = [...msg];
      for (let i = 0; i < res.length; i++) {
        if (res[i] !== 0) {
          const lead = gfLog[res[i]];
          for (let j = 0; j < gen.length; j++) {
            res[i + j] ^= gfMul(gen[j], gfExp[lead]);
          }
        }
      }
      return res.slice(msg.length);
    }

    // ── Alphanumeric encoding ──
    const alphaMap: Record<string, number> = {};
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.split('').forEach((c, i) => { alphaMap[c] = i; });

    function encodeAlphanumeric(text: string): number[] {
      const bits: number[] = [];
      // Mode indicator: 0010 (alphanumeric)
      bits.push(0, 0, 1, 0);
      // Character count (9 bits for Version 2)
      const count = text.length;
      for (let i = 8; i >= 0; i--) bits.push((count >> i) & 1);

      for (let i = 0; i < text.length; i += 2) {
        if (i + 1 < text.length) {
          const val = alphaMap[text[i].toUpperCase()] * 45 + alphaMap[text[i + 1].toUpperCase()];
          for (let j = 10; j >= 0; j--) bits.push((val >> j) & 1);
        } else {
          const val = alphaMap[text[i].toUpperCase()];
          for (let j = 5; j >= 0; j--) bits.push((val >> j) & 1);
        }
      }

      // Terminator + pad to byte boundary
      for (let i = 0; i < 4; i++) bits.push(0);
      while (bits.length % 8 !== 0) bits.push(0);

      // Pad bytes
      const bytes: number[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
        bytes.push(byte);
      }
      // Version 2 M-level: 16 data codewords
      const targetLen = 16;
      const padPatterns = [0xec, 0x11];
      for (let i = bytes.length; i < targetLen; i++) {
        bytes.push(padPatterns[(i - bytes.length) % 2]);
      }
      return bytes.slice(0, targetLen);
    }

    // Clean input: uppercase alphanumeric only
    const cleanData = data.toUpperCase().replace(/[^0-9A-Z \$%*+\-\.\/:]/g, '').slice(0, 20) || 'TICKET';
    const dataCodewords = encodeAlphanumeric(cleanData);
    const ecCodewords = rsEncode(dataCodewords, 16);

    // ── Interleave data + EC codewords ──
    const allCodewords = [...dataCodewords, ...ecCodewords]; // 16 data + 16 EC = 32 codewords

    // ── Build 25×25 module matrix ──
    // 0 = white (light), 1 = black (dark)
    const modules: number[][] = Array.from({ length: MODULE_COUNT }, () => Array(MODULE_COUNT).fill(-1));

    // Position detection patterns (7×7)
    function placePattern(row: number, col: number) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const tr = row + r, tc = col + c;
          if (tr < 0 || tr >= MODULE_COUNT || tc < 0 || tc >= MODULE_COUNT) continue;
          if (r < 0 || r >= 7 || c < 0 || c >= 7) {
            // Separator (white)
            modules[tr][tc] = 0;
          } else {
            const dist = Math.max(Math.abs(r - 3), Math.abs(c - 3));
            modules[tr][tc] = dist % 2 === 0 ? 1 : 0;
          }
        }
      }
    }

    placePattern(0, 0);
    placePattern(0, 18);
    placePattern(18, 0);

    // Timing patterns
    for (let i = 8; i < 17; i++) { modules[6][i] = i % 2 === 0 ? 1 : 0; }
    for (let i = 8; i < 17; i++) { modules[i][6] = i % 2 === 0 ? 1 : 0; }

    // ── Place codeword bits into the matrix ──
    // QR Version 2 upward-then-downward zigzag from bottom-right
    let bitIdx = 0;
    for (let col = MODULE_COUNT - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5; // Skip timing column
      for (let row = MODULE_COUNT - 1; row >= 0; row--) {
        for (const c of [col, col - 1]) {
          if (c < 0 || modules[row][c] !== -1) continue;
          if (bitIdx < allCodewords.length * 8) {
            const byteIdx = Math.floor(bitIdx / 8);
            const bitPos = 7 - (bitIdx % 8);
            modules[row][c] = (allCodewords[byteIdx] >> bitPos) & 1;
            bitIdx++;
          }
        }
      }
      col -= 2;
      if (col < 0) break;
      for (let row = 0; row < MODULE_COUNT; row++) {
        for (const c of [col, col - 1]) {
          if (c < 0 || modules[row][c] !== -1) continue;
          if (bitIdx < allCodewords.length * 8) {
            const byteIdx = Math.floor(bitIdx / 8);
            const bitPos = 7 - (bitIdx % 8);
            modules[row][c] = (allCodewords[byteIdx] >> bitPos) & 1;
            bitIdx++;
          }
        }
      }
    }

    // ── Apply mask pattern 0 (reference) ──
    for (let row = 0; row < MODULE_COUNT; row++) {
      for (let col = 0; col < MODULE_COUNT; col++) {
        // Skip uninitialized cells; data cells (0/1) are masked below
        if (modules[row][col] === -1) continue;
        if (row < 9 && col < 9) continue;  // Keep format area
        if (row < 9 && col > 16) continue;
        if (row > 16 && col < 9) continue;
        if (row === 6 || col === 6) continue;
        if ((row + col) % 2 === 0) modules[row][col] = modules[row][col] === 1 ? 0 : 1;
      }
    }

    // ── Format info: M-level, mask 0 → 5DB0h (binary 0101 1101 1011 0000) ──
    const formatBits = '0101110110110000'.split('').map(Number);
    const fmtPositions = [
      // Top-right horizontal
      ...[0,1,2,3,4,5,7,8].map(c => ({ r: 8, c })),
      // Bottom-left vertical
      ...[0,1,2,3,4,5,7,8].map(r => ({ r, c: 8 })),
    ];
    fmtPositions.forEach(({ r, c }, i) => {
      if (i < formatBits.length) modules[r][c] = formatBits[i];
    });
    // Dark module
    modules[17][8] = 1;

    // ── Render ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < MODULE_COUNT; row++) {
      for (let col = 0; col < MODULE_COUNT; col++) {
        if (modules[row][col]) {
          ctx.fillRect(col * cellSize, row * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }
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
