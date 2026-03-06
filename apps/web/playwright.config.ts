import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — TalentForge E2E
 * Tests run against production URL by default.
 * Override with BASE_URL env var for local testing.
 */
const baseURL = process.env.BASE_URL || 'https://web-eight-rho-84.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
