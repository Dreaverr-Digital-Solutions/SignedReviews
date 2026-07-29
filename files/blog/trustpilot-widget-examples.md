# Trustpilot Widget Examples: What They Look Like, Where They Go, and What Each One Does

**Published:** 2026-07-29 · **Author:** Signed Reviews Team · **Description:** See real Trustpilot widget examples — TrustBox, carousel, product reviews, and service review widgets — plus how they compare to purchase-verified alternatives.**

---

Trustpilot ships with a library of embeddable widgets called TrustBoxes. They're one of the platform's main selling points — the promise is that dropping a widget on your site boosts conversion by displaying social proof. But not all widgets are equal, and which one you use depends on what you're trying to prove. This post shows every major Trustpilot widget with examples of where it actually appears and what it communicates to visitors.

---

## What is a Trustpilot widget?

A Trustpilot widget (TrustBox) is a snippet of JavaScript that pulls your Trustpilot rating and reviews onto your own website. You paste a `<div>` and a `<script>` tag into your page, and Trustpilot renders the widget dynamically. Widgets update automatically when new reviews come in — you don't rebuild or redeploy anything.

There are roughly a dozen widget types, but they fall into three categories:

1. **Trust badges** — small icons showing your star rating and Trustpilot score
2. **Review displays** — carousels or grids showing individual review text
3. **Combination widgets** — star rating + review count + mini-carousel in one unit

All of them are configurable through Trustpilot's Business dashboard, and most come in light and dark themes.

---

## TrustBox examples by category

### 1. Micro Star (the simplest widget)

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;text-align:center;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <p style="margin:0;display:flex;align-items:center;justify-content:center;gap:.5rem;flex-wrap:wrap">
    <span style="font-weight:700;color:#191919;font-size:1.1rem">Excellent</span>
    <span style="color:#00b67a;font-size:1.1rem">★★★★★</span>
    <span style="color:#696969;font-size:.9rem">4.3 on Trustpilot</span>
  </p>
</div>

This is the smallest TrustBox — a single line showing your star rating, your TrustScore, and the word "Trustpilot." It's designed for headers, footers, and checkout flows where you want social proof without taking up much space.

**Where you see it:** Site-wide headers, e-commerce checkout pages, SaaS billing pages, email signatures (as a static image version).

**What it signals:** "Other people vouch for us." It's a trust heuristic, not a verification claim — the stars could be from invited or organic reviews. The visitor doesn't know which.

### 2. Micro Review Count

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;text-align:center;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <p style="margin:0;display:flex;align-items:center;justify-content:center;gap:.5rem;flex-wrap:wrap">
    <span style="color:#00b67a;font-size:1.1rem">★★★★★</span>
    <span style="font-weight:700;color:#191919;font-size:1.1rem">4.3</span>
    <span style="color:#696969;font-size:.9rem">· 1,234 reviews on Trustpilot</span>
  </p>
</div>

Same compact format, but adds the review count. The number matters — "1,234 reviews" is more convincing than "4 stars" alone. Research consistently shows that review volume is as important as review score in purchase decisions.

**Where you see it:** Product pages on mid-market e-commerce sites, SaaS landing pages below the hero, small business websites.

### 3. Mini Carousel (the most common widget)

The mini carousel combines stars, review count, and a rotating selection of review snippets into one box:

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
    <span style="color:#00b67a;font-size:1.1rem">★★★★★</span>
    <span style="font-weight:700;color:#191919">TrustScore 4.3</span>
    <span style="color:#696969;font-size:.85rem">· 1,234 reviews</span>
  </div>
  <div style="border-top:1px solid #e0e0e0;padding-top:.75rem">
    <p style="margin:0;font-size:.9rem;color:#333;font-style:italic">"Great service, fast delivery. Would definitely order again."</p>
    <p style="margin:.25rem 0 0;font-size:.8rem;color:#696969">— Sarah J., 2 days ago</p>
  </div>
</div>

This is the widget you'll see most often on SaaS landing pages and e-commerce homepages. It cycles through recent reviews automatically.

**Where you see it:** SaaS homepage hero sections (below the CTA), e-commerce homepage, "About Us" pages, landing pages for paid campaigns.

**The trade-off:** The rotating snippets are selected by recency, not relevance. A visitor researching your product might see a review about your shipping speed when they care about your return policy. And because the widget shows the most recent reviews, a single bad review that lands at the top of the queue sits front-and-center until newer reviews push it down.

### 4. Product Reviews Widget (e-commerce specific)

A more detailed widget built for product pages, showing star breakdown and individual review cards:

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
    <span style="color:#00b67a;font-size:1.1rem">★★★★★</span>
    <span style="font-weight:700;color:#191919">4.3 out of 5</span>
    <span style="color:#696969;font-size:.85rem">· 89 reviews for this product</span>
  </div>
  <div style="font-size:.8rem;color:#696969;margin-bottom:.5rem">
    5 ★ — 72% &nbsp; 4 ★ — 15% &nbsp; 3 ★ — 7% &nbsp; 2 ★ — 3% &nbsp; 1 ★ — 3%
  </div>
</div>

This is the widget Trustpilot positions for e-commerce product detail pages. It aggregates reviews for a specific SKU (via product ID), not your business overall.

**Where you see it:** Product detail pages on Shopify stores, BigCommerce product pages, Magento product listings.

**The catch:** Setting up product-level reviews requires mapping your product catalog to Trustpilot's product IDs and passing them in review invitations. It's not automatic — it requires integration work, and on some tiers it requires API access (which is gated behind higher plans or sold as an add-on).

### 5. Service Review Widget (for non-e-commerce)

Same structure as the product widget but designed for service businesses where there's no SKU — just a business profile rating and service-level reviews:

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
    <span style="color:#00b67a;font-size:1.1rem">★★★★★</span>
    <span style="font-weight:700;color:#191919">4.3 out of 5 — Excellent</span>
  </div>
  <div style="font-size:.85rem;color:#696969;margin-bottom:.75rem">Based on 1,234 service reviews</div>
  <div style="display:flex;flex-wrap:wrap;gap:.5rem">
    <span style="background:#e8f5e9;color:#2e7d32;padding:.25rem .6rem;border-radius:12px;font-size:.75rem">Customer service: 4.5</span>
    <span style="background:#e8f5e9;color:#2e7d32;padding:.25rem .6rem;border-radius:12px;font-size:.75rem">Quality: 4.2</span>
    <span style="background:#e8f5e9;color:#2e7d32;padding:.25rem .6rem;border-radius:12px;font-size:.75rem">Value: 4.1</span>
  </div>
</div>

**Where you see it:** Insurance company landing pages, SaaS pricing pages, telco provider sites, professional services websites.

### 6. Grid Widget (full-page review display)

A larger embed that shows multiple review cards in a responsive grid — typically 3-4 columns on desktop, stacking to 1 on mobile:

<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;margin:1.5rem 0;font-family:Inter,system-ui,sans-serif">
  <p style="font-weight:700;color:#191919;margin:0 0 .75rem">Latest reviews</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
    <div style="border:1px solid #f0f0f0;border-radius:6px;padding:.75rem">
      <p style="margin:0;font-size:.85rem;color:#00b67a">★★★★★</p>
      <p style="margin:.25rem 0;font-size:.85rem;color:#333">"Exactly what we needed. Easy setup and the widget looks great on our site."</p>
      <p style="margin:.25rem 0 0;font-size:.75rem;color:#696969">— Michael T.</p>
    </div>
    <div style="border:1px solid #f0f0f0;border-radius:6px;padding:.75rem">
      <p style="margin:0;font-size:.85rem;color:#00b67a">★★★★★</p>
      <p style="margin:.25rem 0;font-size:.85rem;color:#333">"Good platform for collecting reviews. Wish the pricing was more transparent."</p>
      <p style="margin:.25rem 0 0;font-size:.75rem;color:#696969">— Emma R.</p>
    </div>
    <div style="border:1px solid #f0f0f0;border-radius:6px;padding:.75rem">
      <p style="margin:0;font-size:.85rem;color:#00b67a">★★★★</p>
      <p style="margin:.25rem 0;font-size:.85rem;color:#333">"Decent. The widgets work fine but we had issues with fake reviews from non-customers."</p>
      <p style="margin:.25rem 0 0;font-size:.75rem;color:#696969">— David L.</p>
    </div>
  </div>
</div>

**Where you see it:** Dedicated "Reviews" pages, customer story pages, footer sections on large e-commerce sites.

**The performance consideration:** Every widget loads external JavaScript from Trustpilot's CDN. Multiple widgets on one page mean multiple script loads. On product pages that already have analytics, ad trackers, and other third-party scripts, adding a TrustBox can push page weight over the edge — which is why some sites lazy-load widgets below the fold.

---

## How Trustpilot widgets decide what to show

Trustpilot widgets pull from the same review pool — your Trustpilot profile — regardless of widget type. This means:

- **All reviews appear in widgets, not just invited ones.** If someone leaves an unverified organic review on your Trustpilot profile, it has the same chance of appearing in your widget as a verified invited review.
- **Recency determines visibility, not relevance.** The carousel shows the newest reviews, not the ones most relevant to the page the visitor is on.
- **You can't filter by verification status.** Trustpilot doesn't give you a widget setting that says "only show reviews from verified purchases." The widget shows everything.

This is the fundamental trade-off of the TrustBox: you get a polished, recognizable social-proof widget, but you don't get to control which reviews appear in it — or whether they're verified by anything stronger than an email invitation.

---

## The alternative: verification-first embeds

Signed Reviews takes a different approach to the widget problem: instead of pulling from a public profile where anyone can contribute, every embedded review carries cryptographic proof that it came from a completed Stripe transaction.

The embed isn't a third-party `<script>` from an external CDN — it's a self-contained element rendered server-side from your own review data. No external requests, no third-party cookies, no widget loading delay.

| Widget feature | Trustpilot TrustBox | Signed Reviews embed |
|---------------|-------------------|---------------------|
| Star rating display | ✅ | ✅ |
| Review carousel | ✅ | ✅ |
| Review count | ✅ | ✅ |
| Individual review cards | ✅ | ✅ |
| Filters by verification | ❌ (all reviews shown) | ✅ (only purchase-verified) |
| Third-party scripts | 1+ per widget | 0 |
| Cryptographic proof link | ❌ | ✅ (each review has a tamper-evident signature) |
| Refund auto-hide | ❌ (manual) | ✅ (Stripe webhook, instant) |
| Custom styling | Limited (themes) | Full CSS control |

---

## Where to use each widget type (and where it's wasted effort)

Widget placement matters as much as widget type. A widget in the wrong place is invisible; in the right place, it lifts conversion.

| Page | Best widget | Why |
|------|------------|-----|
| **Checkout** | Micro Star | Builds last-moment trust without distracting from the purchase flow |
| **Product detail** | Product Reviews | Shows SKU-specific social proof where the buying decision happens |
| **Homepage hero** | Mini Carousel | First impression for new visitors — rotating snippets work well above the fold |
| **Pricing page** | Service Review + rating breakdown | Buyers on pricing pages are evaluating; detailed proof matters more than volume here |
| **Landing pages (ads)** | Micro Review Count | Fast page load matters for Quality Score; a single line is lighter than a carousel |
| **Footer** | Micro Star | Persistent trust signal without competing for attention |
| **Dedicated reviews page** | Grid Widget | Deep browse for the small percentage of visitors who want to read multiple reviews |

The key insight: **the more expensive your product, the more review detail you should show.** A $10 impulse purchase needs a star rating. A $299/month SaaS subscription needs individual review cards with verification proof.

---

## Bottom line

Trustpilot widgets are polished, widely recognized, and cover the basics. If you're on a paid Trustpilot plan and you're not embedding at least a Micro Star on your checkout and pricing pages, you're leaving conversion on the table.

But the widget itself is only as trustworthy as the reviews it pulls from. If your Trustpilot profile carries unverified reviews alongside invited ones — and every Trustpilot profile does — your widget is displaying both, with no way for the visitor to tell them apart. For businesses where review authenticity is the whole point, a widget that surfaces only purchase-verified reviews (and proves it cryptographically) sends a stronger signal than any TrustBox can.

**Further reading:**
- [Signed Reviews vs Trustpilot](/vs/trustpilot/) — detailed comparison across verification, pricing, and features
- [Trustpilot Pricing Explained](/blog/trustpilot-pricing-explained/) — what each plan actually costs
- [What Does "Verified Buyer" Actually Mean?](/learn/what-does-verified-buyer-mean/) — the verification spectrum explained
- [Are Trustpilot Reviews Reliable?](/blog/are-trustpilot-reviews-reliable/) — what the Transparency Report tells you
