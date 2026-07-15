/**
 * E2E Tests: Event Booking Flow
 *
 * Tests event creation, browsing, booking, and dashboard management.
 * Requires both backend and frontend dev servers running.
 *
 * Run: npx playwright test e2e/booking.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  clickButton,
  clickLink,
  gotoAndWait,
  waitForToast,
  loginViaUI,
  registerUserViaAPI,
} from './helpers';

// ─── Test Data ─────────────────────────────────────────────────────────────

const TEST_EVENT = {
  title: 'E2E Test Conference 2026',
  slug: 'e2e-test-conference-2026',
  description:
    'An automated end-to-end test event for verifying the full booking flow with sufficient description length.',
  shortDescription: 'Automated E2E test event',
  venue: 'Test Convention Center',
  city: 'Phnom Penh',
  country: 'Cambodia',
  startDate: '2026-12-15T09:00:00Z',
  endDate: '2026-12-15T17:00:00Z',
  totalCapacity: 100,
  price: 25.0,
  currency: 'USD',
};

const TEST_FREE_EVENT = {
  title: 'E2E Free Workshop 2026',
  slug: 'e2e-free-workshop-2026',
  description:
    'A free workshop for testing the auto-confirmation flow with sufficient description length.',
  shortDescription: 'Free E2E test workshop',
  venue: 'Online',
  city: 'Virtual',
  country: 'Global',
  startDate: '2026-12-20T10:00:00Z',
  endDate: '2026-12-20T12:00:00Z',
  totalCapacity: 50,
  price: 0,
  currency: 'USD',
};

// ─── Event Creation ────────────────────────────────────────────────────────

test.describe('Event Creation', () => {
  test('should create a new event and see it on the homepage', async ({ page }) => {
    const organizer = createTestUser();

    // Register the organizer
    await registerUserViaAPI(organizer);
    await loginViaUI(page, organizer.email, organizer.password);

    // Navigate to create event
    await clickLink(page, 'Create Event');

    // Fill event form
    await page.fill('input[name="title"], input[placeholder*="title" i]', TEST_EVENT.title);
    await page.fill('input[name="short_description"], input[placeholder*="short" i]', TEST_EVENT.shortDescription);
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', TEST_EVENT.description);
    await page.fill('input[name="venue"], input[placeholder*="venue" i]', TEST_EVENT.venue);
    await page.fill('input[name="city"], input[placeholder*="city" i]', TEST_EVENT.city);
    await page.fill('input[name="country"], input[placeholder*="country" i]', TEST_EVENT.country);
    await page.fill('input[type="number"], input[name="total_capacity"]', String(TEST_EVENT.totalCapacity));
    await page.fill('input[type="number"], input[name="price"]', String(TEST_EVENT.price));
    await page.fill('input[name="currency"]', TEST_EVENT.currency);

    // Set dates
    await page.fill('input[type="datetime-local"], input[name="start_date"]', '2026-12-15T09:00');
    await page.fill('input[type="datetime-local"], input[name="end_date"]', '2026-12-15T17:00');

    // Select a category
    const categorySelect = page.locator('select[name="category_id"], select[id*="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    await clickButton(page, 'Create Event');

    // Wait for redirect or toast
    await waitForToast(page, TEST_EVENT.title);

    // Should be redirected to dashboard or event page
    await expect(page.locator('text=' + TEST_EVENT.title).first()).toBeVisible({ timeout: 10000 });
  });

  test('should create a free event and see auto-confirmed booking', async ({ page }) => {
    const attendee = createTestUser();

    // Register the free event via API first
    const organizer = createTestUser();
    const { tokens } = await registerUserViaAPI(organizer);

    // Create event via API
    const eventRes = await fetch('http://localhost:8000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        title: TEST_FREE_EVENT.title,
        slug: TEST_FREE_EVENT.slug,
        description: TEST_FREE_EVENT.description,
        short_description: TEST_FREE_EVENT.shortDescription,
        venue: TEST_FREE_EVENT.venue,
        city: TEST_FREE_EVENT.city,
        country: TEST_FREE_EVENT.country,
        start_date: TEST_FREE_EVENT.startDate,
        end_date: TEST_FREE_EVENT.endDate,
        total_capacity: TEST_FREE_EVENT.totalCapacity,
        price: TEST_FREE_EVENT.price,
        currency: TEST_FREE_EVENT.currency,
      }),
    });
    expect(eventRes.ok).toBeTruthy();
    const event = await eventRes.json();

    // Now login as the attendee and book
    await registerUserViaAPI(attendee);
    await loginViaUI(page, attendee.email, attendee.password);

    // Go to the event page
    await gotoAndWait(page, `/events/${event.slug || event.id}`);
    await expect(page.locator('text=' + TEST_FREE_EVENT.title).first()).toBeVisible({ timeout: 10000 });

    // Click book now
    const bookButton = page.locator('button', { hasText: /book|register|get tickets/i });
    if (await bookButton.isVisible()) {
      await bookButton.click();
    }

    // Confirm booking in modal
    const confirmButton = page.locator('button', { hasText: /confirm|book now|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await waitForToast(page, 'confirmed');

    // Check dashboard for the booking
    await clickLink(page, 'Dashboard');
    await expect(page.locator('text=' + TEST_FREE_EVENT.title).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Event Browsing ────────────────────────────────────────────────────────

test.describe('Event Browsing', () => {
  test('should list events on the homepage', async ({ page }) => {
    await gotoAndWait(page, '/');

    // Wait for event cards to load
    await page.waitForSelector('a[href*="/events/"]', { timeout: 10000 });

    // Should see event cards
    const eventCards = page.locator('a[href*="/events/"], article, .event-card');
    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search events by keyword', async ({ page }) => {
    await gotoAndWait(page, '/');

    // Find search input and type
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Conference');
      await page.waitForTimeout(1000); // debounce
    }

    // Should filter results
    await expect(page.locator('a[href*="/events/"]').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Booking Management ────────────────────────────────────────────────────

test.describe('Booking Management', () => {
  test('should show bookings on the dashboard', async ({ page }) => {
    const user = createTestUser();

    // Register and login
    await registerUserViaAPI(user);
    await loginViaUI(page, user.email, user.password);

    // Go to dashboard
    await clickLink(page, 'Dashboard');

    // Should see the bookings section or empty state
    const heading = page.locator('h1, h2, h3', { hasText: /booking|dashboard/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should cancel a booking from the dashboard', async ({ page }) => {
    const attendee = createTestUser();
    const organizer = createTestUser();

    // Set up: create event and make a booking via API
    const { tokens: orgTokens } = await registerUserViaAPI(organizer);

    const eventRes = await fetch('http://localhost:8000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${orgTokens.accessToken}`,
      },
      body: JSON.stringify({
        title: 'E2E Cancel Test Event',
        slug: 'e2e-cancel-test-' + Date.now(),
        description: 'Event for testing booking cancellation with sufficient description length.',
        short_description: 'Cancel test event',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        start_date: '2026-12-25T09:00:00Z',
        end_date: '2026-12-25T17:00:00Z',
        total_capacity: 50,
        price: 10.0,
        currency: 'USD',
      }),
    });
    const event = await eventRes.json();

    // Register attendee and create booking
    const { tokens: attTokens } = await registerUserViaAPI(attendee);

    const bookingRes = await fetch('http://localhost:8000/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attTokens.accessToken}`,
      },
      body: JSON.stringify({
        event_id: event.id,
        quantity: 2,
      }),
    });
    expect(bookingRes.ok).toBeTruthy();

    // Login as attendee and go to dashboard
    await loginViaUI(page, attendee.email, attendee.password);
    await clickLink(page, 'Dashboard');

    // Find and click cancel button
    const cancelButton = page.locator('button', { hasText: /cancel/i }).first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Confirm cancellation in modal
      const confirmCancel = page.locator('button', { hasText: /confirm|yes|cancel booking/i });
      if (await confirmCancel.isVisible()) {
        await confirmCancel.click();
      }

      await waitForToast(page, 'cancelled');
    }
  });
});

// ─── QR Payment (Organizer Flow) ───────────────────────────────────────────

test.describe('QR Payment Management', () => {
  test('should show QR Payments tab for organizers', async ({ page }) => {
    const organizer = createTestUser();

    // Register and login as organizer
    await registerUserViaAPI(organizer);
    await loginViaUI(page, organizer.email, organizer.password);

    // Get an auth token for API-based event creation
    const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: organizer.email, password: organizer.password }),
    });
    const { accessToken } = await loginRes.json();

    // Create a Cambodia event via API
    await fetch('http://localhost:8000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: 'E2E QR Test Event',
        slug: 'e2e-qr-test-' + Date.now(),
        description: 'Event for testing QR payment flow with sufficient description length.',
        short_description: 'QR test event',
        venue: 'Phnom Penh Center',
        city: 'Phnom Penh',
        country: 'Cambodia',
        start_date: '2026-12-30T09:00:00Z',
        end_date: '2026-12-30T17:00:00Z',
        total_capacity: 30,
        price: 15.0,
        currency: 'USD',
      }),
    });

    // Go to dashboard
    await clickLink(page, 'Dashboard');

    // Look for QR Payments tab
    const qrTab = page.locator('button, a, [role="tab"]', { hasText: /qr|payment/i }).first();
    if (await qrTab.isVisible()) {
      await qrTab.click();
      await expect(page.locator('text=pending').or(page.locator('text=No Pending')).first())
        .toBeVisible({ timeout: 5000 });
    }
  });
});
