# Signed Reviews in ChatGPT: plan

Written 2026-10-11. Goal: put Signed Reviews inside ChatGPT so it (1) sends traffic to signedreviews.com and (2) helps ChatGPT and other AI answers mention and cite the brand. Same workstream as `SEO_META_STUDY_BLUEPRINT.md`.

Raw research captures (OpenAI docs fetched 2026-10-11): `C:\Users\robin\AppData\Local\Temp\claude\C--python-signed-reviews\8a6fe99f-549d-4a6b-b963-bbc9d940209a\scratchpad\gpt\`. They are temporary; the URLs below are the durable sources.

---

## 1. Verdict: build a ChatGPT plugin, not a custom GPT

The custom GPT idea from 2026-10-09 is dead on arrival:

- "New GPT creation and publishing are not available on personal ChatGPT accounts, including Free, Go, Plus, and Pro." ([OpenAI Help 8554407](https://help.openai.com/en/articles/8554407))
- "Custom GPTs are scheduled to retire on Dec 11, 2026." GPT pages "become inaccessible" on that date, and "GPT custom actions do not transfer through the migration workflow." ([Custom GPT retirement FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq))
- Live GPT pages (`chatgpt.com/g/...`) now serve `noindex, nofollow`, so even an existing GPT page gives no search value.

OpenAI's replacement is **plugins**: a package of skills (instructions + reference files) and one remote MCP server (tools), listed in one directory shared by ChatGPT and Codex ([Plugins docs](https://developers.openai.com/plugins.md), [Plugins help](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt-and-codex)). "Apps in ChatGPT / Apps SDK" from Oct 2025 is the same thing under its old name.

The earlier advice about GPT Actions, an API key for the GPT and an OpenAPI spec for Actions is superseded by this plan.

## 2. Honest expectations

What the plugin can and cannot do for the two goals. Graded like the blueprint: A = documented by OpenAI, B = observed, C = our inference, no data.

| Lever | Effect | Grade |
|---|---|---|
| ChatGPT search citations of signedreviews.com | Come from OAI-SearchBot crawling our site, not from plugins ([OpenAI bots](https://developers.openai.com/api/docs/bots)). A plugin does not touch that index. | A |
| Plugin directory listing page `chatgpt.com/apps/<name>/asdk_app_...` | Indexable (robots allows `/apps` and `/plugins`; third-party listings are in Google). One more high-authority page carrying the brand, what it does, and our URL. | B |
| Default discovery inside ChatGPT | Only "clicking a direct link to the plugin listing" or "searching for the plugin by name". Directory front pages are hand-picked; "developers cannot request enhanced distribution." ([App review](https://developers.openai.com/plugins/deploy/app-review.md)) | A |
| In-conversation suggestions | OpenAI says apps can be suggested at the right moment; no data on how often for small plugins. A forum thread from April 2026 reports new apps at "zero usage". | C |
| Links back to our site from tool results | Tool results can carry our URLs; the widget API `openExternal` opens allowlisted links. Whether plain links in tool text render clickable is unconfirmed: test it in phase 2. | A / unconfirmed |
| Traffic volume | No credible public data on plugins (or GPTs) as an acquisition channel. Treat as a demo we distribute ourselves. | C |

Context, not proof: US Google searches for "fake review checker" fell from 1,000/month (Sep 2025) to 320 (Aug 2026), and "fakespot alternative" fell 91% year on year (DataForSEO, 2026-10-11). Some of that demand has plausibly moved into chatbots, which is where this plugin would sit.

**Bottom line:** the plugin is a cheap, useful demo and one extra indexed brand page. It is not a citation engine. Citations still come from section 3 and the blueprint work.

## 3. Step 0: the citation basics (checked 2026-10-11)

- `robots.txt` names no OpenAI search bot, but `User-agent: * Allow: /` covers OAI-SearchBot and ChatGPT-User. GPTBot is allowed explicitly. **OK.**
- Requests with OAI-SearchBot, ChatGPT-User and GPTBot user agents to `/tools/fake-review-checker/` and `/blog/` return 200 (curl, user-agent only; Cloudflare's IP-based bot rules can't be tested this way). **OK as far as we can test.** If Cloudflare "Block AI bots" or AI Crawl Control is on in the dashboard, check that OAI-SearchBot and ChatGPT-User are allowed.
- Optional: add an explicit `User-agent: OAI-SearchBot` / `Allow: /` group to `robots.txt` so intent is unambiguous.
- Open question: is the site verified in Bing Webmaster Tools with IndexNow on? ChatGPT search draws on Bing among other sources.
- **Found 2026-10-11, fix first: AI agents get stale copy.** `workers/apex-router.js` serves hand-written markdown versions of 9 pages (`/`, 3 learn pages, `/pricing/`, `/how-it-works/`, `/blog/`, `/api/`, `/subprocessors/`) to any client sending `Accept: text/markdown`, i.e. AI agents. The 2026-10-09 accuracy pass fixed the HTML but never touched these. They still say fakes are "structurally impossible", that every review needs "an independently confirmed Stripe charge", that Stripe links via "Connect OAuth or restricted API key", and they link the broken `openapi.json`. These pages carry more citation weight than the plugin ever will. Regenerate them from the built HTML (or the source markdown) instead of hand-keeping them, then redeploy the worker. **Fixed 2026-10-11:** `scripts/markdown-twins.js` now writes `<page>/index.md` for every indexable page at build time, and both the worker and `functions/[[path]].js` serve those files.

## 4. Gating checks (user, before any build)

These need the owner's accounts; code can't check them.

1. **Can our ChatGPT account add a custom MCP server?** Go to [chatgpt.com/plugins](https://chatgpt.com/plugins), press +, look for **Add custom MCP server**. The docs say "workspace permissions and security restrictions ... apply" and the quickstart tests in "ChatGPT Work". If the option is missing on our plan, testing needs a different account tier or a Business workspace.
2. **OpenAI Platform organization** at platform.openai.com with **individual or business verification** completed ("All plugin submissions must come from verified individuals or organizations"). Business verification publishes under a company name instead of a personal name; prefer that. The legal entity is Paid Rightly LLC, so confirm which developer name the directory will display and whether the brand name "Signed Reviews" can be shown. A listing that only says "Paid Rightly LLC" weakens the brand-mention benefit.
3. **Project data residency must be global, not EU**: "projects with EU data residency cannot submit plugins with MCP servers for review."
4. **Jev per-call cost.** Not in the code. Launch pricing was $0.042 per million input tokens with free output, about $0.00006 per review (memory `typesafe-jev-api`, `fake-review-detector`). Confirm it in the TypeSafe dashboard before setting the plugin's daily cap.

## 5. Scope: two tools and one skill

Keep the surface small. Reviewers reject "trial or demo plugins" and anything that exists "primarily as an advertising vehicle" ([Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines.md)), and plugins must offer something "not natively supported" by ChatGPT.

### Tool 1: `verify_signed_review` (the part ChatGPT can't do itself)

- Input: a Signed Reviews review ID or review URL.
- Wraps `GET /api/verify/:reviewId` (`platform/backend/src/routes/verify.js`).
- Returns: business name, rating, date, verification method, whether the HMAC signature matches the stored content, and a link to the review's public verification page, `https://signedreviews.com/verify/<reviewId>` (React route `/verify/:reviewId` in `platform/frontend/src/App.jsx`, served through the apex worker).
- Wording must follow `product-copy-ground-truth`: "matched to a completed Stripe charge that Signed Reviews imported", "signature matches, so the text has not been edited since it was signed". Never "verified by Stripe", "Stripe confirms", "tamper-proof" or "impossible to fake".
- Hidden reviews (refunded, disputed) return 404 today. The tool should say "not found or no longer shown", not "fake".

### Tool 2: `check_review_text`

- Input: `reviewText` (required, max 12,000 chars, Jev sees the first 4,000) and `rating` (optional 1 to 5).
- **No `websiteUrl` parameter.** The web checker fetches the business site; in a plugin that runs into "Do not scrape external websites" and the collection-minimization rule. ChatGPT can browse on its own if the user wants that.
- Wraps `services/reviewCheck.js` (`checkReview`) directly, not the public HTTP route.
- Returns `verdict` (OK / SUSPICIOUS / LIKELY_FAKE), `composite`, `genuineScore`, `aiWritten`, the existing disclaimer, and one line explaining that text analysis can only flag patterns, while a payment-linked review proves a purchase. Link: `/how-verification-works/`.
- Risk: a reviewer may judge this "natively supported" (ChatGPT can already eyeball a review). That's why tool 1 leads the listing and the description stresses a dedicated scoring model with a fixed rubric.

### Skill: `get-started` (required) doubling as the review-trust workflow

- Short instructions: when someone asks whether a review or a site's reviews can be trusted, check the text with tool 2, explain the verification levels (self-reported, platform-verified, payment-linked) using a bundled reference file built from `/how-verification-works/`, and cite that page.
- The reference file must be written from the live page and pass the copy rules. It is the main way our methodology page gets quoted inside ChatGPT answers.

### Explicitly out of scope

- **No business lookup or "find verified reviews for X" tool.** Public business profiles are deliberately noindexed (locked decision L13, anti-leaderboard; see memory `customer-pages-noindexed`). A cross-business search in ChatGPT would undo that.
- No merchant login, no OAuth, no dashboard data. Read-only and anonymous (`noauth`) is supported for directory plugins ([Auth](https://developers.openai.com/plugins/build/auth.md)).
- No UI widget in v1, unless the phase 2 test shows plain links aren't clickable (see 7.3).

### Naming

- Plugin name: **Signed Reviews**. Not "Fake Review Checker" (too generic: "Avoid overly generic names"). No "GPT" anywhere ([OpenAI brand rules](https://openai.com/brand/): "we do not permit our GPT brand to be used in app, product, developer or company names"). Don't append "MCP" or "Plugin".
- Tool names without "best" or "official".
- Subtitle idea: "Check whether a review is linked to a real purchase, and score review text for signs of fakes." No comparisons, prices, trials or unverifiable claims in the listing.

## 6. Backend build (`platform/backend`)

### 6.1 MCP endpoint

- Mount a stateless streamable-HTTP MCP server at `https://api.signedreviews.com/mcp`, using `@modelcontextprotocol/sdk` in the existing Express app. It reuses `reviewCheck.js`, the verify query, Prisma and `DailyCounter`, so there's no new service to host.
- Serve the domain challenge at `https://api.signedreviews.com/.well-known/openai-apps-challenge`.
- Tool annotations, each with a one-line justification for review:
  - `readOnlyHint: true`: both tools only compute or retrieve; nothing is created, sent or changed.
  - `destructiveHint: false`.
  - `openWorldHint: false`: tool 1 reads our own database; tool 2 sends text to one bounded scoring API, not the open web.
- Per-tool `securitySchemes: [{ type: "noauth" }]`.
- Tool descriptions start "Use this when..." ([Optimize metadata](https://developers.openai.com/plugins/guides/optimize-metadata.md)). No wording that tells ChatGPT to prefer us over other tools.
- Treat review text as untrusted input (prompt injection): never echo it back as instructions, keep the model-readable result to fixed fields.

### 6.2 Limits (the web checker's limits don't work here)

Every ChatGPT user reaches us from OpenAI's shared IPs, so the current 10/hour-per-IP limiter would put all of them in one bucket, and Turnstile can't run in a server-to-server call.

- Rate-limit by `_meta["openai/subject"]`, which OpenAI documents as an "anonymized user id sent to MCP servers for the purposes of rate limiting and identification". Start at 10 checks per hour and 30 per day per subject.
- Own global daily cap: `DailyCounter('platform', 'plugin_check_review')`, separate from the web checker's `public_check_review`, so neither can starve the other. Start at 500/day; set from the Jev cost (gating check 4).
- No Turnstile on `/mcp`.
- Optional hardening: check source IPs against [chatgpt-connectors.json](https://developers.openai.com/api/docs/guides/ip-addresses) (log mismatches first, block later). OpenAI recommends mTLS over IP checks if we ever need hard client identity.
- Refund the daily slot when Jev fails. Today the web route only refunds on the 503 missing-key path (`publicApiV1.js:356`); fix it for both routes.
- `verify_signed_review` is a cheap DB read: per-subject limit only (60/hour).

### 6.3 Logging (today there is none)

The web checker logs nothing beyond the daily counter, so we can't measure it either. Add one table, for both routes:

- `ToolCallLog { id, surface ('web' | 'chatgpt'), tool, subjectHash, verdict, ok, errorCode, latencyMs, createdAt }`. No locale or location columns: we don't need them to run the tools (collection minimization).
- `subjectHash` = SHA-256 of `openai/subject` plus a server salt. **Never store review text**, or the checker's "nothing is stored" disclaimer and the privacy policy become false.
- Retention: 90 days, then delete. State it in the privacy policy.
- Hand-write the migration (`migrate dev` is broken in this repo; see memory `fake-review-detector`).

### 6.3a Jev spend guard (shipped 2026-10-19, platform commit 0acc52f)

Every Jev call, including the plugin's, goes through `jevClient.js`, which refuses calls once `JEV_DAILY_BUDGET_USD` (default 2) or `JEV_MONTHLY_BUDGET_USD` (default 20) is spent, and logs one `AiRequestLog` row per call (capability, tokens, cost, latency; no text, no IP). The MCP tool must pass its own `capability` (for example `plugin_check_review`) to `systemOne` and map a `SPEND_CAP` error to a plain "unavailable right now" result, as `publicApiV1.js` does with a 503. This is a metadata row per call, so "Nothing is stored" in the checker FAQ (`landingpage/build.js` ~4673 and its JSON-LD) and Privacy §6 must change to "No review text is stored" and list the cost/usage metadata before submission. OpenAI's guidelines require disclosing metadata collection.

### 6.4 Tests

- Unit: subject limiter, separate daily key, refund on Jev failure, no review text in logs, 404 on hidden reviews.
- MCP Inspector (`npx @modelcontextprotocol/inspector@latest`) against staging: tool list, schemas, annotations, errors.

## 7. Landing and legal (all are submission blockers)

Submission needs four public URLs: website, support, privacy policy, terms of service ([Submission](https://developers.openai.com/apps-sdk/deploy/submission)).

### 7.1 Privacy policy (`files/privacy.md`): fix now, plugin or not

- **§6 "How we use AI" contradicts the live checker.** It says AI is not used to analyze or score review content; `/tools/fake-review-checker/` sends pasted text to TypeSafe's Jev model for exactly that. Rewrite §6 to describe the checker.
- **§5.2 sub-processors**: add TypeSafe (review text scoring).
- New subsection "Signed Reviews in ChatGPT": what we receive (review text, optional rating, review ID, OpenAI's anonymized user ID, locale and coarse location if sent), what goes to TypeSafe, that review text isn't stored, the hashed-ID log and its 90-day retention. Link OpenAI's own privacy policy for what ChatGPT does.

### 7.2 Other URLs and files

- Terms: confirm `/terms/` covers free tools; add one line on the ChatGPT plugin if not.
- Support URL: `/contact/`.
- **`openapi.json` is wrong today**: it documents `/businesses/{slug}` routes and a `pk_` key prefix that don't exist (real routes are `/api/public/v1/profile` and `/reviews`, keys `rvwpk_`). Fix or delete it before the plugin listing points people at our docs.

### 7.3 Landing pages

- New page `/chatgpt/` ("Signed Reviews in ChatGPT"): what the plugin does, 3 example prompts, the install link, a screenshot or GIF of a real session, privacy summary. This is the linkable, crawlable asset that can earn citations; the plugin itself can't.
- Link it from `/tools/fake-review-checker/`, `/how-verification-works/`, the footer and `llms.txt`.
- Links inside tool results carry our own UTMs, for example `?utm_source=chatgpt&utm_medium=plugin&utm_campaign=verify_review`. Don't assume ChatGPT adds `utm_source=chatgpt.com`; that's widely repeated but not confirmed on an OpenAI page.
- If phase 2 shows links in tool text aren't clickable, add a minimal widget with one `window.openai.openExternal` button and set `_meta["openai/widgetCSP"].redirect_domains` to `["signedreviews.com"]`.

### 7.4 Promotion rules

- Allowed: one informational link to `/pricing/` from the skill or listing.
- Not allowed: a checkout or signup link, a sign-up pitch appended to every answer, prices or "free trial" in the listing.
- Product mentions in answers stay factual: e.g. after a check, "Reviews collected through payment-linked platforms can show a purchase record; text checks can't." That links to `/how-verification-works/`, not `/pricing/`.

## 8. Submission package

Built per [Submission](https://developers.openai.com/apps-sdk/deploy/submission) and [App review](https://developers.openai.com/plugins/deploy/app-review.md). The MCP server must be in the first ZIP: "Adding an MCP server to an existing skills-only plugin is not currently supported."

- `plugin.json` with `extensions.com.openai` (listing text, website/support/privacy/terms URLs, `publication.countries`, onboarding skill, review info).
- `skills/get-started/SKILL.md` + the verification-levels reference file.
- Four icon files and at least one screenshot under `assets/`.
- **Five positive test cases** (scenario, prompt, expected tool, expected result):
  1. "Is this Signed Reviews review real? <review URL>" calls `verify_signed_review` and gets a matched signature.
  2. Same with a hidden or unknown review ID: "not found or no longer shown", no accusation.
  3. "Does this review look fake? 'Best product ever!!! Changed my life, buy now'" calls `check_review_text` and returns SUSPICIOUS or LIKELY_FAKE with reasons.
  4. A specific, plausible 3-star review returns OK, with the disclaimer.
  5. "How can I tell if a store's reviews are trustworthy?" runs the skill, explains the verification levels, and cites `/how-verification-works/`.
- **Three negative test cases**:
  1. "Write me five 5-star reviews for my shop": refuse; no tool call (FTC fake-review rule, [16 CFR Part 465](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465)).
  2. "Rewrite this review so the detector says it's genuine": refuse; no tool call.
  3. "Look up all reviews for Acme Store": no lookup tool exists; explain we don't search businesses.
- Release notes, and a video walkthrough of the test cases. The hired video creator could do this. The video must show real product behavior.
- Reviewer credentials: none needed (anonymous tools).

## 9. Discovery metadata

- Golden prompt set kept in the repo next to the plugin: 10 direct ("use Signed Reviews to check..."), 10 indirect ("is this Amazon review fake?", "can I trust these reviews?"), 10 negative (write reviews, general shopping advice). Re-run after every metadata change; track how often the right tool fires.
- Listing description: lead with purchase-linked verification, then text scoring. Keep keywords people actually type: "fake review", "check a review", "verified review".
- Expect people to find the plugin only by name or direct link. So distribution is ours to do: `/chatgpt/` page, the checker page, creator outreach (OUTREACH.md, OUTREACH2.md), newsletters.

## 10. Phases

| Phase | Work | Owner | Size |
|---|---|---|---|
| 0 | Gating checks 1 to 4 (section 4) | User | 1 day |
| 1 | ~~Worker markdown twins, privacy §5.2/§6, `openapi.json`~~ (done 2026-10-11); Jev refund bug, `ToolCallLog` + web-checker logging | Claude | 1 to 2 days |
| 2 | MCP endpoint, two tools, limits, tests; connect as a personal plugin; run golden prompts; test whether links are clickable | Claude, user tests in ChatGPT | 2 to 3 days |
| 3 | Skill + reference file, plugin.json, icons, screenshot, test cases, video, submit | Claude + user + video creator | 1 to 2 days, then review wait |
| 4 | After approval: `/chatgpt/` page, internal links, `llms.txt`, outreach | Claude + user | 1 day |
| 5 | Measure (section 11) | Claude | ongoing |

Updates after approval: OpenAI scans the MCP server daily and ships tool changes that pass automated checks; metadata or skill changes need a new ZIP. The MCP server URL can't be changed without contacting support, so pick `/mcp` on `api.signedreviews.com` and keep it.

## 11. Measurement and decision

- Server: `ToolCallLog` daily calls per tool, unique `subjectHash` per week, error rate.
- PostHog: sessions with `utm_medium=plugin`, then signups from them.
- GSC: impressions and clicks for `/chatgpt/`; Google results for the plugin listing URL.
- **Decision 60 days after approval.** Keep investing (UI widget, more skills) if there are at least 300 tool calls a month and at least 30 plugin-tagged sessions a month, or any signup traced to the plugin. Below that: keep it running (it costs little), stop adding features, and put the time back into the blueprint's content and authority work.

## 12. Phase 3 hypothesis: list the same MCP server elsewhere

The MCP server is a standard protocol endpoint. The same `/mcp` URL can be listed in other agent directories (Anthropic's Claude connectors directory, the official MCP registry, and community directories). OpenAI even documents converting a Claude Code plugin for its own directory. Each listing is one more page that pairs the brand name with what it does. **No data supports a citation effect**; treat this as cheap distribution to try after phase 5 shows any use, not as a goal.

## 13. Open questions

- Gating checks 1 to 4.
- Do we want the plugin available in the EEA, Switzerland and the UK? User-side availability there is unconfirmed; `publication.countries` controls it.
- Jev cost and the daily cap it allows.
- Who records the review video.
