# How Stripe Review Verification Works: A Technical Guide

**Published:** 2026-07-04 · **Author:** Signed Reviews Team · **Description:** Learn how Stripe review verification works — from OAuth connection and charge verification to cryptographic signing and automatic refund handling.

---

If you accept payments through Stripe, you already have everything you need to collect verified, tamper-evident customer reviews. Here's how Stripe review verification works — from OAuth to cryptographic signing.

Set up in under a minute — that's how Stripe review verification works. No API keys, no webhooks, no server changes. See the pricing page for plan details.

## The Stripe connection

Signed Reviews connects to your Stripe account via Stripe's official OAuth flow. You click "Connect," authorize the integration, and that's it. No API keys to copy and paste. No webhook configuration. No server changes. See [pricing](/pricing/) for plan details.

Critically, the connection is **least-privilege.** The OAuth scope grants permission to:

- Read charges (to verify purchases)
- Read customers (to match reviewers to buyers)
- Read subscriptions (for subscription-based businesses)
- Read balance transactions (for refund detection)
- Create coupons and promotion codes (for review incentives — opt-in, and the only write permission)

We **cannot** create charges, issue refunds, move funds, update subscriptions, or modify customers or prices in your Stripe account. The only write is the coupon permission above — and it is used only when the merchant enables review incentives. This is enforced by Stripe's OAuth permission model — not just by our promise.

## How Stripe review verification works: step by step

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

## Refund handling — how Stripe review verification works after a refund

If a charge is refunded, Stripe sends a `charge.refunded` event. Signed Reviews automatically hides the associated review from your public page and API. The cryptographic signature remains valid (the review *was* authentic), but the content is no longer displayed publicly.

This is automatic — you don't need to flag, report, or manually hide anything. That's how Stripe review verification works end-to-end: the same payment processor that confirms the charge also confirms the refund, and the review follows automatically.

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

Break any link in that chain, and the review doesn't exist. This is how Stripe review verification works at the architectural level — it's not a policy claim, it's a chain of cryptographic evidence. See [how Signed Reviews works](/how-it-works/) for the full verification flow, from OAuth connection to published review.

**Further reading:** [Stripe Verified Reviews: The Only Reviews Backed by Your Payment Processor](/blog/stripe-verified-reviews/) — our definitive guide to why processor-attested verification is structurally different from every other "verified" badge. Also see: [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/) for the full verification spectrum breakdown.

---

## FAQ: how Stripe review verification works

### Does Stripe review verification require API keys?

No. Signed Reviews connects via Stripe's official OAuth flow — one click, least-privilege permissions: four read scopes plus opt-in coupon creation for review incentives. You never copy an API key, and the connection can be revoked at any time from your Stripe dashboard. This is a core part of how Stripe review verification works: Stripe's OAuth permission model enforces the scope, not the app's own policy.

### Can Stripe review verification be faked?

No — not without creating a real, settled Stripe charge that costs real processing fees (~2.9% + $0.30). A fake charge would require a real payment method, would appear in your Stripe dashboard, and would risk your Stripe account being flagged. The economics make fabrication structurally irrational.

### How is Stripe review verification different from email verification?

Email verification confirms the reviewer controls an email address — nothing more. Stripe review verification confirms the reviewer paid you through Stripe, the charge settled, and the charge hasn't been refunded. One is identity-lite; the other is a financial attestation backed by a regulated payment processor. [See pricing](/pricing/) for plan options.
