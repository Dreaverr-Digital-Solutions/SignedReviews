# Signed Reviews Features

Signed Reviews is a verification-first review platform built on Stripe. Every review is cryptographically signed and backed by a real, non-refunded payment.

---

## Stripe-native verification

Connect your Stripe account in one click via Stripe's official OAuth. We get minimal permissions: we can verify charges but can never charge, refund, or move funds. The only thing we can ever create is a discount coupon for a reviewer, and only when you enable review incentives.

: every successful Stripe charge triggers a verified review invitation
: if a charge is refunded, the associated review is automatically hidden
: the strongest verification level available; Stripe independently confirms each transaction

## Cryptographic signing

Every review is signed with HMAC-SHA256 at submission time. The signed payload includes review content, rating, timestamp, and transaction reference.

: any modification after signing invalidates the signature
: every review gets a verification URL showing the full cryptographic proof

## Public review page

Your business gets a public profile at `signedreviews.com/your-slug` where customers browse verified reviews.

: your logo, brand color, and business name
: star distribution, review count, and response rate
: "Purchase Verified" badge on every review

## Automated review collection

Set your cadence and let the platform handle the rest.

: send invitations N days after purchase
: customers who already reviewed aren't asked again
: text reviews with up to 3 photo attachments

## API and integrations

: fetch reviews, check verification status, display on your site
: safe for client-side use
: install from the Stripe Marketplace for dashboard-native access
: real-time events for new reviews, replies, and status changes

## Dashboard

Manage everything from `platform.signedreviews.com`: review moderation, analytics, team access with role-based permissions, and self-serve billing.

## Privacy and compliance

: Data Processing Agreement with Standard Contractual Clauses
: full list at [signedreviews.com/subprocessors](/subprocessors/)
: request removal or anonymization at any time
: your review data is yours

---

Ready to start? [See pricing](/pricing/) or [create a free account](https://platform.signedreviews.com/register).
