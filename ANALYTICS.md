# First-party analytics: landing side

The tracking plan, decisions, architecture and runbook live in `../platform/ANALYTICS.md`. This file covers what lives in this repo.

| File | What it does |
|---|---|
| `analytics/tracker.js` | The page tracker. `build.js` inlines it before `</body>` of every page in `dist/`, with the client part of the plan. It only runs on `signedreviews.com`. |
| `analytics/analytics.config.json` | Copy of the tracking plan. The canonical copy is `platform/backend/src/siteAnalytics/analytics.config.json`. |
| `workers/site-analytics.js` | Collector (`POST /api/e`) and request log, imported by `workers/apex-router.js`. Forwards to the platform backend. |
| `scripts/sync-analytics-config.js` | `npm run sync:analytics`: copies the plan from the platform repo. |
| `scripts/check-analytics.mjs` | `npm run check:analytics` after `node build.js`: plan copy in sync, Worker behaviour, tracker on every page, privacy disclosure. |
| `tests/analytics-tracker.spec.js` | The tracker in a real browser: `npx playwright test tests/analytics-tracker.spec.js --project=chromium-desktop`. |

## Marking up conversions

- A sign-up CTA that links to `https://platform.signedreviews.com` (the same URL as "Log in") needs `data-conversion="signup"`.
- Links to `platform.signedreviews.com/register` count as sign-ups by URL, no markup needed (link kind `signup` in the plan).
- Click labels come from `data-cta` first, then `aria-label`, then the link text. `data-track` marks PostHog sections and is ignored by the click tracker.
- Code that knows an outcome happened calls `window.fpa.track(name, { props })`. Calls made before the tracker loads are queued if you use the pattern in `index.html` (demo dialog) or the checker script in `build.js`.

## When the plan changes

1. Edit the canonical config in the platform repo, then `npm run sync:analytics` here.
2. Deploy the platform backend first (the collector drops events it doesn't know), then this site.

## Deploying the Worker

The collector and request log ship with the `apex-router` Worker, not with the Pages project:

```
npx wrangler secret put ANALYTICS_INGEST_SECRET -c workers/apex-router-wrangler.jsonc
npx wrangler deploy -c workers/apex-router-wrangler.jsonc
```

The secret must equal `ANALYTICS_INGEST_SECRET` on the platform backend (Railway). Without it the Worker sends nothing and `/api/e` answers 204.
