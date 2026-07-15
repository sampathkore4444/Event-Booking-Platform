import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Event Booking Platform E2E tests.
 *
 * Requirements:
 * - Backend running at http://localhost:8000
 * - Frontend running at http://localhost:5173
 *
 * Run with:
 *   npx playwright test
 *   npx playwright test --ui        # Interactive UI mode
 *   npx playwright test --debug     # Debug mode
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
    ['json', { outputFile: 'e2e-report/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before tests (uncomment if Playwright should start it) */
  // webServer: [
  //   {
  //     command: 'cd ../backend && uvicorn app.main:app --host 0.0.0.0 --port 8000',
  //     url: 'http://localhost:8000/health',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000,
  //   },
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:5173',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000,
  //   },
  // ],
});
