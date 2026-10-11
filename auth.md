# auth.md

You are an agent. This page describes how authentication for the Signed Reviews public API works today.

Signed Reviews has no agent registration, no OAuth authorization server for agents and no token endpoint. Access uses API keys that a business creates in its dashboard. Two endpoints need no key at all.

API host: `https://api.signedreviews.com`. Machine-readable spec: `https://signedreviews.com/openapi.json`.

## Step 1. Use a keyless endpoint if it covers your task

These need no key and no registration:

```http
POST https://api.signedreviews.com/api/public/v1/check-review
Content-Type: application/json

{ "reviewText": "Great product, fast shipping.", "websiteUrl": "https://example.com", "rating": 5 }
```

Free automated estimate of whether a review looks fake or AI-written. `reviewText` is required (up to 12,000 characters); `websiteUrl` (up to 2,048 characters) and `rating` (integer 1-5) are optional. When the server has Cloudflare Turnstile switched on, a `turnstileToken` is also required. Limits: 10 requests per hour per IP address, plus a platform-wide daily cap.

```http
GET https://api.signedreviews.com/api/verify/{reviewId}
```

Returns a published review and whether its HMAC-SHA256 signature is still valid. Limit: 60 requests per minute per IP address.

## Step 2. Get an API key from the business

The profile and reviews endpoints return data for one business: the business that owns the key. A business creates its keys at `https://platform.signedreviews.com/dashboard/api`. Creating a key requires a Starter plan or higher.

| Key | Prefix | Where it belongs |
|-----|--------|------------------|
| Publishable | `rvwpk_` | Browsers, apps, client-side code |
| Secret | `rvw_` | Servers only. Never expose it. |

Both keys are read-only on these endpoints. Rotating a key in the dashboard invalidates the old one at once.

## Step 3. Call the API

Send the key as a Bearer token:

```http
GET https://api.signedreviews.com/api/public/v1/profile
Authorization: Bearer rvwpk_...
```

```http
GET https://api.signedreviews.com/api/public/v1/reviews?page=1&limit=10&sort=date_desc
Authorization: Bearer rvwpk_...
```

Or pass a publishable key as a query parameter, for static pages that cannot set headers:

```http
GET https://api.signedreviews.com/api/public/v1/reviews?key=rvwpk_...
```

Both endpoints allow requests from any origin (CORS), so browser-based agents can call them directly.

## Step 4. Handle errors and limits

- `401`: key missing or invalid. Ask the business for a valid key. There is no refresh flow.
- `403`: the business's plan does not include this API.
- `429`: rate limit reached. Per business per minute: Free 30, Starter 60, Pro 300, Scale 1,000. Responses are cacheable for 60 seconds, so cache on your side.

## Additional agent resources

- **Markdown for Agents:** send `Accept: text/markdown` to any signedreviews.com page
- **LLMs.txt:** `https://signedreviews.com/llms.txt`
- **API catalog:** `https://signedreviews.com/.well-known/api-catalog`
- **Agent Skills:** `https://signedreviews.com/.well-known/agent-skills/index.json`
- **OpenAPI spec:** `https://signedreviews.com/openapi.json`
- **Web Bot Auth JWKS:** `https://signedreviews.com/.well-known/http-message-signatures-directory`

## Stripe connection (merchants only)

Businesses connect Stripe by installing the Signed Reviews Stripe App, which uses Stripe's OAuth install flow. The app reads charges, customers, subscriptions and balance transactions. It writes only coupons and promotion codes, and only when the business switches on review incentives. It never charges, refunds or moves money. This connection is separate from API access: agents never receive Stripe access through Signed Reviews.

## Security

Email `security@signedreviews.com`. Do not disclose vulnerabilities publicly.
