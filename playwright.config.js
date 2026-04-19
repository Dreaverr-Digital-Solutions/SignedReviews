// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PAGE_URL = 'file:///C:/python/SignedReviewsLandingpage/index.html';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: PAGE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // Disable animations in tests to speed things up (overridden per-test where needed)
    launchOptions: {
      args: [],
    },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        // Explicitly use Chromium (only browser installed) with a mobile viewport.
        // We do NOT spread devices['iPhone 13'] because that preset picks WebKit.
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        deviceScaleFactor: 2,
      },
    },
  ],
});
