/**
 * E2E Tests: Authentication Flows
 *
 * Tests user registration, login, logout, and authentication guards.
 * Requires both backend and frontend dev servers running.
 *
 * Run: npx playwright test e2e/auth.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  clickButton,
  gotoAndWait,
  waitForToast,
} from './helpers';

// ─── Registration ─────────────────────────────────────────────────────────

test.describe('Registration', () => {
  test('should register a new user and redirect to dashboard', async ({ page }) => {
    const user = createTestUser();

    await gotoAndWait(page, '/register');

    // Fill the registration form
    await page.fill('input[placeholder*="full name" i], input[name="full_name"]', user.fullName);
    await page.fill('input[placeholder*="username" i], input[name="username"]', user.username);
    await page.fill('input[type="email"], input[name="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    await clickButton(page, 'Create Account');

    // Should redirect to login or dashboard
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

    // If redirected to login, log in
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"], input[name="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await clickButton(page, 'Sign In');
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    }

    // Verify we're on the dashboard
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    const user = createTestUser();

    // Register first user via API
    const response = await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        username: user.username,
        full_name: user.fullName,
        password: user.password,
      }),
    });
    expect(response.ok).toBeTruthy();

    // Try registering the same email again
    await gotoAndWait(page, '/register');
    await page.fill('input[placeholder*="full name" i], input[name="full_name"]', user.fullName);
    await page.fill('input[placeholder*="username" i], input[name="username"]', `alt-${user.username}`);
    await page.fill('input[type="email"], input[name="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    await clickButton(page, 'Create Account');

    // Should see an error message
    await waitForToast(page, 'already exists');
  });

  test('should validate required fields', async ({ page }) => {
    await gotoAndWait(page, '/register');

    // Click submit without filling anything
    await clickButton(page, 'Create Account');

    // Should show validation errors
    await expect(page.locator('text=required').first().or(page.locator('input:invalid').first()))
      .toBeVisible({ timeout: 5000 });
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    const user = createTestUser();

    // Register via API
    await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        username: user.username,
        full_name: user.fullName,
        password: user.password,
      }),
    });

    await loginViaUI(page, user.email, user.password);

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Should see user info
    await expect(page.locator('text=' + user.fullName).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await gotoAndWait(page, '/login');

    await page.fill('input[type="email"], input[name="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    await clickButton(page, 'Sign In');

    await waitForToast(page, 'Invalid');
  });

  test('should redirect to login when accessing protected page', async ({ page }) => {
    await gotoAndWait(page, '/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('should log out and redirect to home', async ({ page }) => {
    const user = createTestUser();

    // Register and login
    await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        username: user.username,
        full_name: user.fullName,
        password: user.password,
      }),
    });

    await loginViaUI(page, user.email, user.password);
    await expect(page).toHaveURL(/dashboard/);

    // Click logout button
    const logoutButton = page.locator('button, a').filter({ hasText: /log\s*out|sign\s*out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/\/$|\/login/, { timeout: 10000 });
      // Should not be able to access dashboard anymore
      await gotoAndWait(page, '/dashboard');
      await expect(page).toHaveURL(/login/);
    }
  });
});
