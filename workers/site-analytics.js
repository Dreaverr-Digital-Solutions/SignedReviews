/**
 * First-party site analytics at the edge (platform/ANALYTICS.md). Imported by apex-router.js,
 * which runs on every signedreviews.com request.
 *
 *   collect()  POST /api/e: the page tracker's beacons. Same-origin and size checks, then the
 *              events are forwarded with the client's IP and Cloudflare geo (request.cf).
 *   logHit()   the server request log: after the response is produced, one row per page, API,
 *              Markdown or discovery-file request (static assets skipped), forwarded the same way.
 *
 * Both forward to the platform backend (POST /api/site-analytics/ingest/{events,hits}, bearer
 * ANALYTICS_INGEST_SECRET), which validates, classifies and stores. Forwarding runs in
 * ctx.waitUntil with a 3 s timeout and swallows every error: analytics can never change or delay
 * a response. With no ANALYTICS_INGEST_SECRET set, collect() answers 204 and nothing is sent.
 */

const DEFAULT_INGEST_ORIGIN = 'https://api.signedreviews.com';
export const COLLECTOR_PATH = '/api/e';

// Sign-up links on the site point to /go/signup?c=<button>&to=<app|register>. The Worker counts
// the click in the server request log (like any page request: no device storage, no IP, and it
// ignores the consent banner) and redirects to a fixed platform URL. Only these two destinations
// exist, so it can't be used as an open redirect. build.js rewrites the links; robots.txt
// disallows /go/.
export const GO_PATH = '/go/signup';
const GO_DEST = {
  app: 'https://platform.signedreviews.com/',
  register: 'https://platform.signedreviews.com/register',
};
const MAX_BYTES = 16 * 1024;

const cut = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

// ── which requests the log keeps ───────────────────────────────────────────
const SKIP_PREFIX = ['/assets', '/images', '/fonts', '/js', '/files', '/uploads', '/cdn-cgi', '/admin', '/ph', '/cf', COLLECTOR_PATH];
const ASSET_EXT = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|pdf|zip|wasm|webmanifest)$/i;

/** The log's kind for a request, or null to skip it. First matching rule wins. */
export function hitKind(path, contentType) {
  if (SKIP_PREFIX.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  if (ASSET_EXT.test(path)) return null;
  if (path === GO_PATH) return 'go';
  if (path.startsWith('/.well-known/')) return 'discovery';
  if (/^\/(robots|llms|llms-full)\.txt$|^\/auth\.md$|^\/openapi\.json$/.test(path)) return 'discovery';
  if (/sitemap[^/]*\.xml$/.test(path)) return 'sitemap';
  // /api/ itself is the landing's "Public API" page, not an API call
  if ((path.startsWith('/api/') && path.length > 5) || path.endsWith('.json')) return 'api';
  if (path.endsWith('.md') || (contentType || '').includes('text/markdown')) return 'markdown';
  return 'page';
}

/**
 * Platform routes served on the apex (via the platform SPA) are only logged when they are a
 * merchant's public page: a business profile, its reviews or leave-a-review page, /b/*,
 * /business/* or /verify/*. The backend keeps only bot requests to these (their human visitors
 * are our customers' customers). App and token routes (/dashboard, /login, /review/:token,
 * /invite/:token, OAuth callbacks…) are never logged. `appSegments` is the router's
 * PLATFORM_SINGLE_SEGMENT set.
 */
export function platformPathLoggable(path, appSegments) {
  if (/^\/(b|business|verify)\/[^/]+\/?$/.test(path)) return true;
  const m = /^\/([^/.]+)(\/(reviews|leave-a-review))?\/?$/.exec(path);
  return !!m && !appSegments.has(m[1].toLowerCase());
}

/** What only the edge knows about the client. The backend classifies and parses it. */
export function edgeClient(request) {
  const h = request.headers;
  const cf = request.cf || {};
  return {
    ip: h.get('cf-connecting-ip') || '',
    ua: cut(h.get('user-agent') || '', 512),
    lang: cut(h.get('accept-language') || '', 64),
    chua: cut(h.get('sec-ch-ua') || '', 200),
    mobile: cut(h.get('sec-ch-ua-mobile') || '', 8),
    platform: cut(h.get('sec-ch-ua-platform') || '', 40),
    cf: {
      country: cf.country,
      region: cf.region,
      city: cf.city,
      latitude: cf.latitude,
      longitude: cf.longitude,
      timezone: cf.timezone,
      asn: cf.asn,
      asOrganization: cf.asOrganization,
      colo: cf.colo,
    },
  };
}

function forward(env, path, body) {
  const secret = env && env.ANALYTICS_INGEST_SECRET;
  if (!secret) return Promise.resolve();
  const origin = (env.ANALYTICS_INGEST_ORIGIN || DEFAULT_INGEST_ORIGIN).replace(/\/+$/, '');
  return fetch(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  })
    .then(() => {})
    .catch(() => {});
}

/** The browser asked not to be tracked: Do Not Track or Global Privacy Control. The privacy
 *  policy promises we honour both, so such requests are never logged and their beacons dropped. */
export function optedOut(request) {
  return request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1';
}

/** GET /go/signup: count the sign-up click, then send the visitor on to the platform. */
export function goRedirect(request, env, ctx) {
  const t0 = Date.now();
  const url = new URL(request.url);
  const to = GO_DEST[url.searchParams.get('to')] || GO_DEST.app;
  const response = new Response(null, {
    status: 302,
    headers: { Location: to, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
  logHit({ request, response, t0, env, ctx, scope: 'landing', appSegments: new Set() });
  return response;
}

const reply = (status) => new Response(null, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

/** POST /api/e: the tracker's beacon collector. Always answers quickly; forwarding happens after. */
export async function collect(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response('POST only', { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  if (!env || !env.ANALYTICS_INGEST_SECRET || optedOut(request)) return reply(204);
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin) {
    let host = '';
    try {
      host = new URL(origin).host;
    } catch (_) {
      // "null" or garbage: not this site
    }
    if (host !== url.host) return reply(403);
  }
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return reply(403);
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) return reply(413);
  const text = await request.text();
  if (text.length > MAX_BYTES) return reply(413);
  let body;
  try {
    body = JSON.parse(text);
  } catch (_) {
    return reply(400);
  }
  const events = (Array.isArray(body) ? body : [body]).slice(0, 20).filter((e) => e && typeof e === 'object');
  if (events.length) ctx.waitUntil(forward(env, '/api/site-analytics/ingest/events', { client: edgeClient(request), events }));
  return reply(204);
}

/**
 * Queue one request-log row for a finished request. Never throws.
 * @param {'landing'|'platform'} scope which origin answered (set by the router)
 */
export function logHit({ request, response, t0, env, ctx, scope, appSegments }) {
  try {
    if (!env || !env.ANALYTICS_INGEST_SECRET) return;
    if (!['GET', 'HEAD', 'POST'].includes(request.method)) return;
    if (optedOut(request)) return;
    const purpose = `${request.headers.get('sec-purpose') || ''} ${request.headers.get('purpose') || ''}`;
    if (/prefetch|prerender/i.test(purpose)) return;
    if (request.headers.get('x-sr-admin')) return;
    const url = new URL(request.url);
    const contentType = (response && response.headers.get('content-type')) || '';
    const kind = hitKind(url.pathname, contentType);
    if (!kind) return;
    if (scope === 'platform' && !platformPathLoggable(url.pathname, appSegments)) return;
    const hit = {
      ts: t0,
      method: request.method,
      path: cut(url.pathname, 400),
      query: cut(url.search, 400),
      status: response ? response.status : 500,
      ms: Math.max(0, Date.now() - t0),
      kind,
      md: contentType.includes('text/markdown') ? 1 : 0,
      scope,
      ref: cut(request.headers.get('referer') || '', 400),
      client: edgeClient(request),
    };
    ctx.waitUntil(forward(env, '/api/site-analytics/ingest/hits', { hits: [hit] }));
  } catch (_) {
    // the request log must never affect a response
  }
}
