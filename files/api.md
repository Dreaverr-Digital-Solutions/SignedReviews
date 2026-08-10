# Public API

The Signed Reviews Public API lets you fetch verified reviews, ratings, and business profile data directly into your own site or app. Every review is processor-attested — backed by a real, non-refunded Stripe payment.

---

## Quickstart

```bash
curl -H "Authorization: Bearer YOUR_PUBLISHABLE_KEY" \
  https://api.signedreviews.com/v1/public/profile
```

That's it. One endpoint for profile data, one for reviews. Both are read-only and safe for client-side use with a publishable key.

## Authentication

Two key types, both read-only:

| Key type | Prefix | Safe for |
|----------|--------|----------|
| **Publishable key** | `rvwpk_live_…` | Browser, mobile apps, client-side code |
| **Secret key** | `rvw_live_…` | Server-to-server only |

Get your keys from the API Keys section of your dashboard. Publishable keys are available on Starter plans and above.

Pass your key as a Bearer token in the `Authorization` header, or as a `?key=` query parameter.

## Endpoints

Base URL: `https://api.signedreviews.com/v1/public`

### GET /profile

Returns your business identity, aggregate rating, star distribution, and verified trust metrics.

```json
{
  "success": true,
  "data": {
    "business": {
      "name": "Acme Widgets",
      "slug": "acme-widgets",
      "profileUrl": "https://signedreviews.com/acme-widgets",
      "logoUrl": "https://…",
      "brandColor": "#1a56db"
    },
    "summary": {
      "average": 4.7,
      "total": 142,
      "distribution": { "1": 2, "2": 3, "3": 8, "4": 31, "5": 98 }
    },
    "metrics": [
      { "key": "refund_rate", "label": "Refund rate", "value": { "rate": 0.012 } }
    ]
  },
  "error": null,
  "meta": { "generatedAt": "2026-08-10T12:00:00.000Z" }
}
```

Metrics are computed from your Stripe data. Each metric respects a k-anonymity cohort floor — if there aren't enough transactions to compute a metric without identifying individual customers, it's suppressed.

### GET /reviews

Returns paginated, privacy-masked reviews.

**Parameters:** `page` (default 1), `limit` (default 10, max 100), `sort` (`date_desc`, `date_asc`, `rating_desc`, `rating_asc`), `minRating` (1-5), `from`, `to` (ISO 8601 dates).

```json
{
  "success": true,
  "data": [
    {
      "id": "rev_abc123",
      "rating": 5,
      "title": "Exactly what we needed",
      "body": "Switched from Trustpilot. The Stripe verification alone…",
      "createdAt": "2026-07-15T09:30:00.000Z",
      "reviewer": {
        "displayName": "James K.",
        "photoUrl": "https://…"
      },
      "social": { "provider": "linkedin", "handle": "jamesk" },
      "purchase": { "amount": 49.00, "currency": "usd" },
      "photos": ["https://…"],
      "businessReply": {
        "body": "Thanks James!",
        "repliedAt": "2026-07-16T10:00:00.000Z"
      },
      "verification": {
        "method": "stripe_payment",
        "signature": "sha256:abc123…",
        "url": "https://signedreviews.com/verify/rev_abc123"
      }
    }
  ],
  "error": null,
  "meta": { "page": 1, "limit": 10, "total": 142, "totalPages": 15 }
}
```

Privacy masking is applied server-side: purchase amounts and social handles are only included when the reviewer explicitly opted to show them.

## Response format

Every response uses a consistent envelope:

```json
{
  "success": true,
  "data": { … },
  "error": null,
  "meta": { "page": 1, "limit": 10 }
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": "Invalid API key"
}
```

## Rate limits

| Plan | Requests per minute |
|------|-------------------|
| Starter | 60 |
| Pro | 300 |
| Scale | 1,000 |

Responses include `Cache-Control: public, max-age=60, stale-while-revalidate=300` headers. Cache responses on your side where possible to stay well within limits.

## CORS

The Public API v1 is accessible from any origin. You can call it directly from browser JavaScript without a proxy.

## Full OpenAPI spec

Download the complete machine-readable spec at [signedreviews.com/openapi.json](/openapi.json).

---

Questions? Email **api@signedreviews.com**.
