# How Stripe Review Verification Works: A Technical Guide

**Published:** 2026-07-04 · **Author:** Signed Reviews Team · **Description:** How Stripe review verification works, end to end: read-only OAuth, matching each review to a real charge, and cryptographic signing that's tamper-evident.

---

If you accept payments through Stripe, you already have everything you need to collect verified, tamper-evident customer reviews. Here's how the integration works — from OAuth to cryptographic signing.

## The Stripe connection

Signed Reviews connects to your Stripe account via Stripe's official OAuth flow. You click "Connect," authorize the integration, and that's it. No API keys to copy and paste. No webhook configuration. No server changes.

Critically, the connection is **read-only.** The OAuth scope grants permission to:

- Read charges (to verify purchases)
- Read customers (to match reviewers to buyers)
- Read subscriptions (for subscription-based businesses)
- Read balance transactions (for refund detection)

We **cannot** create charges, issue refunds, update subscriptions, or modify anything in your Stripe account. This is enforced by Stripe's OAuth permission model — not just by our promise.

## How a review gets verified

When a customer completes a purchase through your Stripe account, Stripe records a `charge.succeeded` event. Here's what happens next, step by step:

1. **Event detection**: Signed Reviews detects the new charge via Stripe's event system. The charge contains the customer's email, the amount, the currency, and a unique charge ID.

2. **Invitation generation**: A unique, cryptographically random review invitation token is generated. This token is linked to the specific Stripe charge ID. A review link is created: `https://platform.signedreviews.com/review/{token}`.

3. **Email delivery**: The invitation is sent to the customer's verified payment email — the email address on the Stripe charge. This is the same email that receives the Stripe receipt. The email carries your branding (logo, colors) and a clear call-to-action.

4. **Review submission**: The customer clicks the link (which expires after a configurable period) and writes their review. At the moment of submission, the platform creates a cryptographic signature binding together:
   - The review content (text, rating, title)
   - The Stripe charge ID
   - The reviewer's email
   - A timestamp

5. **Verification**: The signature uses HMAC-SHA256 with a platform-wide signing key. Anyone can verify the signature independently — it proves the review was created through the platform and has not been altered.

## Refund handling

If a charge is refunded, Stripe sends a `charge.refunded` event. Signed Reviews automatically hides the associated review from your public page and API. The cryptographic signature remains valid (the review *was* authentic), but the content is no longer displayed publicly.

This is automatic — you don't need to flag, report, or manually hide anything.

## The invitation lifecycle

- **Created**: When a Stripe charge succeeds and auto-request is enabled
- **Sent**: Immediately, after a configurable delay, or on delivery (via webhook)
- **Clicked**: The customer opens the review page. No more reminders are sent after this point.
- **Submitted**: The review is cryptographically signed and published
- **Expired**: If the customer never clicks, the link expires (14–90 days depending on plan)

## What about non-Stripe payments?

Signed Reviews is built for Stripe. If you use multiple payment processors, reviews can only be verified for purchases processed through Stripe. If you use Shopify Payments (which runs on Stripe), it works automatically. If you use PayPal, Square, or another processor, those transactions won't trigger review invitations.

## The technical guarantee

At the end of this process, every review on your Signed Reviews page has a verifiable chain of custody:

```
Stripe charge → invitation token → review signature → published review
```

Break any link in that chain, and the review doesn't exist. This is what separates purchase-verified reviews from all other review platforms.
