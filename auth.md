# Auth.md — Signed Reviews Authentication

## Platform authentication (platform.signedreviews.com)

Signed Reviews authenticates users via email magic-link (passwordless). No passwords are stored.

- **Sign up:** Create an account at platform.signedreviews.com with your email address. A magic link is emailed to verify ownership.
- **Sign in:** Enter your email; a one-time magic link is sent. Click to sign in. Sessions are persisted via secure, httpOnly cookies.
- **Email verification:** Required before a business can connect Stripe or publish a public profile.

## API authentication (api.signedreviews.com)

The Public API uses a two-key model:

- **Publishable key (`pk_...`):** Client-side safe. Used for read-only public endpoints (list reviews, get business profile). Pass as `Authorization: Bearer pk_...`.
- **Secret key (`sk_...`):** Server-side only. Used for creating review invitations, managing settings, and accessing protected endpoints. Never expose in client-side code.

API keys are generated and managed in the platform dashboard under Settings → API Keys.

## Agent registration (for AI agents and automated tools)

AI agents, LLM-based tools, and automated systems can access Signed Reviews resources through the following paths. No separate registration is required beyond the authentication methods described above.

### Read-only agent access (no registration required)

- **Markdown for Agents:** Request any page with `Accept: text/markdown` to receive a markdown representation. The homepage serves a structured overview with links to all key resources.
- **llms.txt:** Machine-readable site map at `https://signedreviews.com/llms.txt` — lists all key pages and their descriptions in a format optimized for LLM consumption.
- **Agent Skills:** Structured skill definitions at `https://signedreviews.com/.well-known/agent-skills/index.json` — 5 skills covering verification spectrum, fake review detection, FTC rules, Trustpilot alternatives, and Stripe verification.
- **OpenAPI spec:** `https://signedreviews.com/openapi.json` — full API specification for the Public API.

### API access for agents (publishable key required)

Agents building on the Signed Reviews Public API must obtain a publishable key from a Signed Reviews account:
1. Create an account at `https://platform.signedreviews.com`
2. Verify your email address
3. Navigate to Settings → API Keys
4. Generate a publishable key (`pk_...`)
5. Pass the key as `Authorization: Bearer pk_...` on all API requests
6. Base URL: `https://api.signedreviews.com/v1`

Rate limits apply. See the API documentation at `https://signedreviews.com/api/` for full details.

## Stripe OAuth (merchant Stripe account connection)

Connecting a Stripe account uses Stripe's standard OAuth 2.0 flow:

1. Merchant clicks "Connect Stripe" in the Signed Reviews dashboard
2. Browser redirects to `https://connect.stripe.com/oauth/authorize` with:
   - `client_id`: Signed Reviews Stripe App client ID
   - `scope`: `read_only`
   - `response_type`: `code`
3. Merchant reviews and approves the read-only scopes on Stripe's domain
4. Stripe redirects back to Signed Reviews with an authorization code
5. Signed Reviews exchanges the code for an access token (server-side)
6. The token grants read-only access to: charges, customers, subscriptions, refunds

**No Stripe API keys are stored.** The OAuth token is the only credential. If the merchant revokes access from their Stripe dashboard, the connection is severed immediately.

## Security headers (all responses)

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Scripts from self + PostHog analytics; fonts from Google Fonts; images from self + data: + HTTPS; connect-src restricted to self + PostHog + Cloudflare Insights

## Reporting a security issue

Email `security@signedreviews.com`. PGP key available upon request. Do not disclose vulnerabilities publicly before they are resolved.
