# SEO Meta-Study Blueprint (applied to Signed Reviews)

**Date:** 2026-10-09 · **Status:** gap audit done, fixes in progress
**Source:** podcast episode 1,191 reviewing a r/TechSEO post (author name only heard in audio, not reproduced here): 9,249 SEO/AEO/GEO case studies screened from 30,000+, 552 cited sources, 182 tactics with a number attached. Each document was extracted by two models from two providers. Numbers not literally in the source were dropped. Tactics were graded on evidence strength and actionability separately.

**How to read this file:** every tactic has an effect size, an evidence grade and a Signed Reviews status. The status column is the gap list. Statuses:

- `gap`: we do not do this and the evidence says we should. Fix it.
- `compliant`: we already do this.
- `N/A`: does not apply to our site or business.
- `don't act`: weak, contradictory or negative evidence. Recorded so nobody revisits it.

Evidence grades: **C** = controlled test (N = number of tests), **U** = uncontrolled / before-after, **B** = bundle (many changes at once, so the cause is unknown).

---

## 1. Title tags and SERP snippets

The study's biggest surprise: title tag tests moved organic traffic more than anything else, often by 15-40%. Everyone is focused on AI answers, but the 10 blue links still decide most clicks.

| # | Tactic | Effect | Grade | Host verdict | Signed Reviews status |
|---|---|---|---|---|---|
| T1 | Whole title in capital letters | +17.5% traffic; +14% on travel listings | C, N=2 | Fun to test | `don't act`. Brand risk, and two tests is thin. |
| T2 | Removing synonym keywords to shorten titles | **-27%** traffic (largest single negative) | C, N=1 | Agrees: long, descriptive titles win | `gap`. Six core pages have 20-25 character titles with no descriptive keyword: /pricing/, /faq/, /blog/, /about/, /features/, /contact/. Expand them. Never strip modifiers from titles that already rank. |
| T3 | Removing the word "compare" from titles | +24% traffic | C, N=1 | No comment | `don't act`. One test. Our two "Compared" titles stay until GSC says otherwise. |
| T4 | Product price in the title | **-15%**; -7% on location pages with static prices | C | Agrees: make people click for the price | `compliant`. No title carries our own price. Keep $29 out of titles. |
| T5 | Number emojis in meta descriptions | -5% | C | Agrees | `compliant`. None. |
| T6 | Emojis in titles | -6% sessions alone | C, N=1 | Never do it | `compliant`. None. |

## 2. Page layout and structure

| # | Tactic | Effect | Grade | Host verdict | Signed Reviews status |
|---|---|---|---|---|---|
| L1 | Moving a search widget from below the hero to the top | -7% | C, N=1 | Surprised; still prefers the answer at the top | `don't act`. One travel test. Our hero stays as is (it must also stay in the served HTML, see CLAUDE.md). |
| L2 | Removing self-referential breadcrumb links | -5.5% clicks | C, N=1 | Dislikes visible breadcrumbs on money pages | `compliant`. We ship BreadcrumbList schema only, no visible breadcrumb links. Fix: the last crumb's `name` currently carries the full `<title>` with the "\| Signed Reviews" suffix. |
| L3 | CTA blocks with brand icons and internal links below product descriptions | +80% conversions | C, N=2 | Agrees: big CTA, above the fold on high-intent pages | `compliant`. Every post ends with a CTA block that links to signup and /how-verification-works/. |

## 3. Indexing

| # | Tactic | Effect | Grade | Host verdict | Signed Reviews status |
|---|---|---|---|---|---|
| I1 | 410 instead of 404 on removed pages | 404 kept 49.6% more pages indexed; 410 drops them about twice as fast | C | Use 410 for gone-forever pages | `compliant`. The three removed posts (how-to-spot-fake-reviews, is-trustpilot-legit, fake-review-laws-ftc) were merged and 301 to their successors (verified live 2026-10-09). No deleted page is without a successor. Rule going forward: merged = 301, gone forever = 410. |

## 4. Links

| # | Tactic | Effect | Grade | Host verdict | Signed Reviews status |
|---|---|---|---|---|---|
| K1 | Editorial backlinks from digital PR | +71% organic sessions | C | Agrees | `gap`, off-site. Authority is our known gap (2026-08-28 re-audit). Outreach lives in OUTREACH2.md; not a code change. |
| K2 | Disavow with an active manual penalty | +80% sessions | C | Only with a penalty | `N/A`. No manual penalty. |
| K3 | Disavow as routine cleanup | No measurable effect; 10 of 14 positive, lowest agreement of any link tactic | U | Don't; it can do harm | `don't act`. |
| K4 | Internal links to orphaned pages | Up to +64 ranking positions | C | Obvious best practice | `gap`. **/for/coaches/ has zero internal links** (not in nav, footer or any body text) yet sits in the sitemap. Add contextual links from related pages and a footer link. |
| K5 | ~100 descriptive footer links on the homepage | +5-10% sessions (SearchPilot, 2021) | C, N=1 | Would not recommend | `don't act`. |

## 5. AI answers (AEO / GEO)

The thinnest evidence in the whole study: about 10 usable entries. Nearly every GEO number is a bundle, so no single GEO tactic has more than one controlled test behind it. Treat these as cheap, sensible defaults, not proven levers. AI citations also flip daily across ChatGPT, Perplexity and Gemini, so a single before/after check proves little.

| # | Tactic | Effect | Grade | Host verdict | Signed Reviews status |
|---|---|---|---|---|---|
| A1 | Quantitative statistics on the page | +37% citations | C (academic) | Makes sense | `compliant` in volume. Posts are full of numbers. The gap is sourcing them, see A3. |
| A2 | Quotes from credible, named sources | +22% to +41% citations | C (academic) | Makes sense | `gap`, low priority. Only add a quote when the exact words were read on the source page. |
| A3 | Citations inline next to the claim (not footnotes) | +40% citations | C, N=1 (practitioner) | Interesting | `gap`. **22 of 27 posts have zero external links** while citing numbers (Trustpilot 4.5M removals, BrightLocal 98%, Spiegel 270%). CLAUDE.md already requires a source for every claim. Link each number inline to a URL that was fetched and checked. Remove any number we cannot source; no common-knowledge exemption. Named test cases: "FTC estimates roughly 1 in 7 reviews is fabricated" (fake-review-checker), "roughly 55% market share" (trustpilot-alternatives-for-small-business), and the first-party "what we've observed across thousands of..." (best-time-to-ask-for-a-review), which must match production data or go. |
| A4 | Keyword stuffing for AI | -10% citations | C (academic) | Agrees | `compliant`. keyword-guard.js and content-lint.js run on copy. |
| A5 | Direct answer in the opening paragraph | +280% | C, N=1 (practitioner) | Strongly agrees | `gap`. About 15 of 27 posts open with a scene-setter and give the answer later (e.g. best-time-to-ask gives no time, trustpilot-pricing-explained gives no price, the alternatives lists name no alternative). Rewrite those openers to answer the title's question in the first one or two sentences. |
| A6 | Discrete factual statements instead of flowing prose | 5x | C, N=1 (practitioner) | Agrees: simple language | `compliant` mostly. Copy rules already push short sentences and numbers. Handled inside A5 rewrites. |
| A7 | Named author bylines | **+113% citations**, even for staff with low public recognition | C | Wow | `gap`. All 27 posts say "Signed Reviews Team" in source, the byline is not rendered, and schema author is an Organization. Decision (user, 2026-10-09): **Robinson Guerra, Founder**. Render a visible byline, emit `Person` author schema, and name the founder on /about/. |
| A8 | Human editing of AI-written text | +67% citations | C | Agrees | `compliant`. Copy rules and the humanization plan cover this. |
| A9 | GEO rewrite bundle | +83.2% citations (12 samples, 6 publishers) | B | Bundles can't tell you which part worked | `don't act` as a bundle. A3, A5 and A7 are its parts we adopt individually. |
| A10 | llms.txt | Median +25% sessions, raw range -9.7% to +81%; **no controlled test exists** | U, N=3 | Could just be "another useful page" | `don't act` on the tactic, but the file exists, so it must be accurate. It still claims reviews "cannot be faked" and that we are "the only platform" attesting against the processor's record. Align it with the claims the landing now makes (commit b81f2a9) and the copy rules. |

## 6. Context flips (same tactic, opposite result)

| # | Tactic | Effect | Signed Reviews status |
|---|---|---|---|
| F1 | Targeted AI copy enriching specific pages | +73% AI citations | `N/A` for now. |
| F2 | Mass AI text across the whole site | **-35% sessions** | `don't act`. Do not mass-generate pages. Niche pages are hand-written, one at a time. |
| F3 | Google Business Profile: broad to niche primary category | +3.4 positions (niche back to broad: -30) | `N/A`. We have no local profile. The lesson carries over: stay niched (Stripe businesses, coaches). |
| F4 | Role/service modifiers in URLs | Positive, no number | `compliant`. /for/coaches/, /vs/<competitor>/, /integrations/stripe/. |
| F5 | Broad high-volume terms in URLs | Traffic dropped | `compliant`. No broad-term slugs. |
| F6 | Emoji in titles inside a full redesign bundle | +1,851 impressions | `don't act` (see T6). |

---

## 7. Fix list (derived from the `gap` rows)

| Order | Fix | Rows | Where |
|---|---|---|---|
| 1 | Link /for/coaches/ from related pages and the footer | K4 | build.js, files/blog/*.md |
| 2 | Named author byline + Person schema + founder on /about/ | A7 | build.js (buildBlog, buildAbout, learn pages), files/blog/*.md |
| 3 | Inline, fetched sources next to every number; drop unsourceable numbers | A3, A2 | files/blog/*.md |
| 4 | Answer-first opening paragraphs on posts that bury the answer (reuse only numbers that survived step 3) | A5, A6 | files/blog/*.md |
| 5 | Descriptive titles for thin core pages (no price, no emoji, no stripping) | T2 | build.js |
| 6 | llms.txt accuracy pass | A10 | llms.txt |
| 7 | BreadcrumbList last-crumb name without the brand suffix | L2 | build.js `breadcrumbJsonLd` |
| off-site | Digital PR backlinks | K1 | OUTREACH2.md |

**Measure it.** Note the deploy date per fix in the rank tracker. Title changes need 4-6 weeks of GSC data before judging. AI-citation changes need repeated checks over several days, never one before/after.

**Guard rails for every edit:** copy rules in CLAUDE.md, `npm run lint:copy`, `node scripts/keyword-guard.js` after title changes, no customer-written text touched, never write a URL or quote that was not fetched and read.

---

## 8. Progress log (2026-10-09, built locally, not committed)

| Fix | Status |
|---|---|
| K4 /for/coaches/ orphan | Superseded (user, 2026-10-09): the page is hidden instead. It stays live at its URL but is noindex, out of the sitemap and llms.txt, and unlinked everywhere. Re-link it (footer + 2 posts) when the coach niche resumes. |
| A7 named byline | Done. "By Robinson Guerra, Founder" on all 27 posts and 3 learn pages, Person author schema, /about/#founder section. |
| L2 breadcrumb name | Done. Brand suffix and colon subtitles dropped from the last crumb. |
| T2 thin titles | Done. Pricing, FAQ, Blog, About, Features, Contact (GSC: none ranked; keyword-guard diff 0 losses). |
| A10 llms.txt | Done. Overclaims removed, matches Stripe App 0.0.3 permissions and the 6-hour refund check. |
| A3 sources | Done on all 27 posts. Every remaining number links to a page that was fetched and read; unsourceable numbers removed. |
| A5 answer-first openers | Done on 20 posts; the other 7 already led with the answer. |
| Non-blog pages | Done. build.js (/vs/*, /how-verification-works/, /integrations/*, /learn/*, FAQ) and features.md had the same overclaims ("Stripe webhook hides refunded reviews immediately", "impossible to post", "independently verifiable", Shopify Payments supported, reviewer "signs with their payment processor key"); all fixed, plus split-parenthesis artifacts from the 09 em-dash cleanup. |
| Blog FAQ schema | Done. Six hand-written FAQPage blocks in build.js had drifted from the posts (Trustpilot "Growth $299", webhooks; one duplicated, one had no visible FAQ). Replaced by `extractFaqs()`, which builds FAQPage from each post's visible FAQ section. |
| Checks | Build OK; keyword-guard 0 losses; 207 JSON-LD blocks parse; 0 broken in-site anchors (7 pre-existing ones fixed); 108 external source links checked (403/404s are bot blocks, spot-checked live via Jina); verifier pass on all 27 posts. |
| Product-claim accuracy | Done on all 27 posts: no webhook/real-time claims, no "impossible to fake", no "Stripe confirms each review", refund = full refund or dispute every 6 hours, one invite sequence per customer, no delivery or milestone triggers, Shopify Payments not supported, embed = badge + API. |

**Largest corrections found by the sources pass:** Trustpilot publishes prices (Free with 50 invitations, $99 / $319 / $799 per month billed annually), not "$299 and hidden". Trustpilot 2.7M removals were 2021, not 2022; 2024 = 4.5M (7.4%). Spiegel's 270% compares five reviews with none, not verified with unverified. "FTC: 1 in 7 reviews fake" has no FTC source and was removed. Fakespot shut down 2025-07-01.

**Open decisions for the owner:**
1. trustpilot-pricing-explained H1/Title/Description still say "Hidden Costs/Fees" (tracked keyword page; reframe or keep).
2. (resolved) Reviews.io price figure dropped; currency could not be confirmed.
3. "FTC-compliant by construction" remains in trustpilot-alternatives-for-small-business (legal claim, no stated basis).
4. Generic "ask again at renewal" advice remains in best-time and SaaS posts; it is not attributed to Signed Reviews, which never re-invites.

**Before deploying:** commit landingpage (sources + built HTML), push. After deploy, note the date in the rank tracker; judge title changes after 4-6 weeks of GSC data and AI-citation changes over repeated checks, never a single before/after.
