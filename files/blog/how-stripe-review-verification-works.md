# How Stripe Review Verification Works: A Technical Guide
**Title:** How Stripe Review Verification Works | Signed Reviews

**Published:** 2026-07-04 · **Updated:** 2026-10-09 · **Author:** Robinson Guerra · **Description:** Learn how Stripe review verification works, from OAuth connection and charge verification to cryptographic signing and automatic refund handling.

---

If you accept payments through Stripe, you already have everything you need to collect verified, tamper-evident customer reviews. Here's how Stripe review verification works, from OAuth to cryptographic signing.

Setup takes a few minutes. That's how Stripe review verification works. No API keys, no webhooks, no server changes. See the pricing page for plan details.

## The Stripe connection

Signed Reviews connects to your Stripe account through the Signed Reviews Stripe App, which uses [Stripe's OAuth 2.0 flow for Stripe Apps](https://docs.stripe.com/stripe-apps/api-authentication/oauth). You click "Connect," authorize the integration, and that's it. No API keys to copy and paste. No webhook configuration. No server changes. See [pricing](/pricing/) for plan details.

Critically, the connection is **least-privilege.** The OAuth scope grants permission to:

- Read charges (to verify purchases)
- Read customers (to match reviewers to buyers)
- Read subscriptions (for subscription-based businesses)
- Read balance transactions (for refund detection)
- Create coupons and promotion codes (for review incentives, opt-in, and the only write permission)

We **cannot** create charges, issue refunds, move funds, update subscriptions, or modify customers or prices in your Stripe account. The only write is the coupon permission above, and it is used only when the merchant enables review incentives. This is enforced by Stripe's [app permission model](https://docs.stripe.com/stripe-apps/reference/permissions), not just by our promise.

## How Stripe review verification works: step by step

When a customer completes a purchase through your Stripe account, Stripe records a successful charge (the [`charge.succeeded` event](https://docs.stripe.com/api/events/types) "occurs whenever a charge is successful"). Here's what happens next, step by step:

1. **Charge import**: Signed Reviews pulls new charges from your Stripe account. Each charge contains the customer's email, the amount, the currency, and a unique charge ID.

2. **Invitation generation**: A unique, cryptographically random review invitation token is generated. This token is linked to the specific Stripe charge ID. A review link is created: `https://platform.signedreviews.com/review/{token}`.

3. **Email delivery**: The invitation is sent to the customer's verified payment email, the email address on the Stripe charge. This is the same email that receives the Stripe receipt. The email carries your branding (logo, colors) and a clear call-to-action.

4. **Review submission**: The customer clicks the link (which expires after 14 days) and writes their review. At the moment of submission, the platform creates a cryptographic signature binding together:
   - The review content (text, rating, title)
   - The Stripe charge ID
   - The reviewer's email
   - A timestamp

5. **Verification**: The signature uses HMAC-SHA256 with a platform-wide signing key. Anyone can check a review through the Signed Reviews public verification page. The signature proves the review was created through the platform and has not been altered.

## Refund handling: how Stripe review verification works after a refund

Stripe flags a charge as `refunded` only when it is fully refunded, and as `disputed` when the customer disputes it ([Stripe charge object](https://docs.stripe.com/api/charges/object)). Signed Reviews re-checks the charge behind each visible review every 6 hours. If it is fully refunded or disputed, the review is hidden from your public page and API. Partial refunds stay visible. The cryptographic signature remains valid (the review *was* authentic), but the content is no longer displayed publicly.

This is automatic: you don't need to flag, report, or manually hide anything. That's how Stripe review verification works end-to-end: the charge record and its refund status both come from Stripe, not from you, and the review follows automatically.

## The invitation lifecycle

- **Created**: When a new charge comes in from a customer who hasn't been invited before, and auto-request is enabled (one invitation sequence per customer: an invite plus up to 2 reminders)
- **Sent**: Immediately, or after a configurable delay
- **Clicked**: The customer opens the review page. No more reminders are sent after this point.
- **Submitted**: The review is cryptographically signed and published
- **Expired**: If the customer never clicks, the link expires (14 days on every plan)

## What about non-Stripe payments?

Signed Reviews is built for Stripe. If you use multiple payment processors, reviews can only be verified for purchases processed through Stripe. Shopify Payments runs on Stripe ([Stripe's Shopify case study](https://stripe.com/customers/shopify)), but it does not give you a Stripe account of your own to connect, so Signed Reviews cannot verify Shopify Payments charges. If you use PayPal, Square, or another processor, those transactions won't trigger review invitations.

## The technical guarantee

At the end of this process, every review on your Signed Reviews page has a verifiable chain of custody:

```
Stripe charge → invitation token → review signature → published review
```

Break any link in that chain, and the review doesn't exist. This is how Stripe review verification works at the architectural level. It's not a policy claim, it's a chain of cryptographic evidence. See [how Signed Reviews works](/how-it-works/) for the full verification flow, from OAuth connection to published review. The [documentation](/docs/) covers the API endpoints and webhook events in detail.

**Further reading:** [Stripe Verified Reviews: The Only Reviews Backed by Your Payment Processor](/blog/stripe-verified-reviews/), our definitive guide to why processor-attested verification is structurally different from every other "verified" badge. Also see: [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/) for the full verification spectrum breakdown. For the Stripe App Marketplace landscape, see our [Stripe app for reviews](/blog/stripe-app-for-reviews/) overview.

---

## FAQ: how Stripe review verification works

### Does Stripe review verification require API keys?

No. Signed Reviews connects via Stripe's official OAuth flow, one click, least-privilege permissions: four read scopes plus opt-in coupon creation for review incentives. You never copy an API key, and the connection can be revoked at any time from your Stripe dashboard. This is a core part of how Stripe review verification works: Stripe's OAuth permission model enforces the scope, not the app's own policy.

### Can Stripe review verification be faked?

Not cheaply. Faking one requires a real, completed Stripe charge, and that charge costs real processing fees: 2.9% + 30¢ per successful domestic card transaction on [Stripe's standard US pricing](https://stripe.com/pricing). A fake charge would require a real payment method, would appear in your Stripe dashboard, and would risk your Stripe account being flagged. The economics make fabrication structurally irrational.

### How is Stripe review verification different from email verification?

Email verification confirms the reviewer controls an email address, nothing more. Stripe review verification matches the reviewer to a completed Stripe charge they paid you, and hides the review if that charge is later fully refunded or disputed. One is identity-lite; the other rests on a payment record that comes from a regulated payment processor, not from the merchant. [See pricing](/pricing/) for plan options. To see the verification flow on your own Stripe account, [book a demo](/demo/).
