// @ts-check
/**
 * The first-party analytics tracker (analytics/tracker.js, inlined by build.js), run in a real
 * browser against the built site. dist/ is served as https://signedreviews.com (the tracker only
 * runs there) and beacons to /api/e are captured instead of sent.
 *
 * The tracker deliberately sends nothing when navigator.webdriver is true, so this test overrides
 * that property inside its own browser context. The shipped tracker has no bypass.
 *
 *   node build.js && npx playwright test tests/analytics-tracker.spec.js --project=chromium-desktop
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };

test.skip(!fs.existsSync(path.join(DIST, 'index.html')), 'run node build.js first');

/** Serve dist/ as signedreviews.com; capture beacons; stub every other origin. */
async function site(context, { webdriver = false, init = '', country = 'US', requests = [] } = {}) {
  const beacons = [];
  await context.addInitScript(`Object.defineProperty(navigator, 'webdriver', { get: () => ${webdriver} });${init}`);
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    requests.push(url.hostname === 'signedreviews.com' ? url.pathname : url.href);
    if (url.hostname !== 'signedreviews.com') return route.fulfill({ status: 204, body: '' });
    // Cloudflare's trace endpoint: the consent gate reads the visitor's country from it
    if (url.pathname === '/cdn-cgi/trace') return route.fulfill({ status: 200, body: `fl=1
loc=${country}
`, headers: { 'content-type': 'text/plain' } });
    if (url.pathname === '/api/e') {
      try {
        beacons.push(JSON.parse(req.postData() || 'null'));
      } catch (_) {}
      return route.fulfill({ status: 204, body: '' });
    }
    let file = path.join(DIST, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' } });
  });
  return beacons;
}

const waitFor = async (beacons, pred, ms = 5000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const hit = beacons.find(pred);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 50));
  }
  return undefined;
};

test('page view, sign-up conversion click, engaged time, demo event', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const beacons = await site(context);
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/');

  const pv = await waitFor(beacons, (b) => b.t === 'pv');
  expect(pv).toMatchObject({ u: '/', nv: 1 });
  expect(pv.v).toMatch(/^[a-z0-9]{8,40}$/);
  expect(pv.s).toMatch(/^[a-z0-9]{8,40}$/);

  // demo video: the page's own dialog script reports demo_open through window.fpa
  await page.click('#demoOpen');
  expect(await waitFor(beacons, (b) => b.t === 'ev' && b.n === 'demo_open')).toBeTruthy();
  await page.keyboard.press('Escape');

  // the hero sign-up CTA is a conversion (data-conversion="signup"); keep the page from navigating
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), { once: true }));
  await page.click('a[data-cta="hero-signup"]');
  const click = await waitFor(beacons, (b) => b.t === 'click' && b.k === 'signup');
  expect(click).toMatchObject({ ld: 1, x: 'hero-signup', s: pv.s, p: pv.p });

  // engaged time and scroll arrive when the page is hidden
  await page.mouse.move(200, 200);
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  });
  const end = await waitFor(beacons, (b) => b.t === 'end');
  expect(end.en).toBeGreaterThanOrEqual(1000);
  expect(end.ed).toBe(end.en);
  expect(end.sc).toBeGreaterThan(0);
  expect(typeof end.vt).toBe('object');
  await context.close();
});

test('pricing pageview goal is sent once per session; register links are sign-ups', async ({ browser }) => {
  const context = await browser.newContext();
  const beacons = await site(context);
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/pricing/');
  const first = await waitFor(beacons, (b) => b.t === 'pv' && b.u === '/pricing/');
  expect(first.g).toBe('pricing');

  await page.reload();
  await waitFor(beacons, (b) => b.t === 'pv' && b.p !== first.p);
  const second = beacons.filter((b) => b.t === 'pv' && b.u === '/pricing/')[1];
  expect(second.s).toBe(first.s);
  expect(second.g).toBeUndefined();
  expect(second.nv).toBe(0);

  // a plain Markdown link to /register counts as a sign-up without any markup in the source
  // (build.js routes it through /go/signup and marks it data-conversion="signup")
  await page.goto('https://signedreviews.com/features/');
  await waitFor(beacons, (b) => b.t === 'pv' && b.u === '/features/');
  const reg = page.locator('a[href^="/go/signup?c=link"]').first();
  expect(await reg.count()).toBe(1);
  {
    await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), { once: true }));
    await reg.click();
    expect(await waitFor(beacons, (b) => b.t === 'click' && b.k === 'signup')).toMatchObject({ ld: 1 });
  }
  // a Log in link is kind "platform", not a conversion
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), { once: true }));
  await page.locator('a[data-cta="login"]').first().click({ force: true });
  expect(await waitFor(beacons, (b) => b.t === 'click' && b.x === 'login')).toMatchObject({ k: 'platform', ld: 0 });
  await context.close();
});

test('opt-out, Global Privacy Control and automated browsers send nothing', async ({ browser }) => {
  // ?sr-track=off stores the opt-out; later pages send nothing until ?sr-track=on
  let context = await browser.newContext();
  let beacons = await site(context);
  let page = await context.newPage();
  await page.goto('https://signedreviews.com/privacy/?sr-track=off');
  await page.goto('https://signedreviews.com/pricing/');
  await page.waitForTimeout(800);
  expect(beacons).toHaveLength(0);
  expect(await page.evaluate(() => localStorage.getItem('sr_ignore'))).toBe('1');
  expect(await page.evaluate(() => document.cookie)).toBe('');
  await page.goto('https://signedreviews.com/privacy/?sr-track=on');
  expect(await waitFor(beacons, (b) => b.t === 'pv')).toBeTruthy();
  await context.close();

  context = await browser.newContext();
  beacons = await site(context, { init: "Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });" });
  page = await context.newPage();
  await page.goto('https://signedreviews.com/');
  await page.waitForTimeout(800);
  expect(beacons).toHaveLength(0);
  await context.close();

  context = await browser.newContext();
  beacons = await site(context, { webdriver: true });
  page = await context.newPage();
  await page.goto('https://signedreviews.com/');
  await page.waitForTimeout(800);
  expect(beacons).toHaveLength(0);
  await context.close();
});

test('rage clicks: three fast clicks on one element, the third flagged, no more after', async ({ browser }) => {
  const context = await browser.newContext();
  const beacons = await site(context);
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/pricing/');
  await waitFor(beacons, (b) => b.t === 'pv');
  const target = page.locator('h1').first();
  await page.evaluate(() => {
    const h = document.querySelector('h1');
    h.setAttribute('role', 'button');
  });
  for (let i = 0; i < 5; i++) await target.click({ delay: 10 });
  await page.waitForTimeout(500);
  const clicks = beacons.filter((b) => b.t === 'click');
  expect(clicks).toHaveLength(3);
  expect(clicks.map((c) => c.rg)).toEqual([0, 0, 1]);
  await context.close();
});

test('fake review checker: checker_run and checker_result, never the text', async ({ browser }) => {
  const context = await browser.newContext();
  const beacons = await site(context);
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/tools/fake-review-checker/');
  await waitFor(beacons, (b) => b.t === 'pv');
  const text = 'I ordered the blue model in March and it arrived after four days. The battery lasts about two days, but the case scratches easily, which I did not expect from the photos online.';
  await page.fill('#frc-input', text);
  await page.click('#frc-run');
  const run = await waitFor(beacons, (b) => b.t === 'ev' && b.n === 'checker_run');
  expect(run).toMatchObject({ pr: { has_url: 'no' } });
  // the API is stubbed with an empty 204, so the cross-check reports a failure
  expect(await waitFor(beacons, (b) => b.t === 'ev' && b.n === 'checker_result')).toMatchObject({ pr: { ok: 'no' } });
  expect(JSON.stringify(beacons)).not.toContain('battery');
  await context.close();
});

test('EU visitor: banner first, nothing sent or stored until Accept', async ({ browser }) => {
  const context = await browser.newContext();
  const requests = [];
  const beacons = await site(context, { country: 'DE', requests });
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/pricing/');
  await expect(page.locator('#sr-consent')).toBeVisible();
  await page.waitForTimeout(800);
  expect(beacons).toHaveLength(0);
  expect(requests.some((r) => r.startsWith('/ph/'))).toBe(false); // PostHog never initialised
  expect(requests.filter((r) => /^https?:/.test(r))).toEqual([]); // no third-party request at all
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys.filter((k) => !['sr_geo'].includes(k))).toEqual([]); // only the country, for the banner
  expect(await page.evaluate(() => document.cookie)).toBe('');

  await page.click('#sr-consent button:has-text("Accept")');
  expect(await waitFor(beacons, (b) => b.t === 'pv' && b.u === '/pricing/')).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('sr_consent'))).toBe('granted');
  await waitFor([requests], () => requests.some((r) => r.startsWith('/ph/static/')), 3000);
  expect(requests.some((r) => r.startsWith('/ph/static/'))).toBe(true); // PostHog loads only now

  await page.reload();
  await expect(page.locator('#sr-consent')).toHaveCount(0);
  expect(await waitFor(beacons, (b) => b.t === 'pv' && b !== beacons[0])).toBeTruthy();
  await context.close();
});

test('EU visitor who declines: nothing runs; Privacy choices reopens the banner', async ({ browser }) => {
  const context = await browser.newContext();
  const requests = [];
  const beacons = await site(context, { country: 'FR', requests });
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/');
  await page.click('#sr-consent button:has-text("Decline")');
  await page.goto('https://signedreviews.com/features/');
  await page.waitForTimeout(800);
  await expect(page.locator('#sr-consent')).toHaveCount(0);
  expect(beacons).toHaveLength(0);
  expect(requests.some((r) => r.startsWith('/ph/'))).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('sr_vid'))).toBeNull();
  await page.click('button:has-text("Privacy choices")');
  await expect(page.locator('#sr-consent')).toBeVisible();
  await context.close();
});

test('outside the consent regions: runs by default; declining later stops it and clears its ids', async ({ browser }) => {
  const context = await browser.newContext();
  const beacons = await site(context, { country: 'US' });
  const page = await context.newPage();
  await page.goto('https://signedreviews.com/pricing/');
  await expect(page.locator('#sr-consent')).toHaveCount(0);
  expect(await waitFor(beacons, (b) => b.t === 'pv')).toBeTruthy();
  await page.click('button:has-text("Privacy choices")');
  await page.click('#sr-consent button:has-text("Decline")');
  expect(await page.evaluate(() => localStorage.getItem('sr_vid'))).toBeNull();
  const before = beacons.length;
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), { once: true }));
  await page.locator('a[data-cta="login"]').first().click({ force: true });
  await page.waitForTimeout(500);
  expect(beacons.length).toBe(before);
  await context.close();
});
