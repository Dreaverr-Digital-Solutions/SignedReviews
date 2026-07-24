# Authentication — Signed Reviews

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
