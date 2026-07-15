import { apiClient } from './api';

export interface CheckoutSession {
  url: string;
  session_id: string;
  payment_method: string;
}

export interface QRPaymentInfo {
  qr_base64: string;
  khqr_string: string;
  merchant_name: string;
  amount: number;
  currency: string;
  bill_number: string;
  instructions: string;
}

class PaymentService {
  /**
   * Create a Stripe Checkout Session for a booking.
   * For India: enables UPI. For Cambodia: use generateQRPayment instead.
   */
  async createCheckoutSession(bookingId: string): Promise<CheckoutSession> {
    return apiClient.post<CheckoutSession>('/payments/create-checkout-session', {
      booking_id: bookingId,
    });
  }

  /**
   * Generate a QR code payment for Cambodian events (Bakong/KHQR).
   */
  async generateQRPayment(bookingId: string): Promise<QRPaymentInfo> {
    return apiClient.post<QRPaymentInfo>('/payments/generate-qr', {
      booking_id: bookingId,
    });
  }

  /**
   * Redirect the user to Stripe Checkout.
   */
  redirectToCheckout(url: string): void {
    window.location.href = url;
  }

  /**
   * Determine if an event should use Cambodia QR payment based on its country.
   */
  isCambodiaEvent(country: string): boolean {
    const c = country.toUpperCase().trim();
    return c === 'CAMBODIA' || c === 'KH';
  }
}

export const paymentService = new PaymentService();
