#!/usr/bin/env node
/**
 * Checks for the first-party site analytics (platform/ANALYTICS.md). Run after `node build.js`:
 *
 *   node scripts/check-analytics.mjs
 *
 * 1. The tracking plan copy (analytics/analytics.config.json) matches the platform's canonical copy.
 * 2. The apex Worker: collector status codes, the request log's kinds and scope, that analytics
 *    never changes a response, and that nothing is forwarded without ANALYTICS_INGEST_SECRET.
 * 3. Built output: every HTML page in dist/ loads the tracker once; the privacy page has the
 *    opt-out link, mentions IP addresses and states the retention the backend enforces.
 * Exits 1 on the first failed group, listing every failure in it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};
const done = (group) => {
  if (failures.length) {
    console.error(`✗ ${group}\n  - ${failures.join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`✓ ${group}`);
};

// ── 1. config copy ───────────────────────────────────────────────────────────
{
  const canonical = path.join(ROOT, '..', 'platform', 'backend', 'src', 'siteAnalytics', 'analytics.config.json');
  const copy = path.join(ROOT, 'analytics', 'analytics.config.json');
  const norm = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (fs.existsSync(canonical)) check(norm(canonical) === norm(copy), 'analytics/analytics.config.json differs from the platform copy: run node scripts/sync-analytics-config.js');
  else console.log('  (platform repo not found next to landingpage/: config sync not checked)');
  JSON.parse(norm(copy));
  done('tracking plan copy matches the platform');
}

// ── 2. Worker ────────────────────────────────────────────────────────────────
{
  const sa = await import(pathToFileURL(path.join(ROOT, 'workers', 'site-analytics.js')).href);
  const router = (await import(pathToFileURL(path.join(ROOT, 'workers', 'apex-router.js')).href)).default;

  // hitKind
  const kinds = {
    '/': 'page',
    '/pricing/': 'page',
    '/api/': 'page',
    '/api/agent-ready-test': 'api',
    '/openapi.json': 'discovery',
    '/llms.txt': 'discovery',
    '/.well-known/agent-card.json': 'discovery',
    '/sitemap.xml': 'sitemap',
    '/pricing/index.md': 'markdown',
    '/assets/index-abc.js': null,
    '/images/x.png': null,
    '/fonts/a.woff2': null,
    '/output.css': null,
    '/api/e': null,
    '/cdn-cgi/trace': null,
  };
  for (const [p, k] of Object.entries(kinds)) check(sa.hitKind(p, 'text/html') === k, `hitKind(${p}) should be ${k}, got ${sa.hitKind(p, 'text/html')}`);
  check(sa.hitKind('/pricing/', 'text/markdown; charset=utf-8') === 'markdown', 'a text/markdown response is kind markdown');

  const app = new Set(['dashboard', 'login', 'register', 'review', 'invite', 'callback', 'onboarding']);
  for (const p of ['/acme', '/acme/', '/acme/reviews', '/acme/leave-a-review', '/b/acme', '/business/acme', '/verify/123']) check(sa.platformPathLoggable(p, app), `${p} should be loggable (merchant page)`);
  for (const p of ['/dashboard', '/dashboard/admin', '/login', '/register', '/review/tok123', '/invite/tok', '/callback', '/review/preview/1']) check(!sa.platformPathLoggable(p, app), `${p} must never be logged`);

  // A fake runtime: global fetch records forwards and answers origin requests.
  const forwarded = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/site-analytics/ingest/')) {
      forwarded.push({ url, auth: init.headers?.Authorization, body: JSON.parse(init.body) });
      return new Response(null, { status: 204 });
    }
    if (url.startsWith('https://signedreviews-landing.pages.dev/pricing/')) return new Response('<html>pricing</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    if (url.startsWith('https://platform.signedreviews.com/')) return new Response('<html>spa</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    if (url.startsWith('https://api.signedreviews.com/api/review-page/page/')) return new Response(null, { status: 200 });
    return new Response('not found', { status: 404, headers: { 'content-type': 'text/html' } });
  };
  const env = { ANALYTICS_INGEST_SECRET: 'test-secret' };
  const waits = [];
  const ctx = { waitUntil: (p) => waits.push(p) };
  const settle = async () => {
    await Promise.all(waits.splice(0));
  };
  const req = (p, init = {}) => {
    const r = new Request(`https://signedreviews.com${p}`, init);
    Object.defineProperty(r, 'cf', { value: { country: 'GB', city: 'London', asOrganization: 'BT', colo: 'LHR' } });
    return r;
  };
  const beacon = JSON.stringify({ t: 'pv', v: 'visitor0001', s: 'session0001', p: 'pageview001', u: '/' });
  const H = { 'content-type': 'text/plain', origin: 'https://signedreviews.com', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '203.0.113.5', 'user-agent': 'Mozilla/5.0 Chrome/131' };

  let r = await router.fetch(req('/api/e', { method: 'GET' }), env, ctx);
  check(r.status === 405, `GET /api/e should be 405, got ${r.status}`);
  r = await router.fetch(req('/api/e', { method: 'POST', body: beacon, headers: { ...H, origin: 'https://evil.example' } }), env, ctx);
  check(r.status === 403, `a foreign Origin should be 403, got ${r.status}`);
  r = await router.fetch(req('/api/e', { method: 'POST', body: beacon, headers: { ...H, 'sec-fetch-site': 'cross-site' } }), env, ctx);
  check(r.status === 403, `Sec-Fetch-Site cross-site should be 403, got ${r.status}`);
  r = await router.fetch(req('/api/e', { method: 'POST', body: 'x'.repeat(17 * 1024), headers: H }), env, ctx);
  check(r.status === 413, `an oversized beacon should be 413, got ${r.status}`);
  r = await router.fetch(req('/api/e', { method: 'POST', body: '{not json', headers: H }), env, ctx);
  check(r.status === 400, `invalid JSON should be 400, got ${r.status}`);
  r = await router.fetch(req('/api/e', { method: 'POST', body: beacon, headers: H }), env, ctx);
  await settle();
  check(r.status === 204 && r.headers.get('cache-control') === 'no-store' && r.headers.get('x-robots-tag') === 'noindex', 'a good beacon gets 204 with no-store and noindex');
  const ev = forwarded.find((f) => f.url.endsWith('/ingest/events'));
  check(!!ev, 'the beacon is forwarded to the ingest endpoint');
  check(ev && ev.auth === 'Bearer test-secret', 'forwarding carries the bearer secret');
  check(ev && ev.body.client.ip === '203.0.113.5' && ev.body.client.cf.country === 'GB' && ev.body.events.length === 1, 'forwarded beacon carries IP, geo and the event');
  check(!forwarded.some((f) => f.url.endsWith('/ingest/hits') && f.body.hits[0].path === '/api/e'), 'the collector itself is never in the request log');

  forwarded.length = 0;
  r = await router.fetch(req('/pricing/', { headers: { 'user-agent': 'Mozilla/5.0 Chrome/131', referer: 'https://www.google.com/' } }), env, ctx);
  await settle();
  check(r.status === 200 && (await r.text()) === '<html>pricing</html>', 'a landing page response is unchanged');
  const hit = forwarded.find((f) => f.url.endsWith('/ingest/hits'))?.body.hits[0];
  check(hit && hit.path === '/pricing/' && hit.kind === 'page' && hit.scope === 'landing' && hit.status === 200 && hit.ref === 'https://www.google.com/', `landing page hit forwarded with scope landing: ${JSON.stringify(hit)}`);

  forwarded.length = 0;
  await router.fetch(req('/dashboard/admin'), env, ctx);
  await router.fetch(req('/review/secret-token-123'), env, ctx);
  await router.fetch(req('/assets/index-abc.js'), env, ctx);
  await router.fetch(req('/pricing/', { headers: { 'sec-purpose': 'prefetch' } }), env, ctx);
  await settle();
  check(forwarded.length === 0, `app, token, asset and prefetch requests are never logged (got ${forwarded.map((f) => f.body.hits?.[0]?.path).join(', ')})`);

  await router.fetch(req('/acme'), env, ctx);
  await settle();
  const ph = forwarded.find((f) => f.url.endsWith('/ingest/hits'))?.body.hits[0];
  check(ph && ph.path === '/acme' && ph.scope === 'platform', 'a merchant profile request is forwarded with scope platform (the backend keeps bots only)');

  forwarded.length = 0;
  r = await router.fetch(req('/api/e', { method: 'POST', body: beacon, headers: H }), {}, ctx);
  await router.fetch(req('/pricing/'), {}, ctx);
  await settle();
  check(r.status === 204 && forwarded.length === 0, 'without ANALYTICS_INGEST_SECRET the collector answers 204 and nothing is forwarded');

  // a failing ingest endpoint must not affect the page
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/ingest/')) throw new Error('ingest down');
    return new Response('<html>ok</html>', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  r = await router.fetch(req('/pricing/'), env, ctx);
  await settle();
  check(r.status === 200, 'an unreachable ingest endpoint does not change the response');
  globalThis.fetch = realFetch;
  done('apex Worker: collector and request log');
}

// ── 3. built output ──────────────────────────────────────────────────────────
{
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    console.error('✗ dist/ not found: run node build.js first');
    process.exit(1);
  }
  const pages = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith('.html')) pages.push(f);
    }
  };
  walk(dist);
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    const n = (html.match(/<script data-sr-fpa>/g) || []).length;
    check(n === 1, `${path.relative(dist, f)} loads the tracker ${n} times (expected 1)`);
  }
  check(pages.length > 50, `expected the whole site in dist/, found ${pages.length} pages`);
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  check(/"endpoint":"\/api\/e"/.test(home), 'the inlined tracker posts to /api/e');
  check((home.match(/data-conversion="signup"/g) || []).length >= 4, 'homepage sign-up CTAs carry data-conversion="signup"');

  const privacy = fs.readFileSync(path.join(dist, 'privacy', 'index.html'), 'utf8');
  check(privacy.includes('href="/privacy/?sr-track=off"'), 'privacy page links the opt-out (?sr-track=off)');
  check(privacy.includes('href="/privacy/?sr-track=on"'), 'privacy page links the opt-in (?sr-track=on)');
  check(/IP address/.test(privacy), 'privacy page mentions IP addresses');
  // the stated retention must match what the backend enforces
  const retention = path.join(ROOT, '..', 'platform', 'backend', 'src', 'siteAnalytics', 'retention.js');
  if (fs.existsSync(retention)) {
    const days = Number(/RETENTION_DAYS = (\d+)/.exec(fs.readFileSync(retention, 'utf8'))?.[1]);
    const months = Math.round(days / 30.4);
    check(privacy.includes(`for ${months} months, then delete it automatically`), `privacy page should state ${months} months (RETENTION_DAYS = ${days})`);
  } else check(privacy.includes('for 12 months, then delete it automatically'), 'privacy page states the 12-month retention');
  check(!/cookie/i.test(fs.readFileSync(path.join(ROOT, 'analytics', 'tracker.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '')), 'the tracker never touches cookies');
  done(`built output: tracker on all ${pages.length} pages, privacy disclosure`);
}
