// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = 'file:///C:/python/SignedReviewsLandingpage/index.html';
const SCREENSHOTS_DIR = 'C:/python/SignedReviewsLandingpage/test-screenshots';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the landing page and wait for it to be ready.
 * We wait for the DOMContentLoaded event by checking that the hero form input
 * is present in the DOM, which means all inline scripts have run.
 */
async function goToPage(page) {
  // Clear localStorage so dark-mode state is always predictable
  await page.addInitScript(() => {
    localStorage.removeItem('theme');
  });
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  // Ensure hero email input is rendered (confirms DOMContentLoaded scripts ran)
  await page.waitForSelector('#heroEmail', { state: 'attached' });
}

// ---------------------------------------------------------------------------
// 1. Hero form — valid email submission
// ---------------------------------------------------------------------------
test.describe('Hero form', () => {
  test('valid email shows success state within 2s', async ({ page }) => {
    await goToPage(page);

    const emailInput = page.locator('#heroEmail');
    const submitBtn  = page.locator('#heroBtn');

    await emailInput.fill('test@example.com');
    await submitBtn.click();

    // Button text must become "✓ You're on the list!" within 2 seconds
    await expect(submitBtn).toHaveText("✓ You're on the list!", { timeout: 2000 });
  });

  // -------------------------------------------------------------------------
  // 2. Hero form — invalid email (empty submit triggers HTML5 validation)
  // -------------------------------------------------------------------------
  test('empty email triggers HTML5 :invalid state', async ({ page }) => {
    await goToPage(page);

    const emailInput = page.locator('#heroEmail');

    // Attempt to submit the form without filling the email.
    // We do NOT call .click() on the submit button directly because in
    // Playwright the button click submits the form and HTML5 validation
    // fires natively.  We can check the validity via JS.
    await page.locator('#heroBtn').click();

    // The input should be invalid according to the Constraint Validation API
    const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Dark mode toggle
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
// 4. Carousel autoplay + pause on hover
// ---------------------------------------------------------------------------
test.describe('Review carousel autoplay', () => {
  test('autoplay advances the carousel; hover pauses it', async ({ page }) => {
    await goToPage(page);

    const track = page.locator('#heroCarouselTrack');

    // Capture the initial transform value right after load (should be translateX(0)
    // since heroGoTo(0) sets it to 0).
    const initialTransform = await track.evaluate((el) => el.style.transform);

    // Wait for the carousel to advance at least once.
    // Autoplay interval is 3800 ms — wait up to 5s for the transform to change.
    await page.waitForFunction(
      (initialTx) => {
        const t = document.getElementById('heroCarouselTrack');
        return t && t.style.transform !== initialTx;
      },
      initialTransform,
      { timeout: 5000 }
    );

    // Record the transform after the first autoplay tick
    const afterFirstTick = await track.evaluate((el) => el.style.transform);
    expect(afterFirstTick).not.toBe(initialTransform);

    // Hover over the carousel parent to pause autoplay
    const carouselParent = page.locator('[onmouseenter="heroPause()"]');
    await carouselParent.hover();

    // Record transform immediately after hover
    const transformOnHover = await track.evaluate((el) => el.style.transform);

    // Wait 4 more seconds — if paused, transform should NOT change
    await page.waitForTimeout(4100);

    const transformAfterWait = await track.evaluate((el) => el.style.transform);
    expect(transformAfterWait).toBe(transformOnHover);
  });
});

// ---------------------------------------------------------------------------
// 5. All CTAs visible and clickable
// ---------------------------------------------------------------------------
test.describe('CTA buttons', () => {
  test('all .btn-gold and .btn-ripple buttons are visible and enabled; count >= 6', async ({ page }) => {
    await goToPage(page);

    const ctaElements = page.locator('.btn-gold, .btn-ripple');
    const count = await ctaElements.count();

    expect(count).toBeGreaterThanOrEqual(6);

    // Each element must be visible and not disabled
    for (let i = 0; i < count; i++) {
      const el = ctaElements.nth(i);
      await expect(el).toBeVisible();
      // Only actual button/input elements have a disabled property — links don't
      const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
      if (tagName === 'button' || tagName === 'input') {
        await expect(el).not.toBeDisabled();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Mobile viewport
// ---------------------------------------------------------------------------
test.describe('Mobile viewport (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nav, hero headline, hero form, carousel all visible; no horizontal overflow', async ({ page }) => {
    await goToPage(page);

    // Nav is visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Hero headline is visible
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();

    // Hero form email input is visible
    const emailInput = page.locator('#heroEmail');
    await expect(emailInput).toBeVisible();

    // Carousel outer container is visible
    const carouselOuter = page.locator('#heroCarouselOuter');
    await expect(carouselOuter).toBeVisible();

    // Carousel must not overflow the viewport horizontally
    const carouselBox = await carouselOuter.boundingBox();
    expect(carouselBox).not.toBeNull();
    if (carouselBox) {
      // right edge of carousel must be <= viewport width (375px)
      expect(carouselBox.x + carouselBox.width).toBeLessThanOrEqual(375 + 1); // +1 px tolerance
    }

    // No horizontal scroll on body/html (scrollWidth <= clientWidth)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Screenshots — desktop light, desktop dark, mobile
// ---------------------------------------------------------------------------
test.describe('Screenshots', () => {
  test('desktop light mode screenshot', async ({ page }) => {
    test.skip(
      process.env.SKIP_SCREENSHOTS === '1',
      'Screenshots skipped via env var'
    );
    // Explicitly add init script to keep light mode
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#heroEmail', { state: 'attached' });
    // Give animations a moment to settle
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
    await page.waitForSelector('#heroEmail', { state: 'attached' });
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
    await page.waitForSelector('#heroEmail', { state: 'attached' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/mobile.png`,
      fullPage: false,
    });
  });
});
