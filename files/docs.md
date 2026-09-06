# Documentation

Everything you need to integrate Signed Reviews into your business. Collect reviews, verify them cryptographically, display them publicly, and embed them anywhere.

---

## Getting started

1. **[Create an account](https://platform.signedreviews.com/register)** (free, no credit card)
2. **Connect Stripe**, one-click OAuth, minimal permissions
3. **First sync**. We import your Stripe transactions and match them to customers
4. **Send invitations**, automated or manual, configurable delay after purchase
5. **Reviews start flowing**, every review is cryptographically signed at submission

## Core concepts

### Verification

Every review on Signed Reviews is **processor-attested**. The review is cryptographically signed with HMAC-SHA256 at submission time, binding it to a specific Stripe charge. Anyone can verify a review's authenticity at the public verification page.

[Learn more about verification →](/learn/what-does-verified-buyer-mean/)

### Public review pages

Your business gets a public profile at `signedreviews.com/your-slug`. Customize branding, layout, colors, and which metrics to display. Customers browse verified reviews with full cryptographic proof behind each one.

### Trust Profile

Optional Stripe-powered trust metrics displayed on your public page: refund rate, chargeback rate, repeat customer rate, active subscriptions, and more. Each metric respects a k-anonymity floor, individual transactions are never exposed.

---

## API reference

### Public API v1

REST API for fetching reviews, ratings, and business profile data into your own website or app. Read-only, publishable-key auth, safe for browser use.

[Full API reference →](/api/)

### API keys

Two key types, managed from your dashboard:

- **Publishable key** (`rvwpk_live_…`), safe for client-side code. Starter+ plans.
- **Secret key** (`rvw_live_…`), server-to-server only. Starter+ plans.

Rotate keys anytime from Dashboard → API Keys. Old keys stop working immediately on rotation.

### Rate limits

Rate limits scale with your plan tier. Responses include cache headers. We recommend caching on your side.

---

## Webhooks

Get real-time notifications when events happen in your account. Available on Pro and Scale plans.

| Event | Trigger |
|-------|---------|
| `review.created` | A customer submits a new review |
| `review.replied` | Your business reply is posted |
| `review.hidden` | A review is hidden (you hide it, or the charge is refunded) |
| `connection.revoked` | Your Stripe connection is disconnected |

Configure webhook URLs from Dashboard → Webhooks. We'll send a test event so you can verify your endpoint before going live.

---

## Review submission flow

### Automated (recommended)

1. Connect Stripe → we detect every successful charge
2. We send a branded review invitation email after your configured delay (immediate to N days)
3. Customer clicks the one-time link → submits review with optional photos and social handle
4. Review is cryptographically signed and published

### Manual

From your dashboard, send individual review requests to any past customer by email. Useful for one-off requests or customers who missed the automated invitation.

### Self-service

Enable self-service reviews on your public page. Customers can request their own verified review link by entering the email address they used at checkout. We verify it against your Stripe transactions before issuing a link.

---

## Team access

Invite team members with role-based permissions:

: full access, billing, account deletion
: manage reviews, reply, configure settings
: view reviews and analytics, reply to reviews

[Manage team →](https://platform.signedreviews.com/dashboard/team)

---

## Data & compliance

: Data Processing Agreement with Standard Contractual Clauses. [Accept DPA →](/dpa/)
: [Full list →](/subprocessors/)
: Owners can export all account data as a ZIP from Dashboard → Settings
: Account deletion anonymizes reviews and removes all credentials. One-click, irreversible.

---

## Stripe App

Install Signed Reviews from the [Stripe Marketplace](https://marketplace.stripe.com/apps/signedreviews) for dashboard-native access. Manage reviews, reply to customers, and view verification status directly inside your Stripe dashboard.

---

## Support

- **Email:** support@signedreviews.com
- **API questions:** api@signedreviews.com
- **Privacy / legal:** legal@signedreviews.com
