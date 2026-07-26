# Transaction-Verified Reviews: What They Are and Why They're the Hardest to Fake

**Published:** 2026-07-24 · **Author:** Signed Reviews Team · **Description:** What transaction-verified reviews are, how they differ from email-verified and merchant-verified reviews, and why processor-attested verification is the strongest anti-fake mechanism available.**

---

Every review platform says its reviews are "verified." The word is on every badge, every landing page, every sales deck. But "verified" can mean almost anything — from "this person has an email address" to "an independent payment processor confirmed the charge." Transaction-verified reviews sit at the strongest end of that spectrum. Here's what they are and why the distinction matters.

---

## What is a transaction-verified review?

A **transaction-verified review** is a review where an independent party — typically a payment processor — has confirmed that a specific transaction occurred between the reviewer and the business. The key words are **independent party** and **transaction occurred.** The verification doesn't come from the business's own records; it comes from the payment infrastructure that sits between the business and the customer.

This is structurally different from:

- **Email-verified:** reviewer controls the email address (anyone can create one).
- **Self-attested:** reviewer says they bought something (no check at all).
- **Merchant-verified:** the business's own records show a purchase (the business controls the data).

A transaction-verified review is the only type where the **attesting party is neutral** — the payment processor has no incentive to favor the business or the reviewer, and its records cannot be altered by either side.

---

## The five levels of review verification

Every "verified" review sits somewhere on this spectrum:

| Level | Name | What's checked | Who attests | Fake-resistant? |
|-------|------|---------------|-------------|-----------------|
| 0 | None | Nothing | No one | ❌ |
| 1 | Email | Reviewer controls an email address | Email provider | ❌ Trivial to bypass |
| 2 | Self-attested | Reviewer claims purchase | The reviewer | ❌ Honor system |
| 3 | Merchant-supplied | Order/customer records | The merchant | ⚠️ Merchant controls data |
| 4 | Processor-attested | Independent payment record | Payment processor | ✅ Structurally hard |

Level 4 — processor-attested, transaction-verified — is the only level where the attesting party is independent of both the business and the reviewer. It's also the rarest. Almost every major review platform operates at Level 3.

(For the full breakdown of every major platform: [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/).)

---

## Why most "verified" reviews aren't transaction-verified

Here's the uncomfortable truth about the review industry: **the word "verified" almost never means "independently confirmed by a payment processor."** It usually means one of these:

- **"Verified" = invited by the business** (Trustpilot). The business BCC'd an email and Trustpilot confirmed the invitation was sent. That's it. No payment confirmation.
- **"Verified Buyer" = matched to an order record** (Yotpo, Judge.me, Reviews.io, most Shopify apps). The reviewer's email matches a record in the merchant's store system. Better than an invitation-only check, but the data source is still the merchant.
- **"Verified" = the merchant uploaded a transaction log** (Feefo, eKomi). The merchant decides what goes into the feed being verified against.

In every case, the thing being verified against is **data the merchant supplies.** A merchant determined to manufacture reviews could — depending on the platform — invite fake accounts, create test orders, or curate which transactions go into the verification feed. An outsider can't do this easily, but the merchant themselves can.

**A transaction-verified review changes the power dynamic:** the merchant doesn't control the verification data. The payment processor does. If the processor says no charge exists, there's no review. Period.

---

## How processor-attested verification works (the Stripe model)

Here's the concrete flow for a processor-attested, transaction-verified review:

1. **A customer makes a purchase via Stripe.** Stripe processes the payment and records a charge object — containing the amount, the customer's email, the payment status, and a unique charge ID.

2. **The business connects their Stripe account** to the review platform via OAuth — **read-only access only.** The platform can query charges, customers, and refunds. It cannot create, modify, or refund anything.

3. **When a new charge appears**, the platform sends a review invitation to the customer's verified payment email — the email Stripe has on file for that transaction. No invitation is sent for charges that are disputed, refunded, or flagged.

4. **The customer writes a review** via a unique, expiring invitation link tied to that specific charge.

5. **At submission**, the platform checks that the charge still stands (not refunded, not disputed), grabs a timestamp and charge fingerprint from Stripe, and cryptographically signs the review — binding the review content, the Stripe charge metadata, and the timestamp into a tamper-evident record.

6. **If the charge is later refunded**, the platform receives a `charge.refunded` webhook from Stripe and automatically hides the review. The review record is preserved for audit but removed from public display.

At no point does the business touch the verification data. The business can't decide which charges trigger invitations (every charge does), can't exclude unhappy customers, and can't prevent refunded-charge reviews from being hidden. The process is deterministic and independent of the merchant.

---

## Why this matters: the FTC and the fake-review era

The U.S. Federal Trade Commission's **Trade Regulation Rule on Consumer Reviews and Testimonials** (16 CFR Part 465, effective October 2024) now prohibits fake reviews with civil penalties. The rule bans:

- Reviews that misrepresent genuine experience with a product
- Buying or selling reviews
- Undisclosed insider reviews
- Suppression of negative reviews

Transaction-verified reviews don't just comply with these rules — they make violating them **structurally more expensive than complying.** To fake a processor-attested review, you'd need to:

1. Create a real Stripe charge (pays Stripe fees, ~2.9% + $0.30)
2. Risk Stripe account closure for fraudulent activity
3. The review hides automatically if you refund the charge

At Level 3, a merchant could theoretically manufacture reviews through their own systems at near-zero cost. At Level 4, every fake review costs real money and risks the merchant's ability to process payments at all. **That's the difference between a policy and a structural guarantee.**

---

## What transaction-verified reviews don't solve

Transaction-verified reviews eliminate the "is this person a real customer?" question. They don't eliminate:

- **Biased reviews:** A real customer can still write an unfair or exaggerated review.
- **Selective response:** Happy customers write more reviews than unhappy ones regardless of verification method.
- **Incentivized reviews:** A business could still offer discounts for reviews (though platforms should prohibit this).
- **Low-quality reviews:** "Great product" with a 5-star rating is still not very useful to future buyers.

Transaction verification answers one question — "did this person actually buy this product?" — definitively. It doesn't answer "is this review fair, detailed, and honest?" But answering the first question definitively is the foundation for any credible review system. Without it, you're always guessing.

---

## The bottom line

"Verified" is a spectrum, not a standard. Most platforms operate at Level 3 — they trust the merchant's data. Transaction-verified reviews (Level 4) trust the payment processor — an independent third party that has no incentive to fabricate reviews and every incentive to maintain the integrity of its payment network.

If you process payments through Stripe, transaction-verified reviews are available to you today — and they're the strongest anti-fake signal you can offer your customers. If you're a consumer, knowing the difference between "verified by the merchant" and "verified by the payment processor" changes how you read every review you encounter.

**Further reading:**
- [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/) — every major platform's verification explained
- [Stripe Verified Reviews](/blog/stripe-verified-reviews/) — the definitive guide
- [How Stripe Review Verification Works](/blog/how-stripe-review-verification-works/) — the technical deep-dive
- [FTC Fake Review Rule](/blog/fake-review-laws-ftc/) — what the 2024 rule means for businesses
