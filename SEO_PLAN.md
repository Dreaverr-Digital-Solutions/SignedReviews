# SignedReviews — SEO Plan

**Site:** signedreviews.com · **Repo:** `Dreaverr-Digital-Solutions/SignedReviews` · **Date:** 2026-07-22 · **Owner:** marketing/dev
**ICP:** Any business that runs on **Stripe** (e-commerce, SaaS, services, creators).
**Goal:** Trial signups + Stripe integrations from organic search.
**Data basis:** Free SERP research only (no Ahrefs/SEMrush). Volumes are Low/Med/High estimates from SERP shape, not exact numbers. Re-prioritize once Google Search Console has 30 days of data.

---

## 0. Strategic thesis (read first)

Two findings drive the entire plan:

1. **The "Stripe / transaction-verified review" category is a "blue SERP" — it barely exists in Google's index.** Queries like `stripe verified reviews`, `transaction verified reviews`, `payment verified reviews`, `proof of purchase reviews` return reviews *of Stripe-as-a-processor* and generic "what is a verified review" definitions. No incumbent ranks for the actual concept — **because no incumbent does it.** Trustpilot/Reviews.io/Yotpo/Judge.me/Okendo/Loox/Stamped/Feefo/eKomi/Bazaarvoice all verify against data the *merchant* supplies. SignedReviews verifies against **Stripe itself**.

2. **The verification spectrum has an empty rightmost column — and that's the gap.**

```
None            Email-only        Self-attested            Merchant-supplied         Processor-attested
 |                 |                    |                          |                          |
GBP, Yelp    SiteJabber        Trustpilot (organic)      Yotpo/Judge.me/Stamped      [empty lane]
                               Trustpilot (invited)      Okendo/Loox/Feefo/eKomi           ▲
                               Reviews.io                Skeepers/Verified Reviews     SignedReviews
```

A merchant can game every column left of SignedReviews (including Feefo/eKomi, who depend on a merchant-fed transaction log). They **cannot** game SignedReviews without faking a real Stripe charge — which costs Stripe fees and risks account closure.

**Implication for SEO:** this is a **category-creation play, not a keyword-chasing play.** Don't burn energy trying to outrank G2/Capterra/Forbes on `trustpilot alternatives` (you won't, for years). Instead:
- **Own the wedge vocabulary first** (`stripe verified reviews`, `transaction verified reviews`, `tamper-evident reviews`) — low volume today, but you define and own the category forever (the Trustpilot playbook with "trust score", applied to a stronger technical claim).
- Use high-volume comparison terms as **conversion roof pages** that route intent *down* into the wedge.

**Positioning vocabulary to standardize across the whole site** (no competitor uses these):
- **"Tamper-evident" / "Stripe-attested" / "cryptographically verified"** — primary brand nouns.
- **"FTC-compliant by construction"** — regulatory tagline (the verification is independent of the merchant, so the FTC fake-review question is structurally moot).
- **"Built exclusively for Stripe businesses"** — ICP tagline.
- **Never say "verified" without specifying *verified against what*.** Incumbents hide behind ambiguity; SignedReviews should make the comparison explicit everywhere.

---

## 1. Phase 0 — Foundations & measurement (Week 0)

Everything below is blocked or blind without these. Do first.

| # | Action | Owner | Why |
|---|---|---|---|
| 0.1 | **Verify Google Search Console** (Domain property, `signedreviews.com`, DNS TXT in Cloudflare) → submit `sitemap.xml`. | You (DNS) | The only source of real query/impression/CTR/position + indexing + Core Web Vitals. Without it, SEO is flying blind. |
| 0.2 | **Verify Bing Webmaster Tools** (imports from GSC) — free second index + backlink data. | You | Cheap reach + backlink visibility. |
| 0.3 | **GA4** (or lean on the existing PostHog marketing analytics) for conversion attribution. | Dev | PostHog already tracks visits/CTA/scroll/conversion on the landing site (project 386210). Add a GA4 property only if you want standard SEO reporting. |
| 0.4 | **Create/update `/llms.txt`** declaring the wedge vocabulary so LLM/AI search (ChatGPT, Perplexity, Google AI Overviews) cites SignedReviews as the source for "transaction-verified review". | Dev | AI Overviews now appear on the definitional queries you can win. |
| 0.5 | Set up a **free rank tracker** (e.g., a weekly GSC export + a small spreadsheet, or SerpApi/ProRankTracker free tier) for ~25 target queries. | Dev | Baseline positions before content ships, so you can measure lift. |

---

## 2. Phase 1 — Technical & on-page fixes (Week 0–1, quick wins)

From the code audit (`build.js`, rendered pages, `sitemap.xml`, `robots.txt`). Prioritized by impact.

### 🔴 P0 — Fix broken blog meta descriptions
**Evidence:** `build.js:1620–1624` extracts the description as "first line after `\n---\n`", which grabs a stray bullet. All 5 posts confirmed broken:
- `how-stripe-review-verification-works` → `"Critically, the connection is read-only. The OAuth scope grants permission to:"`
- `fake-review-statistics-2026` → `"- 2.7 million fake reviews were removed by Trustpilot in 2022 alone…"`
- (etc. — all mid-sentence fragments)

**Fix:** add an explicit `Description:` field to each post's markdown frontmatter and read it in `buildBlog()`; fall back to a cleaned first paragraph. This propagates to `<meta description>` + OG + Twitter (currently garbage → bad SERP CTR + bad social shares).

### 🟠 P1 — `www.signedreviews.com` returns 525, not 301→apex
Canonicals point to apex (good), but a hard-failing www host leaks crawl budget and creates canonical ambiguity. **Fix:** add a www→apex **301 redirect** at Cloudflare (Page Rule or Redirect Rule). Confirm apex is the canonical host in GSC settings.

### 🟠 P1 — Schema gaps
| Missing | Where to add | Schema type |
|---|---|---|
| `BreadcrumbList` | Every page (sitewide, via `page()`) | BreadcrumbList |
| `HowTo` | how-to-collect-verified-customer-reviews, how-it-works | HowTo |
| `Service` / `Product` + `Offer` | `/vs/*`, `/pricing`, `/how-it-works` | Service / Product |
| `ItemList` | every listicle (alternatives, "best …") | ItemList (enables rich list results) |
| Richer `BlogPosting` | all blog posts (add `image`, `dateModified`, `mainEntityOfPage`, `author` as `Person`) | Article/BlogPosting |
| `Organization` sitewide | currently homepage only — add to `page()` or via a single sitewide node + `sameAs` social profiles | Organization |

> ⚠️ **Do NOT** put self-serving `AggregateRating`/`Review` schema on your own product pages — Google penalizes it. Reserve rating schema for *merchants'* public profile pages (your `/:slug` pages showing their customers' reviews), where it's legitimate.

### 🟠 P1 — Article-specific OG images
Currently one generic logo (`SignedReviews_full_logo.png`) on every page. Generate **1200×630 social images per article** (title + brand) — big CTR lift on social shares and SERP feature images. Can be generated at build time (e.g., a small script wrapping a headless renderer or an image template).

### 🟡 P2 — Sitemap freshness signal
`build.js:1923` sets `lastmod = today` for all 26 URLs every build, so Google sees every page "changed" on every deploy — diluting the signal. **Fix:** use real per-page dates (blog = published date; static pages = a fixed last-edited date). Optional: add `<priority>`/`<changefreq>` and an image-sitemap.

### 🟡 P2 — E-E-A-T
Author = Organization only, no author bios, no `Person` schema. For trust/reviews content (borderline YMYL), add: author bylines with short bios, `Person` schema, an "expertise" page, and link to founder/team credentials.

### 🟢 P3 — Polish
- Internal linking is thin (see §6).
- Confirm `<html lang="en">` everywhere (present), add `hreflang` only if you localize (de).
- Add `<link rel="me">`/`sameAs` social profiles to Organization schema.
- Page speed: the static site is already fast; watch the inline theme-toggle JS and the Google Fonts request (self-host fonts or `font-display: swap` is already set).

---

## 3. Phase 2 — Keyword strategy (8 clusters, by priority not volume)

| # | Cluster | Intent | Competition | Wedge fit | Notes |
|---|---|---|---|---|---|
| **A** | **Transaction / payment-verified reviews** | Commercial | **Blue SERP — own it** | ★★★ | `stripe verified reviews`, `transaction verified reviews`, `payment verified reviews`, `proof of purchase reviews`, `verify customer reviews against stripe`. Low volume today; you create the category. |
| **B** | Trustpilot & competitor alternatives | Commercial | High (G2/Capterra/listicles) | ★★ | `trustpilot alternatives`, `…for small business`, `…for ecommerce/saas`, `reviews.io alternative`, `yotpo alternative`, `judge.me alternative`, `okendo alternative`. Differentiate every entry by **verification method**. |
| **C** | The fake-review problem | Informational | Med-High | ★★ | `fake review statistics 2026`, `how common are fake reviews`, `can trustpilot reviews be faked`, `fake reviews on shopify`, `fake review laws / FTC`. Top-of-funnel demand-creator. |
| **D** | How to collect / get reviews | Informational | Med | ★★ | `how to collect verified customer reviews`, `how to get reviews for online store`, `post purchase review email template`, `best time to ask for a review`, `how to verify a customer actually bought`. |
| **E** | Review tools by platform/stack | Commercial | High (Shopify App Store/G2) | ★★ | `review app for stripe payments`, `stripe app for reviews`, `best review tool for saas` (**intent/SERP mismatch — see §5**), `saas review collection tool`. Avoid head-on fights with Shopify-app listicles. |
| **F** | What-is / definitional | Informational | Low-Med | ★★★ | `what is a verified review`, `verified review meaning`, `difference between verified and unverified reviews`, `how does review verification work`. **Critical for AI Overview / LLM citation** — own the definition. |
| **G** | Comparison / X-vs-Y | Commercial | Med (narrow per-pair) | ★★★ | The most winnable lane for a new entrant — each `/vs/X` is its own small SERP. See §5. |
| **H** | Review trust / display / schema | Informational/Commercial | High (SEO authorities) | ★ | `review schema markup`, `how to display reviews on website`. Treat as a supporting template hub, not a primary target. |

**Cannibalization rules (from SERP-overlap analysis):**
- Do **not** publish both `/blog/trustpilot-alternatives` and `/blog/best-trustpilot-alternatives` (7+ SERP overlap → they cannibalize). Make the existing post the canonical mega-listicle.
- Differentiate `/vs/trustpilot` (head-to-head feature/pricing table) from `/blog/trustpilot-alternatives` (ranked list of 8–10 tools) — same SERP, different formats.
- `/blog/what-is-a-verified-review` and `/blog/how-stripe-review-verification-works` (≈2 overlap) — keep separate, interlink aggressively.

---

## 4. Phase 3 — Competitor strategy

### 4.1 Verification spectrum (your positioning anchor)
See the diagram in §0. Memorize it. Every comparison page and every sales conversation reduces to "where does the competitor sit on this spectrum, and why is the rightmost column empty."

### 4.2 Competitor matrix (the ones that matter)
| Competitor | Actual verification method | Trust root | Your angle |
|---|---|---|---|
| **Trustpilot** | "Verified" only via merchant's invitation flow; organic reviews unverified | Merchant email flow | "Their 'Verified' means *invited*. Ours means *paid*." (361M reviews, ~55% market share — the whale.) |
| **Feefo** | Closed/invitation-only, merchant-fed transaction log | Merchant feed | *Closest positioning competitor.* "Feefo trusts the merchant's feed. We trust Stripe." |
| **eKomi** | "Transaction-verified", Google Review Partner, merchant-fed | Merchant feed | *Closest transaction-verified competitor.* "eKomi verifies a feed you supply. We verify against Stripe itself." + Google Seller Ratings parity. |
| **Judge.me** | Auto-verified via Shopify order API | Shopify order data | #1 Shopify app (127M reviews). "Excellent — but 'verified' trusts your Shopify data. Ours trusts Stripe." Fight on verification, not price. |
| **Yotpo** | "Verified Buyer" via Mail-After-Purchase email / order match | Merchant MAP email | Enterprise DTC default. "Yotpo's Verified Buyer = the MAP email worked. Ours = a real Stripe charge." |
| **Reviews.io** | "Verified Buyer" via email match + manual receipt | Merchant order data | Most-recommended Trustpilot alternative. "The difference that matters when a review is disputed." |
| **Okendo / Stamped / Loox / Skeepers** | Shopify order data / merchant feed | Merchant data | Premium/mid Shopify. Same spine: verification tied to merchant data, not the processor. |
| **SiteJabber** | Email + optional receipt | Email + opt-in | **FTC order Nov 2024** for reviews from people who'd never received products. News-hook page gold. |
| **Google Business Profile / Yelp** | None (algorithmic filter) | None | "Anyone can review. Only paying customers can review on SignedReviews." |
| **SnapSentiment** (Stripe Marketplace) | Sends request after Stripe payment | Stripe payment success (merchant-triggered) | *Closest distribution-channel competitor.* Thin product, weak copy. Harden your Stripe Marketplace listing to dominate the category there. |

### 4.3 Seven gaps to exploit
1. **"The merchant attests to itself"** — every incumbent's "Verified Buyer" reduces to *the merchant told us this person bought*. Publish the canonical explainer (the #1 content asset — see §5).
2. **"Tamper-evident / cryptographically attested"** — vocabulary no competitor uses; make it the primary brand noun.
3. **FTC/regulatory angle** — SiteJabber FTC order (Nov 2024) + UK fake-reviews ban (eff. 6 Apr 2025) + Trustpilot removed **4.5M fake reviews in 2024 (7.4% of submissions)**. Position as "FTC-compliant by construction."
4. **Stripe-only ICP exclusivity** — "if you're on Stripe, this is the only review tool fully built for you." Sharp ICP signals convert and rank.
5. **SaaS-on-Stripe is unserved** — the "best review platform for SaaS" SERP is dominated by *aggregators* (G2/Capterra/TrustRadius), not installable tools. **Intent/SERP mismatch you can win** (see §5).
6. **Post-Trustpilot-burn persona** — Reddit r/ecommerce + r/marketing are full of merchants paying $15–20K/yr, unable to remove unverified one-star reviews. No alternative leads with "we verify, they don't."
7. **Stripe Marketplace is under-defended** — 3 thin apps (SnapSentiment, Goodreviews, Local Reviews). Your live Stripe App should own the "Stripe-native verified reviews" category on the marketplace itself.

---

## 5. Phase 4 — Content architecture & priority pages

### 5.1 The #1 asset: the canonical explainer
**`/learn/what-does-verified-buyer-mean`** (or `/blog/…`) — the honest answer to "what does 'Verified Buyer' actually mean on Trustpilot/Yotpo/Judge.me/Reviews.io?" **Zero competitors publish this honestly.** It becomes the citation target every comparison page links to. Highest-leverage single piece of content. (Pairs with `/learn/how-fake-reviews-work` and `/learn/ftc-fake-reviews-rules` as linkable pillars.)

### 5.2 The biggest SERP mismatch
**"Best review tool for SaaS companies"** listicle. The current SERP returns review *aggregators* (G2/Capterra/TrustRadius) — directories SaaS firms get *listed on*, not tools they *install*. There is **no installable review product purpose-built for SaaS-on-Stripe** (subscription = recurring charge). Publish the canonical listicle; it ranks because it's the only page that actually answers the question. **Single biggest mismatch in the niche.**

### 5.3 Hub-and-spoke (6 pillars)
| Pillar (hub) | Spokes |
|---|---|
| **`/blog/stripe-verified-reviews`** (NEW — the wedge pillar) | refresh `how-stripe-review-verification-works` + `what-is-a-verified-review` + `how-to-collect-verified-customer-reviews`; NEW `transaction-verified-reviews`, `purchase-verified-vs-email-verified-reviews` |
| **`/blog/trustpilot-alternatives`** (expand existing) | all `/vs/*` pages; NEW `trustpilot-pricing-explained`, `trustpilot-alternatives-for-ecommerce`, `…for-saas` |
| **`/blog/fake-reviews`** (NEW hub) | refresh `fake-review-statistics-2026`; NEW `how-to-spot-fake-reviews`, `are-trustpilot-reviews-reliable`, `fake-shopify-reviews`, `fake-review-laws-ftc` |
| **`/blog/how-to-collect-reviews`** (broaden existing) | NEW `post-purchase-review-email-templates`, `how-to-get-reviews-on-shopify`, `how-to-collect-reviews-for-saas`, `best-time-to-ask-for-a-review`, `how-to-verify-a-customer-actually-bought` |
| **`/integrations/stripe`** (NEW) | NEW `/integrations/shopify`, `/integrations/woocommerce`, `/integrations/saas`; NEW `stripe-app-for-reviews`, `review-app-for-stripe-payments` |
| **`/learn/`** (NEW — definitional/authority) | `what-does-verified-buyer-mean`, `how-fake-reviews-work`, `ftc-fake-reviews-rules` |

### 5.4 Comparison pages — build order (highest ROI first)
| Tier | Page | Winning H1/angle |
|---|---|---|
| **1 (now)** | `/vs/trustpilot` (refresh) | "Their 'Verified' means *Invited*. Ours means *Paid*." Diagram the verification chain; cite Reddit rage + Trustpilot's 7.4% fake-removal stat. |
| **1** | `/vs/feefo` | "Feefo trusts the merchant's transaction feed. We trust Stripe." (Sales-defensive — every deal hits this.) |
| **1** | `/vs/judge-me` | "Judge.me is excellent. But its 'verified' trusts your Shopify data. Ours trusts Stripe." |
| **1** | `/vs/yotpo` | "Yotpo's Verified Buyer = the merchant's MAP email worked. Ours = a real Stripe charge." |
| **1** | `/vs/ekomi` | "eKomi verifies a feed you supply. We verify against Stripe itself." + Google Seller Ratings parity. |
| **2 (Q1)** | `/vs/reviews-io`, `/vs/stamped`, `/vs/okendo`, `/vs/loox`, `/vs/skeepers` | Same spine: verification tied to merchant data, not the processor. |
| **3 (breadth)** | `/vs/google-reviews`, `/vs/yelp`, `/vs/clutch` | "Anyone can review there. Only paying customers can review here." |
| **3 (news hook)** | `/vs/sitejabber` | "SiteJabber got an FTC order (2024) for reviews from people who never received products. We structurally can't have that problem." Link magnet. |

> Each `/vs/X` is a **narrow SERP with limited players** — the most realistic entry point against entrenched DR-90 domains. Build to 1,500–2,500 words with a real feature/pricing table, a verification-chain diagram, and an FAQ block (FAQPage schema).

---

## 6. Phase 5 — On-page optimization, per page type

| Page type | Template | Schema | Internal-link duty |
|---|---|---|---|
| Wedge pillar (`stripe-verified-reviews`) | Definitional + technical explainer (2,000+ words) | Article + FAQPage + BreadcrumbList | Links to every wedge spoke + `/how-it-works` + `/pricing` |
| Explainer (`/learn/…`) | E-E-A-T deep-dive, cited | Article + definedTerm-eligible + FAQPage | Citation target — linked from all `/vs/*` |
| Listicle (`trustpilot-alternatives`, "best …") | Ranked, 8–10 items, scored on **verification method** | ItemList + FAQPage + BreadcrumbList | Each item → relevant `/vs/X`; → wedge pillar |
| Comparison (`/vs/X`) | Head-to-head table + verification diagram + FAQ | Service/Product + FAQPage + BreadcrumbList | → explainer + → `/pricing` CTA |
| Blog post | 1,500–2,500 words, author byline, related-posts | BlogPosting (full) + BreadcrumbList | → cluster pillar + → wedge pillar |
| Integration page (`/integrations/stripe`) | Product-led, setup steps | SoftwareApplication + HowTo | → `/api`, `/docs`, wedge pillar |

**Internal-linking rules:** every spoke → its pillar (bidirectional); every comparison → the explainer; every wedge spoke → `/how-it-works` + `/pricing` CTA; no orphans (≥3 inbound links each). The `what-is-a-verified-review` post is the definitional junction — it links to all five content pillars.

---

## 7. Phase 6 — Off-page / backlinks (bootstrapped, no big budget)

| Tactic | Effort | Expected yield |
|---|---|---|
| **Harden the Stripe Marketplace listing** — own the "reviews" category there (vs SnapSentiment/Goodreviews/Local Reviews). Captive, high-intent distribution. | Low | High (transactional intent on a trusted domain) |
| **Get LISTED on review aggregators** — G2, Capterra, GetApp, SourceForge, TrustRadius, Crozdesk. (Being listed captures branded + "best …" aggregate traffic you can't otherwise touch.) | Med | Med-High |
| **Shopify App Store listing** (if/when a Shopify install exists) — the single biggest review-app distribution channel. | High (build) | Very high for e-com ICP |
| **PR/journalist outreach via the fake-review + FTC hook** — SiteJabber FTC order, UK ban, Trustpilot's 7.4% fake rate, WEF's $152B figure. Use Connectively (ex-HARO)/ResponseSource to pitch journalists covering fake reviews; offer the "FTC-compliant by construction" angle. | Med | High-authority backlinks |
| **Linkable assets** — the `what-does-verified-buyer-mean` explainer, `fake-review-statistics-2026`, `ftc-fake-reviews-rules`. These earn citations naturally. | (content in §5) | Compounding |
| **Founder thought-leadership** — the "every alternative still has the fake-review problem" thesis; pitch to e-com/SaaS publications (Practical Ecommerce, Shopify blog comments, Reddit with care). | Med | Brand + links |
| **Partner/ecosystem content** — Stripe, Shopify, WooCommerce developer/community content + cross-links. | Med | Med |
| **Public business profile pages** (`/:slug`) — your existing indexed merchant pages are a long-tail + directory asset; add rating schema there (legitimate, merchant's own customers). | Low | Long-tail traffic compounding |

**Avoid:** paid links, PBNs, mass guest-post spam — Google's 2024–2026 link spam updates are aggressive, and a new domain has no authority buffer.

---

## 8. Phase 7 — Measurement & KPIs

| Layer | Metric | Source |
|---|---|---|
| **Acquisition** | Organic sessions, organic landing pages | PostHog (project 386210) / GA4 |
| **Visibility** | Impressions, avg position, CTR, **queries** driving impressions | Google Search Console |
| **Indexation** | Indexed pages, coverage errors, Core Web Vitals | GSC + PageSpeed Insights |
| **Ranking** | Position for ~25 target queries (wedge + comparison + SaaS listicle) | Rank tracker (§0.5) |
| **Engagement** | Scroll depth, section views, CTA clicks (already tracked) | PostHog marketing analytics |
| **Conversion** | Trial signups from organic; signup→integration rate | PostHog + backend |
| **Off-page** | Referring domains, DR trajectory | Bing WT (free) / Ahrefs free / Moz free (later) |

**Review cadence:** weekly GSC query/position delta; monthly full review + re-prioritize clusters using real impression data (this replaces the Low/Med/High estimates).

---

## 9. Phase 8 — 90-day roadmap

### Sprint 0 — Foundations (Week 0)
- GSC + Bing Webmaster verified, sitemap submitted. (You — DNS)
- 🔴 Fix blog meta-description bug (`build.js` frontmatter `Description:`).
- 🟠 www→apex 301 at Cloudflare.
- `/llms.txt` created.
- Schema foundation: add `BreadcrumbList` to `page()`; sitewide `Organization` node.
- Sitemap real `lastmod`.
- Rank tracker baseline (~25 queries).

### Sprint 1 — Own the wedge (Weeks 1–4)
- `/blog/stripe-verified-reviews` pillar (NEW).
- `/learn/what-does-verified-buyer-mean` (the #1 asset).
- Refresh existing 5 posts: wedge vocabulary, fixed descriptions, full `BlogPosting` schema, internal links to pillars.
- `/integrations/stripe`.
- Generate per-article OG images.

### Sprint 2 — Comparison warfare (Weeks 5–8)
- `/vs/trustpilot` (refresh + verification-chain diagram).
- `/vs/feefo`, `/vs/judge-me`, `/vs/yotpo`, `/vs/reviews-io`, `/vs/ekomi`.
- "Best review tool for SaaS companies" listicle (the SERP-mismatch win).
- Expand `/blog/trustpilot-alternatives` into the mega-listicle (scored on verification method).

### Sprint 3 — Authority + off-page (Weeks 9–12)
- `/vs/sitejabber` (FTC news hook), `/vs/stamped`, `/vs/okendo`, `/vs/loox`, `/vs/skeepers`.
- `/blog/fake-reviews` hub + `how-to-spot-fake-reviews` + `fake-review-laws-ftc`.
- Collection spokes: `post-purchase-review-email-templates`, `best-time-to-ask-for-a-review`.
- Harden Stripe Marketplace listing; submit to G2/Capterra/GetApp/SourceForge/TrustRadius.
- Begin PR outreach on the FTC/fake-review hook.

---

## 10. Tooling decision (free now, paid later)

**Now (free):** Google Search Console, Bing Webmaster Tools, Ahrefs *Free* (Keyword Generator + Webmaster Tools), your PostHog analytics, and the SERP research already in this plan. This covers a strong launch + first 3–6 months.

**Later (revisit in ~3 months, once GSC shows where you have traction):**
- **Ahrefs Lite (~$109/mo)** or **SEMrush (~$130/mo)** — earns its keep when you're publishing regularly and need precise keyword-difficulty targeting, backlink-gap analysis, and automated rank tracking.
- **DataForSEO API** (pay-as-you-go) — cheaper à-la-carte alternative for volumes/SERP/backlinks if you don't want a full subscription.

The plan is deliberately executable without any paid tool; paid tools sharpen prioritization, they don't enable it.

---

## Appendix A — Sources (free research)
Trustpilot help/Trust Report/Wikipedia; Reviews.io moderation FAQs; Yotpo/Judge.me/Stamped/Okendo/Loox verification docs; **FTC SiteJabber order (Nov 2024)**; Clutch methodology; Feefo + eKomi resources; Verified Reviews (Skeepers); SnapSentiment (Stripe Marketplace); WEF ($152B fake-reviews); UK Gov fake-reviews research; Reddit r/ecommerce + r/marketing Trustpilot threads; WiserNotify/WiserReview/RightResponse/WebAppMeister/Oxify/Brand Hopper/Charle listicles. (Full URL list in the research transcripts.)

## Appendix B — Cannibalization & risks
- Don't duplicate `trustpilot-alternatives` variants (7+ SERP overlap).
- Keep `/vs/trustpilot` (comparison) and `/blog/trustpilot-alternatives` (listicle) differentiated by format.
- Year-anchor pages (`…2026`) — refresh annually, keep the URL.
- No self-serving `AggregateRating` on your own product pages (Google penalty); use rating schema only on merchant profile pages.

## Appendix C — Execution note for the dev
All content-route generation flows through `build.js` (`SHARED_HEAD`, `page()`, `writePage`, `buildBlog`, `buildSeoFiles`). New page types (e.g., `/learn/`, expanded `/vs/`, `/integrations/stripe`) = new builder functions following the existing `writePage` + schema-injection pattern; add their slugs to the `urls` array in `buildSeoFiles()` (`build.js:1924`) so they enter the sitemap automatically.
