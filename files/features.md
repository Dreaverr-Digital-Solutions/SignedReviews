# Signed Reviews Features

Signed Reviews is a verification-first review platform built on your payment provider: Stripe or Paddle Billing. Every review is cryptographically signed and backed by a real, non-refunded payment.

---

## Payment-native verification (Stripe and Paddle)

Connect your Stripe account in one click via Stripe's official OAuth. We get minimal permissions: we can verify charges but can never charge, refund, or move funds. The only thing we can ever create is a discount coupon for a reviewer, and only when you enable review incentives.

Selling through Paddle Billing? Paste an API key you create with read-only permissions instead. We never write to Paddle. Thank-you discount codes are Stripe-only, and four trust metrics are available for Paddle. [Paddle integration details](/integrations/paddle/)

- **Automatic review invitations**: every completed Stripe or Paddle payment triggers a verified review invitation for a new customer
- **Refund-aware**: if a payment is fully refunded or charged back, the associated review is automatically hidden
- **Processor-attested**: the strongest verification level available; every review is matched to a completed payment from your Stripe or Paddle account

## Cryptographic signing

Every review is signed with HMAC-SHA256 at submission time. The signed payload includes review content, rating, timestamp, and transaction reference.

- **Tamper-evident**: any modification after signing invalidates the signature
- **Public verification page**: every review gets a verification URL showing the full cryptographic proof

## Public review page

Your business gets a public profile at `signedreviews.com/your-slug` where customers browse verified reviews.

- **Customizable branding**: your logo, brand color, and business name
- **Review metrics**: star distribution, review count, and response rate
- **Verified badge**: "Purchase Verified" badge on every review

## Automated review collection

Set your cadence and let the platform handle the rest.

- **Configurable delay**: send invitations N days after purchase
- **Smart suppression**: customers who already reviewed aren't asked again
- **Email + photo review**: text reviews with up to 3 photo attachments

## API and integrations

- **REST API**: fetch reviews, check verification status, display on your site
- **Publishable-key auth**: safe for client-side use
- **Stripe App**: install from the Stripe Marketplace for dashboard-native access
- **Webhooks**: real-time events for new reviews, replies, and status changes

## Dashboard

Manage everything from `platform.signedreviews.com`: review moderation, analytics, team access with role-based permissions, and self-serve billing.

## Privacy and compliance

- **GDPR-ready**: Data Processing Agreement with Standard Contractual Clauses
- **Sub-processor transparency**: full list at [signedreviews.com/subprocessors](/subprocessors/)
- **Reviewer rights**: request removal or anonymization at any time
- **No data selling**: your review data is yours

---

Ready to start? [See pricing](/pricing/) or [create a free account](https://platform.signedreviews.com/register).
