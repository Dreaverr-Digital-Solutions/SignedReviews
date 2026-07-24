# How to Verify a Customer Actually Bought: 4 Methods, Ranked

**Published:** 2026-07-24 · **Author:** Signed Reviews Team · **Description:** Four ways to verify a reviewer is a real customer — from email confirmation to processor attestation — ranked by how hard each is to fake.**

---

Every business collecting reviews faces the same question: how do you know the person writing a review actually bought something? The answer depends on your tech stack, your payment processor, and how much certainty you want. Here are the four methods, ranked from weakest to strongest.

---

## Method 1: Email confirmation (Level 1)

**How it works:** The review platform sends a confirmation link to the reviewer's email. Reviewer clicks the link. Review is marked "verified."

**What it proves:** The reviewer controls the email address they used.

**What it doesn't prove:** That the reviewer ever interacted with the business, let alone made a purchase.

**Fake difficulty:** Zero. Anyone can create a free email address in 30 seconds.

**Best for:** Open forums, community reviews, platforms where volume matters more than authenticity.

**The verdict:** Email confirmation isn't purchase verification. It's identity-lite — it confirms an inbox exists, nothing more.

---

## Method 2: Invitation-only (Level 2–3)

**How it works:** The business sends review invitations to specific email addresses — usually by integrating with their e-commerce platform or uploading a customer list. Only invited email addresses can leave a "verified" review.

**What it proves:** The business selected this person to receive an invitation. (Trustpilot, Feefo, and most platforms rely on this model.)

**What it doesn't prove:** That the invited person actually made a purchase — only that the business put them on a list.

**Fake difficulty:** Low. A business can invite anyone. Friends, family, employees, fake accounts — all can receive invitations and leave "verified" reviews. The platform has no way to know whether the invited person was a real customer.

**The gap:** The business controls who gets invited. A business that wants to game the system can simply invite only happy customers (or non-customers entirely). The platform can't detect this because it doesn't have independent purchase data.

**Best for:** Businesses that want more control over their review pipeline and are comfortable with the trust trade-off.

**The verdict:** Invitation-only is an improvement over open posting, but it's still gated by the business's own data. The business decides who's a "customer."

---

## Method 3: Order matching (Level 3)

**How it works:** The review platform integrates with the business's e-commerce platform (Shopify, WooCommerce, etc.) and checks whether the reviewer's email matches an order record in the store.

**What it proves:** An order record exists in the merchant's store system that matches the reviewer's email.

**What it doesn't prove:** That the order was completed, paid for, and not refunded — or that the order record is authentic.

**Fake difficulty:** Medium. A merchant could create a test order in their own Shopify store and write a review against it. The platform would see "order record exists → verified." The merchant needs access to their own store admin, which they have by definition.

**The gap:** The data source is still the merchant. A merchant can create orders (for $0, with discount codes), invite the "customer" (themselves or an accomplice), and collect "Verified Buyer" reviews. Most merchants don't do this — but the architecture doesn't prevent it.

**Best for:** E-commerce businesses on Shopify or similar platforms that want a stronger verification signal than email alone.

**The verdict:** Order matching is the industry standard — and it's a meaningful step up from email-only. But it trusts the merchant's data, and the merchant controls the merchant's data.

---

## Method 4: Processor attestation (Level 4)

**How it works:** The review platform connects directly to the business's payment processor (Stripe) via read-only OAuth. Every review is matched to a confirmed, settled, non-refunded charge in the payment processor's system — and signed cryptographically so the attestation is independently verifiable.

**What it proves:**
- A real charge occurred (amount, date, payment method confirmed by Stripe)
- The charge settled (not pending or failed)
- The charge hasn't been refunded (refunds automatically hide the review)
- The reviewer's email matches the payment email on the Stripe charge

**What it doesn't prove:** That the review is fair, detailed, or unbiased. A real customer can still write a misleading review.

**Fake difficulty:** Very high. To create a fake processor-attested review, a merchant would need to:
1. Run a real Stripe charge (pays Stripe processing fees — ~2.9% + $0.30)
2. Risk their Stripe account being flagged for fraudulent activity
3. Accept that refunding the charge hides the review automatically

The economics of faking reviews at Level 4 are terrible: every fake review costs real money, and Stripe's fraud detection makes pattern abuse risky. Contrast this with Level 3, where fake reviews cost nothing but time.

**Best for:** Any business processing payments through Stripe that wants the strongest possible verification signal — and is willing to let the payment processor (not the business) be the arbiter of who's a real customer.

**The verdict:** Processor attestation is the only method where the attesting party is **independent of the merchant.** It's the difference between "we checked our own records" and "Stripe confirmed the charge." For businesses that want review authenticity to be a structural guarantee rather than a policy promise, it's the only option.

---

## Comparison at a glance

| Method | Verification level | Who attests | Fake difficulty | Stripe-native |
|--------|-------------------|-------------|-----------------|---------------|
| Email confirmation | Level 1 | Email provider | Trivial | ❌ |
| Invitation-only | Level 2–3 | Merchant | Low | ❌ |
| Order matching | Level 3 | Merchant's platform | Medium | ❌ |
| Processor attestation | Level 4 | Payment processor | **Very high** | ✅ |

---

## How to implement each method

| Method | What you need |
|--------|--------------|
| Email confirmation | Any review platform with email verification (most have it) |
| Invitation-only | A customer list or e-commerce integration; configure your platform to send invitations, not accept open reviews |
| Order matching | An e-commerce platform integration (Shopify, WooCommerce); most Shopify review apps do this automatically |
| Processor attestation | A Stripe account + a review platform that connects to Stripe via read-only OAuth (e.g., [Signed Reviews](https://platform.signedreviews.com)) |

---

## The bottom line

How you verify a customer bought something is a choice about **who you trust to tell the truth.** At Level 1–2, you trust the reviewer. At Level 3, you trust the merchant. At Level 4, you trust the payment processor — an independent third party whose entire business depends on accurately reporting financial transactions.

If you process payments through Stripe, you already have the infrastructure for Level 4 verification. The question is whether your review platform uses it.

**Further reading:**
- [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/) — the verification spectrum explained
- [Transaction-Verified Reviews](/blog/transaction-verified-reviews/) — why Level 4 is the hardest to fake
- [Purchase-Verified vs Email-Verified Reviews](/blog/purchase-verified-vs-email-verified-reviews/) — the difference that matters
