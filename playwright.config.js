// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PAGE_URL = path.resolve(__dirname, 'index.html');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: PAGE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // ── Desktop browsers ──────────────────────────────────────────
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 800 },
      },
    },

    // ── Mobile browsers ───────────────────────────────────────────
    {
      name: 'chromium-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        deviceScaleFactor: 2,
      },
    },
    // iOS Safari on iPhone 15 (390×844 is the logical resolution; iOS Safari
    // renders at 3× devicePixelRatio but the CSS viewport is 390×844).
    {
      name: 'webkit-ios',
      use: {
        ...devices['iPhone 15'],
        // isMobile + hasTouch + WebKit engine = closest local equivalent to real iOS Safari
      },
    },
    // iOS Safari on iPad
    {
      name: 'webkit-ios-tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
  ],
});
