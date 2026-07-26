/**
 * Cloudflare Worker — analytics reverse proxy.
 *
 * Proxies PostHog (assets + ingestion) and Cloudflare Insights through
 * signedreviews.com so ad blockers see first-party requests.
 *
 * Routes:
 *   /ph/static/*   → us-assets.i.posthog.com/static/*
 *   /ph/*           → us.i.posthog.com/*              (ingestion + API)
 *   /cf/*           → static.cloudflareinsights.com/*
 */

const PH_ASSETS = 'us-assets.i.posthog.com';
const PH_INGEST = 'us.i.posthog.com';
const CF_INSIGHTS = 'static.cloudflareinsights.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // PostHog static assets (array.js, dead-clicks-autocapture.js, etc.)
    if (url.pathname.startsWith('/ph/static/')) {
      const target = `https://${PH_ASSETS}/static/${url.pathname.slice('/ph/static/'.length)}${url.search}`;
      return fetch(target, { method: request.method, headers: request.headers, body: request.body });
    }

    // PostHog ingestion + API (decide, e, s, engage, etc.)
    if (url.pathname.startsWith('/ph/')) {
      const target = `https://${PH_INGEST}/${url.pathname.slice('/ph/'.length)}${url.search}`;
      return fetch(target, { method: request.method, headers: request.headers, body: request.body });
    }

    // Cloudflare Insights beacon
    if (url.pathname.startsWith('/cf/')) {
      const target = `https://${CF_INSIGHTS}/${url.pathname.slice('/cf/'.length)}${url.search}`;
      return fetch(target, { method: request.method, headers: request.headers, body: request.body });
    }

    // Not a proxy path — pass through to origin
    return fetch(request);
  },
};
