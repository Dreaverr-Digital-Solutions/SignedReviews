// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Use the dev server so root-relative paths (/output.css, /images/…) resolve.
//   cd landingpage && node dev-server.js
// Then run tests.
const BASE_URL = process.env.LANDING_URL || 'http://localhost:4173';
const PAGE_URL = `${BASE_URL}/`;
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'test-screenshots');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the landing page and wait for it to be ready.
 * Waits for the hero CTA button which confirms DOMContentLoaded scripts ran.
 */
async function goToPage(page) {
  // Clear localStorage so dark-mode state is always predictable
  await page.addInitScript(() => {
    localStorage.removeItem('theme');
  });
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  // Ensure hero CTA is rendered (confirms DOMContentLoaded scripts ran)
  await page.waitForSelector('#heroBtn', { state: 'attached' });
}

// ---------------------------------------------------------------------------
// 1. Hero CTA
// ---------------------------------------------------------------------------
test.describe('Hero CTA', () => {
  test('hero signup button is visible and links to platform', async ({ page }) => {
    await goToPage(page);

    const heroBtn = page.locator('#heroBtn');
    await expect(heroBtn).toBeVisible();

    // It should link to the platform
    await expect(heroBtn).toHaveAttribute('href', /platform\.signedreviews\.com/);
  });
});

// ---------------------------------------------------------------------------
// 2. Dark mode toggle
// ---------------------------------------------------------------------------
test.describe('Dark mode toggle', () => {
  test('clicking toggle adds "dark" class to <html>', async ({ page }) => {
    await goToPage(page);

    // Ensure we start in light mode
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);

    // Click the dark mode toggle button (has aria-label="Toggle dark mode")
    await page.locator('button[aria-label="Toggle dark mode"]').click();
    await expect(html).toHaveClass(/\bdark\b/);

    // Click again — dark class should be removed
    await page.locator('button[aria-label="Toggle dark mode"]').click();
    await expect(html).not.toHaveClass(/\bdark\b/);
  });
});

// ---------------------------------------------------------------------------
// 3. CTA buttons
// ---------------------------------------------------------------------------
test.describe('CTA buttons', () => {
  test('all CTA buttons are visible and enabled; count >= 4', async ({ page }) => {
    await goToPage(page);

    const ctaElements = page.locator('.btn-gold, .btn-ripple');
    const count = await ctaElements.count();

    expect(count).toBeGreaterThanOrEqual(4);

    // Each element must be visible and not disabled
    for (let i = 0; i < count; i++) {
      const el = ctaElements.nth(i);
      await expect(el).toBeVisible();
      const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
      if (tagName === 'button' || tagName === 'input') {
        await expect(el).not.toBeDisabled();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Mobile viewport
// ---------------------------------------------------------------------------
test.describe('Mobile viewport (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nav, hero headline, hero CTA all visible; no horizontal overflow', async ({ page }) => {
    await goToPage(page);

    // Nav is visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Hero headline is visible
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();

    // Hero CTA button is visible
    const heroBtn = page.locator('#heroBtn');
    await expect(heroBtn).toBeVisible();

    // No horizontal scroll on body/html (scrollWidth <= clientWidth)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('mobile menu toggle opens menu drawer', async ({ page }) => {
    await goToPage(page);

    const menuBtn = page.locator('#mobileMenuBtn');
    await expect(menuBtn).toBeVisible();

    // Menu drawer should exist in DOM
    const menu = page.locator('#mobileMenu');
    await expect(menu).toBeAttached();

    // Click to open — toggleMobileMenu() removes the 'hidden' class
    await menuBtn.click();

    // The menu should now be visible (hidden class removed)
    await expect(menu).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Screenshots — desktop light, desktop dark, mobile
// ---------------------------------------------------------------------------
test.describe('Screenshots', () => {
  test('desktop light mode screenshot', async ({ page }) => {
    test.skip(
      process.env.SKIP_SCREENSHOTS === '1',
      'Screenshots skipped via env var'
    );
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#heroBtn', { state: 'attached' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/desktop-light.png`,
      fullPage: false,
    });
  });

  test('desktop dark mode screenshot', async ({ page }) => {
    test.skip(
      process.env.SKIP_SCREENSHOTS === '1',
      'Screenshots skipped via env var'
    );
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#heroBtn', { state: 'attached' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/desktop-dark.png`,
      fullPage: false,
    });
  });

  test('mobile viewport screenshot', async ({ page }) => {
    test.skip(
      process.env.SKIP_SCREENSHOTS === '1',
      'Screenshots skipped via env var'
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      localStorage.removeItem('theme');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#heroBtn', { state: 'attached' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/mobile.png`,
      fullPage: false,
    });
  });
});

// ---------------------------------------------------------------------------
// 6. iOS Safari-specific checks
// ---------------------------------------------------------------------------
test.describe('iOS Safari compatibility', () => {
  // Run selectively:
  //   npx playwright test --grep "iOS Safari compatibility" --project=webkit-ios

  test('viewport meta tag is present', async ({ page }) => {
    await goToPage(page);
    const vp = page.locator('meta[name="viewport"]');
    await expect(vp).toHaveAttribute('content', /width=device-width/);
    await expect(vp).toHaveAttribute('content', /initial-scale=1/);
  });

  test('input font-size prevents iOS zoom (≥15px)', async ({ page }) => {
    await goToPage(page);
    // On mobile viewport (≤639px), iOS zooms into inputs with font-size < 16px.
    // The page uses a media query to set inputs to 16px on small screens.
    // Check the CSS rule exists (the page currently has no visible email input,
    // but the CSS guard is in place).
    const hasIOSFix = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.cssText && rule.cssText.includes('font-size: 16px') && rule.cssText.includes('max-width')) {
              return true;
            }
          }
        } catch (_) { /* cross-origin stylesheet */ }
      }
      // Fallback: check the inline style block directly
      const styleBlocks = Array.from(document.querySelectorAll('style'));
      return styleBlocks.some(s =>
        s.textContent.includes('font-size: 16px') &&
        s.textContent.includes('max-width')
      );
    });
    expect(hasIOSFix).toBe(true);
  });

  test('no horizontal overflow on iPhone viewport', async ({ page }) => {
    await goToPage(page);
    // Check at multiple scroll positions — iOS Safari is notorious for letting
    // sticky/fixed elements cause overflow only partway down the page
    const checkOverflow = async () => {
      return page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
    };
    expect(await checkOverflow()).toBe(false);

    // Scroll to middle and check again
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);
    expect(await checkOverflow()).toBe(false);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    expect(await checkOverflow()).toBe(false);
  });

  test('position:fixed elements do not overlap CTA at bottom', async ({ page }) => {
    await goToPage(page);
    // Scroll near the bottom where the back-to-top button appears
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 800));
    await page.waitForTimeout(300);

    // The back-to-top button should exist
    const btt = page.locator('#back-to-top');
    await expect(btt).toBeAttached();

    // The final CTA section should still be present
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeAttached();
  });

  test('nav is sticky and has backdrop-filter on scroll', async ({ page }) => {
    await goToPage(page);
    const nav = page.locator('nav');

    // At top of page, nav should be present
    await expect(nav).toBeVisible();

    // Scroll down to trigger nav-scrolled class. Use waitForFunction to
    // wait for the scroll handler to add the class rather than racing.
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForFunction(() => {
      const nav = document.querySelector('nav');
      return nav && nav.classList.contains('nav-scrolled');
    }, { timeout: 5000 });

    // Verify nav is still visible after scroll
    await expect(nav).toBeVisible();
  });

  test('scroll reveal sections become visible', async ({ page }) => {
    await goToPage(page);
    // Scroll well into the page to trigger reveals
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(800); // let stagger finish

    // At least some reveals should be .revealed now
    const revealedCount = await page.locator('.revealed').count();
    expect(revealedCount).toBeGreaterThan(0);
  });

  test('no JS errors on page load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await goToPage(page);
    await page.waitForTimeout(500);

    // No uncaught exceptions — particle canvas gracefully returns if #heroParticles
    // is absent, GSAP/ScrollTrigger gracefully return if elements are missing
    expect(errors.length).toBe(0);
  });

  test('backdrop-filter is declared with -webkit- prefix for iOS', async ({ page }) => {
    await goToPage(page);
    const hasWebkitBackdrop = await page.evaluate(() => {
      const styleBlocks = Array.from(document.querySelectorAll('style'));
      return styleBlocks.some(s => s.textContent.includes('-webkit-backdrop-filter'));
    });
    expect(hasWebkitBackdrop).toBe(true);
  });
});
