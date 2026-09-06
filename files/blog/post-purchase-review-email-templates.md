# Post Purchase Review Email Templates: 5 Templates That Drive Verified Reviews

**Published:** 2026-07-24 · **Updated:** 2026-09-06 · **Author:** Signed Reviews Team · **Description:** Post purchase review email templates and the post purchase review form that converts — copy-and-paste templates for e-commerce, SaaS, and services, with Stripe-triggered automation, timing rules, subject lines, and FTC compliance guidance.

---

The best time to ask for a review is right after a customer has experienced your product — but not so soon that they haven't formed an opinion. The worst time is when they're annoyed by yet another marketing email. A well-crafted post purchase review email template can double your response rates — but only if you get the timing, structure, and ask right.

This guide covers when to send, what to say, and how to structure your review request emails for maximum response rates. Every template is based on patterns that consistently outperform generic "please leave us a review" messages.

**New in this update:** All five templates now include Stripe-automation notes — so if you use Stripe, you can trigger these emails automatically on charge events, skip the manual work, and collect transaction-verified reviews that carry a "Verified Stripe Purchase" badge instead of a generic "Verified Reviewer" tag.

## Post Purchase Review Form vs Review Email: Which Converts Better?

A **post purchase review form** is the page where the review actually gets written — star rating, headline, review text — and it can appear two ways: embedded on a thank-you page right after checkout, or reached through a review request email.

- **The on-site form alone** reaches only the customers who are still on your site. Most people leave after paying; the form they never saw generates nothing. Worse, a form alone proves nothing — anyone can fill one in, which is why unverified on-site forms are easy to flood with fake reviews.
- **The email-to-form flow** reaches every customer: the review request email is triggered by the charge event, and its link opens the form on your own review page. This is the pattern behind the templates below.
- **The verification layer** is what makes the form's output trustworthy. When the purchase is attested by the payment processor, the review the form collects becomes a payment verified review — the strongest badge a customer can see. See [payment verified reviews](/blog/purchase-verified-vs-email-verified-reviews/) for how that works.

If your goal is review volume plus verified status, the email-to-form flow beats an on-site form alone — that combination is exactly what the templates below are built for.

## The golden rules of any post purchase review email template

Before the templates, three principles that determine whether your emails get opened — or deleted:

### 1. One ask, one action

Your email has exactly one job: get the customer to click the review link. Don't cross-sell. Don't ask them to follow you on social media. Don't include three different CTAs. One email, one link, one action.

Emails with a single CTA increase click-through rates by 42% compared to emails with multiple CTAs (Campaign Monitor, 2023).

### 2. The subject line is everything

Most review request emails die in the inbox. Your subject line needs to:
- Be from a recognizable sender (your brand name or founder name)
- Not look like marketing ("Your order #1234 — quick question")
- Be short (under 50 characters for mobile)

"Quick question about your order" consistently outperforms "Please review your purchase" by 2–3× on open rates.

### 3. Timing matters more than copy

The best-written email sent at the wrong time will get ignored. The rules:

| Product type | When to send | Why |
|-------------|-------------|-----|
| Digital products | Same day or next day | Immediate value delivery |
| Physical products | 3–7 days after delivery | Time to unbox and use |
| SaaS / subscriptions | 14–30 days after signup | Time to experience the product |
| Services (consulting, etc.) | Within 48 hours of completion | Fresh impression, not yet stale |
| Consumables / food | 5–10 days after delivery | Time to try the product |

**Never send a review request before the customer has received the product.** This is the single most common mistake, and it's the one that got SiteJabber in trouble with the FTC in 2024. Sending a review request at checkout — before the customer has the product — generates reviews about expectations, not experience. Those reviews are misleading, and they're now a regulatory risk.

## Template 1: E-commerce — physical products

**Subject:** How was your [Product Name]?

---

Hi [First Name],

Your [Product Name] arrived [X days] ago — hope it's everything you expected.

When you have a moment, we'd love to hear how it's working out. Your review helps other customers make better decisions, and it helps us make better products.

[Leave a review →]

Honest feedback only, please — good, bad, or in-between. We read every one.

Thanks,
[Founder Name / Brand Name]

---

**Why it works:** Short, personal, and explicitly invites honest feedback. "Good, bad, or in-between" signals that you're not fishing for 5-star reviews, which increases both response rate and review authenticity. The founder's name as the sender (rather than a generic brand email) increases open rates.

**Stripe automation:** Set this to trigger 3–7 days after a `charge.succeeded` event for physical products. The platform automatically pulls the product name from the Stripe charge metadata and inserts it into the subject line and body.

## Template 2: SaaS — subscription products

**Subject:** [X] days in — how's it going?

---

Hi [First Name],

You've been using [Product Name] for about [X] days now. We built it to [solve specific problem], and we genuinely want to know: is it working for you?

If you have 2 minutes, a quick review would mean a lot:
[Leave a review →]

No pressure, no incentive — just honest feedback from a real user. It helps other [industry/role] professionals decide if [Product Name] is right for them.

Thanks for giving us a try,
[Founder Name]

P.S. If something isn't working, reply to this email. It goes directly to me, and I'll make sure it gets fixed.

---

**Why it works:** The P.S. is the highest-read element of any email. Making it a direct line to the founder converts people who wouldn't leave a review but might report a problem — reducing churn and negative reviews simultaneously. The "we built it to [specific problem]" line reminds them of the value proposition without being salesy.

**Stripe automation:** For SaaS, trigger on `invoice.paid` rather than a one-time charge. Set a 14-day delay from the first successful subscription payment to give the customer time to experience the product. Subsequent renewal payments can trigger follow-up invitations if the customer hasn't left a review yet.

## Template 3: Services / freelancers / agencies

**Subject:** Thanks for trusting us with [project/engagement]

---

Hi [First Name],

Working with you on [specific project] was a pleasure — thank you for trusting us with it.

If you're happy with how it turned out, a quick review helps us enormously. Most of our new clients find us through reviews from people like you.

[Leave a review →]

And if anything fell short, please tell me directly. I'll make it right.

Best,
[Your Name]

---

**Why it works:** Services are personal. The review request should be personal too — from the specific person they worked with, referencing the specific project. Generic service review requests ("Please review our company") get ignored. Specific ones get responses.

**Stripe automation:** Trigger on a `charge.succeeded` event for the final project payment. If you invoice in milestones, set the trigger to fire after the final invoice is paid — not mid-project when the outcome is still uncertain.

## Template 4: Short follow-up (for non-responders)

**Subject:** One quick question

---

Hi [First Name],

No worries if you're busy — just one quick question:

Would you recommend [Product Name] to a friend?

[Yes, absolutely →]
[Not really →]

That's it. Takes two seconds.

Thanks,
[Founder Name]

---

**Why it works:** The binary question reduces friction to near zero. "Yes" clickers can be routed to a review form pre-loaded with a positive sentiment; "Not really" clickers can be routed to private feedback. This is sometimes called a "sentiment gate" and can increase review submission rates by 40–60% compared to a direct review link.

**⚠️ Important:** If you route "yes" clickers to a review form, you must also give "not really" clickers a path to leave a review. Otherwise you're review gating — funneling happy customers to public reviews and unhappy ones to private feedback — which is an FTC compliance risk under the 2024 rule.

## Template 5: Delivery-triggered (physical products)

**Subject:** Your [Product Name] was just delivered

---

Hi [First Name],

According to [carrier], your [Product Name] just arrived. Here's a quick question while it's fresh:

[Leave a review →]

We ask after delivery — not before — because we want reviews from people who've actually used the product. No rush. When you've had a chance to try it, we'd love to hear what you think.

Thanks,
[Brand Name]

---

**Why it works:** The delivery trigger is the most accurate timing for physical products. And explicitly saying "we ask after delivery, not before" signals integrity — it tells the customer you're not one of those companies collecting reviews at checkout. This builds trust even before they write the review.

## What to avoid

### Don't incentivize positive reviews

The FTC's 2024 rule explicitly prohibits incentives conditioned on sentiment. "Leave a 5-star review and get 10% off" is illegal. "Leave a review and get 10% off" is still allowed — but your email copy must make the distinction clear.

### Don't send more than 2 reminders

One initial request + one follow-up, max. A third email is spam. If the customer hasn't responded after two attempts, they're not going to — and continuing to email them damages your brand.

### Don't ask for reviews at the wrong time

- Immediately after a support ticket is resolved? Yes (fresh relief/gratitude).
- Immediately after a billing issue? No.
- After a feature request you haven't built yet? No.
- On a customer's billing anniversary? Yes (moment of reflection).

### Don't use no-reply addresses

A no-reply sender address says "we want your opinion but not your conversation." It depresses response rates and damages brand perception. Use a real address, even if it's just a team alias.

## How Stripe-native review collection automates everything above

If you process payments through Stripe, you can automate every template on this page. Here's how it works:

1. **Connect your Stripe account** via OAuth (one click, minimal permissions)
2. **Configure your timing rules** — same-day, delayed, delivery-triggered, or custom
3. **The platform detects every new charge** through Stripe's event system
4. **Review invitations send automatically** at the timing you configured, with your template, your branding, and your sender name
5. **Every review is tied to a Stripe charge** — the review carries a "Verified Stripe Purchase" badge, not a generic "Verified Reviewer" tag

The templates above still matter — good copy drives response rates. The timing rules still matter — send too early and you annoy, too late and you're forgotten. But the automation removes the operational overhead of manually sending review requests, and the Stripe verification makes every review more credible when it arrives.

### The Stripe events that can trigger review invitations

| Stripe Event | When It Fires | Best For |
|---|---|---|
| `charge.succeeded` | A one-time payment succeeds | Physical products, digital downloads, services |
| `invoice.paid` | A subscription invoice is paid | SaaS, memberships, recurring billing |
| `checkout.session.completed` | A Stripe Checkout session completes | Checkout-based flows with metadata |
| `payment_intent.succeeded` | A PaymentIntent succeeds | Custom payment flows |

### Why Stripe-triggered emails beat manual sends

| | Manual Email | Stripe-Triggered |
|---|---|---|
| **Timing accuracy** | Whenever you remember to send | Within minutes of the charge clearing |
| **Personalization** | Generic "Dear customer" | Auto-populated with product name, charge amount, date |
| **Verification** | Email confirmed only | Stripe charge ID cryptographically bound to review |
| **Refund handling** | Manual — you must track refunds | Automatic — review hidden on refund |
| **Scale** | Breaks down above ~50 orders/month | Handles any volume |
| **FTC compliance** | Depends on your process | Built in — no pre-delivery reviews, no review gating |

The combination of automated timing + transaction verification means every review on your page is backed by a real Stripe charge. No email-only "verified" badge. No manual invitation list. No wondering whether the reviewer actually bought something. See [Stripe proof of purchase verification](/blog/stripe-proof-of-purchase-verification/) for how the verification architecture works end-to-end.

---

**Further reading:** [How to Collect Verified Customer Reviews](/blog/how-to-collect-verified-customer-reviews/) · [Stripe Verified Reviews](/blog/stripe-verified-reviews/) · [Stripe Proof of Purchase Verification](/blog/stripe-proof-of-purchase-verification/) · [How Stripe Review Verification Works](/blog/how-stripe-review-verification-works/)
