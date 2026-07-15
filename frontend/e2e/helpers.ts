/**
 * Helper utilities for Event Booking Platform E2E tests.
 *
 * Provides test data, API helper functions, and common page interactions
 * used across multiple test files.
 */

import { Page, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// ─── Test Data ─────────────────────────────────────────────────────────────

/** Generate a unique test user for each test run (avoids conflicts). */
export function createTestUser() {
  const id = uuidv4().slice(0, 8);
  return {
    email: `e2e-user-${id}@test.com`,
    username: `e2euser-${id}`,
    fullName: `E2E Test User ${id}`,
    password: 'TestPass123!',
  };
}

export interface TestUser {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── API Helpers (direct HTTP, bypasses UI for setup/teardown) ────────────

const API_BASE = 'http://localhost:8000/api/v1';

/**
 * Register a test user via the API.
 * Returns the user data and auth tokens.
 */
export async function registerUserViaAPI(user: TestUser) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      username: user.username,
      full_name: user.fullName,
      password: user.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Registration failed: ${JSON.stringify(error)}`);
  }

  const userData = await response.json();

  // Login to get tokens
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  const tokens: AuthTokens = await loginRes.json();
  return { user: userData, tokens };
}

/**
 * Delete a test user via the admin API.
 * Requires admin authentication.
 */
export async function deleteUserViaAPI(userId: string, adminToken: string) {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  });
  return response.ok;
}

/**
 * Get admin auth tokens using the default admin account.
 */
export async function getAdminTokens() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@eventbooking.com',
      password: 'Admin123!@#',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get admin tokens');
  }

  return response.json() as Promise<AuthTokens>;
}

// ─── UI Interaction Helpers ───────────────────────────────────────────────

/**
 * Fill a form field by its label text.
 * Uses the common pattern of label → input association.
 */
export async function fillByLabel(page: Page, label: string, value: string) {
  // Try label → input association first
  const labelEl = page.locator('label', { hasText: label });
  const forAttr = await labelEl.getAttribute('for');

  if (forAttr) {
    await page.locator(`#${forAttr}`).fill(value);
  } else {
    // Fallback: find input near the label
    const input = labelEl.locator('..').locator('input, textarea, select').first();
    await input.fill(value);
  }
}

/**
 * Click a button by its visible text (case-insensitive, partial match).
 */
export async function clickButton(page: Page, text: string) {
  await page.locator('button', { hasText: new RegExp(text, 'i') }).click();
}

/**
 * Click a link by its visible text.
 */
export async function clickLink(page: Page, text: string) {
  await page.locator('a', { hasText: new RegExp(text, 'i') }).click();
}

/**
 * Wait for a toast notification to appear and disappear.
 */
export async function waitForToast(page: Page, text?: string) {
  if (text) {
    await expect(page.locator('text=' + text).first()).toBeVisible({ timeout: 5000 });
  }
  // Wait for toast to disappear
  await page.waitForTimeout(2000);
}

/**
 * Navigate to a page and wait for it to load.
 */
export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Log in a user via the UI login form.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await gotoAndWait(page, '/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await clickButton(page, 'Sign In');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}
