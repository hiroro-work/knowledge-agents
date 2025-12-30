import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: 'html',
  expect: {
    timeout: 20000,
  },
  use: {
    baseURL: 'http://localhost:13000',
    trace: 'on-first-retry',
    timezoneId: 'Asia/Tokyo',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 15 Pro Max'] },
    },
  ],

  webServer: {
    command: 'pnpm start:test',
    url: 'http://localhost:13000',
    timeout: process.env.CI ? 120000 : 60000,
  },
});
