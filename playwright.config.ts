import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: 'html',
  expect: {
    timeout: 20000,
    toHaveScreenshot: {
      maxDiffPixelRatio: process.env.CI ? 0.05 : 0.01,
      animations: 'disabled',
      threshold: 0.2,
      scale: 'css',
    },
  },
  snapshotDir: './docs/screenshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',
  updateSnapshots: 'missing',
  use: {
    baseURL: 'http://localhost:13000',
    trace: 'on-first-retry',
    timezoneId: 'Asia/Tokyo',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 15 Pro Max'] },
    },
  ],

  webServer: {
    command: 'pnpm start:test',
    url: 'http://localhost:13000',
    timeout: process.env.CI ? 120000 : 60000,
  },
});
