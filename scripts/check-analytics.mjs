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

  // The request log ignores the consent banner: a visitor in a consent region who declined (even
  // if a consent cookie were ever added) is still logged. Only DNT/GPC stop it (privacy policy).
  forwarded.length = 0;
  {
    const r2 = new Request('https://signedreviews.com/features/', { headers: { cookie: 'sr_consent=denied', 'user-agent': 'Mozilla/5.0 Chrome/131' } });
    Object.defineProperty(r2, 'cf', { value: { country: 'DE', city: 'Berlin' } });
    await router.fetch(r2, env, ctx);
    await settle();
    const h2 = forwarded.find((f) => f.url.endsWith('/ingest/hits'))?.body.hits[0];
    check(h2 && h2.path === '/features/' && h2.client.cf.country === 'DE', 'a declined visitor from a consent region is still in the server request log');
    check(!/consent/i.test(fs.readFileSync(path.join(ROOT, 'workers', 'site-analytics.js'), 'utf8').replace(/^\s*(\/\/|\*).*$/gm, '')), 'the request log code never reads consent state');
  }

  // /go/signup: counted server-side, then a fixed redirect (never an open redirect)
  forwarded.length = 0;
  r = await router.fetch(req('/go/signup?c=hero-signup&to=register', { headers: { referer: 'https://signedreviews.com/pricing/', 'user-agent': 'Mozilla/5.0 Chrome/131' } }), env, ctx);
  await settle();
  check(r.status === 302 && r.headers.get('location') === 'https://platform.signedreviews.com/register' && r.headers.get('cache-control') === 'no-store', `/go/signup redirects to the register page (got ${r.status} ${r.headers.get('location')})`);
  const go = forwarded.find((f) => f.url.endsWith('/ingest/hits'))?.body.hits[0];
  check(go && go.kind === 'go' && go.path === '/go/signup' && go.ref === 'https://signedreviews.com/pricing/', 'a sign-up click is logged (kind go) with the page it came from');
  r = await router.fetch(req('/go/signup?c=x&to=https://evil.example/'), env, ctx);
  check(r.headers.get('location') === 'https://platform.signedreviews.com/', 'an unknown destination falls back to the app, never elsewhere');
  forwarded.length = 0;
  r = await router.fetch(req('/go/signup?c=x&to=app', { headers: { dnt: '1' } }), env, ctx);
  await settle();
  check(r.status === 302 && forwarded.length === 0, 'Do Not Track: the redirect still works, nothing is logged');

  forwarded.length = 0;
  await router.fetch(req('/pricing/', { headers: { dnt: '1' } }), env, ctx);
  await router.fetch(req('/pricing/', { headers: { 'sec-gpc': '1' } }), env, ctx);
  r = await router.fetch(req('/api/e', { method: 'POST', body: beacon, headers: { ...H, 'sec-gpc': '1' } }), env, ctx);
  await settle();
  check(r.status === 204 && forwarded.length === 0, `Do Not Track / Global Privacy Control: nothing logged or forwarded (got ${forwarded.length})`);

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
  // Google Fonts sent every visitor's IP to Google (LG Muenchen I, 3 O 17493/20): fonts are self-hosted
  const google = pages.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(dist, f));
  check(google.length === 0, `pages still loading Google Fonts: ${google.slice(0, 5).join(', ')}`);
  // No page loads anything from another site by itself: every script, stylesheet, image, iframe and
  // preconnect is first-party. Exceptions: our own subdomains, and Cloudflare Turnstile on the checker
  // page (anti-abuse, only when its keys are configured).
  const OWN = /^https:\/\/([a-z0-9-]+\.)?signedreviews\.com(\/|$)/;
  const ALLOWED_THIRD = /^https:\/\/challenges\.cloudflare\.com\//;
  const loads = /<(?:script|img|iframe|source|video|audio)\b[^>]*\ssrc="(https?:[^"]+)"|<link\b[^>]*rel="(?:stylesheet|preconnect|preload|modulepreload|dns-prefetch)"[^>]*href="(https?:[^"]+)"|<link\b[^>]*href="(https?:[^"]+)"[^>]*rel="(?:stylesheet|preconnect|preload|modulepreload|dns-prefetch)"/g;
  const third = new Set();
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(loads)) {
      const u = m[1] || m[2] || m[3];
      if (!OWN.test(u) && !ALLOWED_THIRD.test(u)) third.add(`${path.relative(dist, f)}: ${u.slice(0, 80)}`);
    }
    // consent gate: exactly once, in <head>, before the tracker; PostHog only initialised by the gate
    const gate = html.indexOf('<script data-sr-consent>');
    const gates = (html.match(/<script data-sr-consent>/g) || []).length;
    check(gates === 1 && gate > 0 && gate < html.indexOf('</head>') && gate < html.indexOf('<script data-sr-fpa>'), `${path.relative(dist, f)}: consent gate missing, duplicated or after the tracker`);
    check(!/posthog\.init\(/.test(html.replace(/<script data-sr-consent>[\s\S]*?<\/script>/, '')), `${path.relative(dist, f)}: posthog.init outside the consent gate`);
  }
  check(third.size === 0, `third-party resources loaded on page load: ${[...third].slice(0, 6).join(' | ')}`);
  // every sign-up link goes through /go/signup (counted server-side), marked nofollow; none skip it
  let viaGo = 0;
  const direct = new Set();
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    for (const t of html.match(/<a\b[^>]*>/g) || []) {
      const href = /\shref="([^"]*)"/.exec(t)?.[1] || '';
      if (href.startsWith('/go/signup?')) {
        viaGo += 1;
        if (!/data-conversion="signup"/.test(t) || !/rel="[^"]*nofollow/.test(t)) direct.add(`${path.relative(dist, f)}: ${t.slice(0, 90)}`);
      } else if (/^https:\/\/platform\.signedreviews\.com\/register/.test(href) || (/data-conversion="signup"/.test(t))) direct.add(`${path.relative(dist, f)}: ${href}`);
    }
  }
  check(viaGo > 100 && direct.size === 0, `sign-up links not routed through /go/signup (${viaGo} routed): ${[...direct].slice(0, 4).join(' | ')}`);
  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
  check((robots.match(/^Allow: \/$/gm) || []).length === (robots.match(/^Disallow: \/go\/$/gm) || []).length, 'robots.txt disallows /go/ in every group that allows /');
  check(/^\/go\/signup https:\/\/platform\.signedreviews\.com\/ 302$/m.test(fs.readFileSync(path.join(dist, '_redirects'), 'utf8')), '_redirects keeps /go/signup working if the Worker is not deployed yet');
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  check(/"endpoint":"\/api\/e"/.test(home), 'the inlined tracker posts to /api/e');
  check((home.match(/data-conversion="signup"/g) || []).length >= 4, 'homepage sign-up CTAs carry data-conversion="signup"');

  const privacy = fs.readFileSync(path.join(dist, 'privacy', 'index.html'), 'utf8');
  check(privacy.includes('href="/privacy/?sr-track=off"'), 'privacy page links the opt-out (?sr-track=off)');
  check(privacy.includes('href="/privacy/?sr-track=on"'), 'privacy page links the opt-in (?sr-track=on)');
  check(/IP address/.test(privacy), 'privacy page mentions IP addresses');
  // the stated retention must match what the backend enforces
  const retention = path.join(ROOT, '..', 'platform', 'backend', 'src', 'siteAnalytics', 'retention.js');
  const days = fs.existsSync(retention) ? fs.readFileSync(retention, 'utf8') : '';
  const events = Number(/RETENTION_DAYS = (\d+)/.exec(days)?.[1] || 365);
  const hits = Number(/HITS_RETENTION_DAYS = (\d+)/.exec(days)?.[1] || 30);
  const sentence = `We keep the server request log for ${hits} days and the other visit statistics for ${Math.round(events / 30.4)} months.`;
  check(privacy.includes(sentence), `privacy page should say: ${sentence}`);
  check(!/We do not persist IP addresses/.test(privacy) || /We never store your IP address/.test(privacy), 'privacy page keeps the no-IP promise and explains the daily code');
  check(!/cookie/i.test(fs.readFileSync(path.join(ROOT, 'analytics', 'tracker.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '')), 'the tracker never touches cookies');
  done(`built output: consent gate and tracker on all ${pages.length} pages, sign-ups via /go/signup, no third-party loads, no Google Fonts, privacy disclosure`);
}
