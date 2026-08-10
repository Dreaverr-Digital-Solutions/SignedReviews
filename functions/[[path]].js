/**
 * Cloudflare Pages Function — Markdown for Agents content negotiation.
 *
 * When a request arrives with `Accept: text/markdown`, we serve a markdown
 * representation of the requested page. Browsers and search crawlers receive
 * the standard HTML version (pass-through to static assets via context.next()).
 *
 * This implements the Cloudflare "Markdown for Agents" standard:
 * https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 *
 * File-based routing catches all paths ([[path]].js). The function only
 * intercepts markdown requests; everything else falls through to the static
 * site unchanged.
 */

// ── Page-specific markdown content ──────────────────────────────────────────
// Key pages get tailored markdown; all other paths receive the site overview.

const MARKDOWN_PAGES = {
  '/': `# Signed Reviews — Processor-Attested Verified Reviews for Stripe Businesses

## What We Do
Signed Reviews is the only review platform that verifies every review against the **payment processor** (Stripe), not the merchant's own data. Connect your Stripe account via read-only OAuth and automatically collect verified, tamper-evident reviews on every charge. Refunds automatically hide their associated reviews.

## Key Links
- [How It Works](https://signedreviews.com/how-it-works/)
- [Pricing](https://signedreviews.com/pricing/)
- [Connect Stripe](https://platform.signedreviews.com)
- [Public API Docs](https://signedreviews.com/api/)
- [LLMs.txt](https://signedreviews.com/llms.txt)

## Latest Content
- [What Does "Verified Buyer" Actually Mean?](https://signedreviews.com/learn/what-does-verified-buyer-mean/) — The verification spectrum explained
- [The 10 Best Trustpilot Alternatives in 2026](https://signedreviews.com/blog/trustpilot-alternatives-for-small-business/) — Ranked by verification method
- [Stripe Verified Reviews](https://signedreviews.com/blog/stripe-verified-reviews/) — The definitive guide
- [How Fake Reviews Work](https://signedreviews.com/learn/how-fake-reviews-work/) — The full ecosystem

## Agent Resources
- [Agent Skills](https://signedreviews.com/.well-known/agent-skills/index.json)
- [LLMs.txt](https://signedreviews.com/llms.txt)
- [Sitemap](https://signedreviews.com/sitemap.xml)
`,

  '/learn/what-does-verified-buyer-mean/': `# What Does "Verified Buyer" Actually Mean?

## The Verification Spectrum

Every "verified" review on the internet falls into one of five levels. The level determines **who is attesting** that a purchase happened — and that determines how hard it is to fake.

| Level | Name | Who Attests | Can a merchant fake it? |
|-------|------|-------------|------------------------|
| 0 | None | No one | Trivially |
| 1 | Email ownership | Email provider | Yes — anyone can create an email |
| 2 | Self-attested | The reviewer | Yes — "I bought this" tick-box |
| 3 | Merchant-supplied | The merchant's own data | Yes — merchant controls the data |
| 4 | Processor-attested | Independent payment processor (Stripe) | **No** — requires a real payment + Stripe fees |

## Platform-by-Platform Breakdown

### Trustpilot — "Verified" (Level 3)
"Verified" most commonly means the business sent a unique invitation email. Trustpilot is an open platform — anyone can review without proof of purchase. The verification is against data the merchant supplies.

### Yotpo — "Verified Buyer" (Level 3)
Reviewer's email matches an order record in the merchant's e-commerce platform. The attesting party is the merchant's store data.

### Judge.me — "Verified" (Level 3)
Matched to a Shopify order in the merchant's store. Most popular Shopify review app (127M reviews).

### Reviews.io — "Verified Reviewer" (Level 3)
Review comes through the merchant's invitation system using customer data the business provides.

### Signed Reviews — "Verified by Signed Reviews" (Level 4)
Every review is processor-attested: Stripe independently confirms the charge. Refunds auto-hide reviews. Cryptographic signatures make reviews tamper-evident. The payment processor — a neutral third party — is the attester, not the merchant.

## Why It Matters
The FTC's 2024 Trade Regulation Rule (16 CFR Part 465) prohibits fake reviews with civil penalties. Level 4 verification is structurally compliant — faking a review requires faking a Stripe charge, which costs real money and risks account closure. At Level 3, a merchant could manufacture reviews through their own systems at near-zero cost.

## Links
- [Full article on signedreviews.com](https://signedreviews.com/learn/what-does-verified-buyer-mean/)
- [FTC Fake Review Rules](https://signedreviews.com/learn/ftc-fake-reviews-rules/)
- [How Fake Reviews Work](https://signedreviews.com/learn/how-fake-reviews-work/)
`,

  '/learn/how-fake-reviews-work/': `# How Fake Reviews Work — The Full Ecosystem

## Scale
- Trustpilot removed 4.5M fake reviews in 2024 (7.4% of submissions)
- WEF estimates fake reviews influence $152B in global consumer spending annually
- Amazon blocked over 200M suspected fake reviews in 2022

## Methods (5 main approaches)

1. **Click farms and manual posting** — Workers paid pennies per review. Real devices, residential proxies. Platform account requirements slow but don't stop this.

2. **Bot networks and automation** — Scripts create accounts at scale. AI-generated review text evades duplicate detection. Residential proxy networks simulate real households.

3. **Incentivized reviews** — Discounts/gifts for reviews. "Refund-after-review" schemes where seller refunds after 5-star review posted. Hard to detect because purchases are real.

4. **Brushing** — Seller ships empty box to real address, creates real order record, writes "Verified Purchase" review against own transaction. Exploits Level 3 verification (trusts merchant data).

5. **AI-generated review farms** — LLMs generate thousands of unique, grammatically flawless reviews. Combined with bot accounts and proxy rotation. Detection relies on statistical patterns, not obvious tells.

## The Only Structural Defense
Every fake-review method exploits the same vulnerability: the platform doesn't independently verify payment. **Processor-attested verification (Level 4)** makes fakes structurally impossible — every review requires an independently confirmed Stripe charge. No charge = no review = no path to fake.

## Links
- [Full article](https://signedreviews.com/learn/how-fake-reviews-work/)
- [FTC Rules](https://signedreviews.com/learn/ftc-fake-reviews-rules/)
- [What "Verified Buyer" Means](https://signedreviews.com/learn/what-does-verified-buyer-mean/)
`,

  '/auth.md': `# Auth.md — Signed Reviews Agent Registration & Authentication

## Agent Registration

AI agents and automated clients can access Signed Reviews content through the following channels:

### Unauthenticated Access (Agents & Bots)
- **llms.txt** — Machine-readable site map at [/llms.txt](https://signedreviews.com/llms.txt)
- **Markdown for Agents** — Content negotiation via \\\`Accept: text/markdown\\\` header
- **Agent Skills** — Structured skill definitions at [/.well-known/agent-skills/index.json](https://signedreviews.com/.well-known/agent-skills/index.json)
- **API Catalog** — Available APIs at [/.well-known/api-catalog](https://signedreviews.com/.well-known/api-catalog)
- **MCP Server Card** — Model Context Protocol at [/.well-known/mcp/server-card.json](https://signedreviews.com/.well-known/mcp/server-card.json)
- **WebMCP** — Browser-based tool registration via \\\`navigator.modelContext.registerTool()\\\`

### Authenticated API Access
- **Publishable Key** — Bearer token (\\\`pk_...\\\`) for public read-only API access
- **OAuth 2.0** — Authorization server metadata at [/.well-known/oauth-authorization-server](https://signedreviews.com/.well-known/oauth-authorization-server)
- **OAuth Protected Resource** — Resource metadata at [/.well-known/oauth-protected-resource](https://signedreviews.com/.well-known/oauth-protected-resource)

## Human Authentication
- **Social OAuth** — Google, GitHub, LinkedIn, Microsoft
- **Email Magic Link** — Passwordless sign-in via email
- **Session** — HTTP-only cookies with short-lived JWT

## Stripe App Authentication
- **Stripe App OAuth** — Read-only Stripe Connect authorization
- **Scopes** — Read transactions, customers, and charges
- **No Write Access** — The platform never initiates charges or modifies Stripe data

## Security
- TLS 1.3 for all connections
- Cryptographic signing of reviews for tamper-evidence
- Publishable keys designed for public exposure (read-only)

## Links
- [API Documentation](https://signedreviews.com/api/)
- [Trust & Security](https://signedreviews.com/trust/)
- [Platform Login](https://platform.signedreviews.com)
`,

  '/learn/ftc-fake-reviews-rules/': `# FTC Fake Review Rules (2024) — 16 CFR Part 465

## Timeline
- **Oct 21, 2024** — Rule takes effect. FTC can seek civil penalties up to $51,744 per violation.
- **Nov 2024** — First enforcement: FTC order against SiteJabber for reviews from people who never received products.

## What's Banned
1. Fake or false reviews (misrepresenting genuine experience)
2. Buying or selling reviews (including "honest" reviews for payment)
3. Undisclosed insider reviews (employees, relatives must disclose connection)
4. Review suppression (threats, intimidation, selective approval of positive-only)
5. Fake social media influence (bots, hijacked accounts for followers/likes)

## Who It Applies To
Businesses, review platforms, marketing agencies, e-commerce platforms, and anyone who buys/sells/facilitates fake reviews.

## Compliance Spectrum
- **Policy compliance (weak):** "We have a policy against fakes. We moderate." — reactive, expensive, inconsistent.
- **Structural compliance (strong):** "Our system physically cannot accept a review without an independently verified payment." — preventative, built into the code.

## Links
- [Full article](https://signedreviews.com/learn/ftc-fake-reviews-rules/)
- [How Fake Reviews Work](https://signedreviews.com/learn/how-fake-reviews-work/)
- [What "Verified Buyer" Means](https://signedreviews.com/learn/what-does-verified-buyer-mean/)
`,
};

// ── Default markdown (site overview for any path without a tailored page) ────

function defaultMarkdown(pathname) {
  return `# Signed Reviews — Site Overview

> Requested path: \`${pathname}\`

Signed Reviews is the only review platform that verifies every review against the payment processor (Stripe), not the merchant's own data.

## Core Pages
- [How It Works](https://signedreviews.com/how-it-works/) — The 5-step verification flow
- [Pricing](https://signedreviews.com/pricing/) — Free plan available, paid from $29/mo
- [Trust & Security](https://signedreviews.com/trust/) — Cryptographic signing, read-only OAuth
- [API Reference](https://signedreviews.com/api/) — Public API documentation

## Learn (Authority Pages)
- [What Does "Verified Buyer" Actually Mean?](https://signedreviews.com/learn/what-does-verified-buyer-mean/) — The 5-level verification spectrum
- [How Fake Reviews Work](https://signedreviews.com/learn/how-fake-reviews-work/) — Methods, economics, structural defenses
- [FTC Fake Review Rules (2024)](https://signedreviews.com/learn/ftc-fake-reviews-rules/) — 16 CFR Part 465 explained

## Comparisons (14 /vs/ pages)
Trustpilot, Feefo, Judge.me, Yotpo, eKomi, SiteJabber, Reviews.io, Stamped, Okendo, Loox, Skeepers, Google Reviews, Yelp, Clutch.
→ [Full list at signedreviews.com/vs/trustpilot/](https://signedreviews.com/vs/trustpilot/)

## Blog (24 posts)
Covers Stripe verified reviews, Trustpilot alternatives, fake review detection, review collection guides, FTC compliance, and platform-specific guides for Shopify, SaaS, and e-commerce.
→ [Blog index](https://signedreviews.com/blog/)

## Integrations
- [Stripe](https://signedreviews.com/integrations/stripe/) — Native, read-only OAuth (Live)
- [Shopify](https://signedreviews.com/integrations/shopify/) — Planned
- [WooCommerce](https://signedreviews.com/integrations/woocommerce/) — Planned

## For AI Agents
- [LLMs.txt](https://signedreviews.com/llms.txt) — Machine-readable site map
- [Agent Skills](https://signedreviews.com/.well-known/agent-skills/index.json) — Structured skill definitions
- [Sitemap](https://signedreviews.com/sitemap.xml) — XML sitemap
- [auth.md](https://signedreviews.com/auth.md) — Authentication documentation
`;
}

// ── Token count estimate ─────────────────────────────────────────────────────
// Rough heuristic: ~4 chars/token for English. Used for x-markdown-tokens.
function estimateTokens(markdown) {
  return Math.ceil(markdown.length / 4);
}

// ── More tailored pages ──────────────────────────────────────────────────────

MARKDOWN_PAGES['/pricing/'] = `# Signed Reviews — Pricing

## Plans

| Tier | Price (/mo) | Invitations | Key Features |
|------|------------|-------------|--------------|
| Free | $0 | 10 verified | Public profile, verified badge, Stripe connection |
| Starter | $29 | 250/mo | + Email invitations, custom branding, review widgets |
| Pro | $79 | 1,000/mo | + API access, webhooks, priority support, team seats |
| Scale | $199 | 5,000/mo | + SSO, dedicated support, SLA, custom integrations |

All paid plans include: processor-attested verification, automatic refund handling, cryptographic signing, analytics dashboard, and the verified badge.

## Annual Discount
Switch to annual billing and save 20% on any paid plan.

## What Makes Us Different
- **Processor-attested (Level 4):** Reviews are independently verified against Stripe charges — not merchant-supplied data
- **Read-only OAuth:** You never share your Stripe API keys. Read-only access only.
- **Automatic refund handling:** Refunds hide their associated reviews automatically
- **Tamper-evident:** Every review is cryptographically signed

[Full pricing page](https://signedreviews.com/pricing/) · [Start free](https://platform.signedreviews.com)
`;

MARKDOWN_PAGES['/how-it-works/'] = `# How Signed Reviews Works

## The 5-Step Verification Flow

1. **Connect Stripe** — One-click read-only OAuth. We never see or store your API keys.
2. **Customer purchases** — A real Stripe charge happens on your site.
3. **Review invitation sent** — We email the customer using the Stripe charge metadata. Or you call our API.
4. **Customer writes review** — The review is cryptographically linked to the Stripe charge.
5. **Verified review published** — The review appears on your public profile as "Verified by Signed Reviews."

## What Happens on Refund
When a Stripe charge is refunded, the associated review is **automatically hidden**. No manual moderation needed. If the charge is re-billed, the review reappears.

## Integration Options
- **Widget API (v1):** Embed a review collection form on your site with a publishable key
- **Public API (v1):** Create review invitations programmatically from your backend
- **Stripe App:** Install from the Stripe Marketplace for no-code setup
- **Manual:** Send invitation links directly from the dashboard

[Full how-it-works page](https://signedreviews.com/how-it-works/) · [API docs](https://signedreviews.com/api/)
`;

MARKDOWN_PAGES['/blog/'] = `# Signed Reviews Blog

## Featured Articles
- [Stripe Verified Reviews: The Definitive Guide](https://signedreviews.com/blog/stripe-verified-reviews/) — How processor-attested verification works
- [The 10 Best Trustpilot Alternatives in 2026](https://signedreviews.com/blog/trustpilot-alternatives-for-small-business/) — Ranked by verification method
- [How Fake Reviews Work — The Full Ecosystem](https://signedreviews.com/blog/fake-reviews/)
- [FTC Fake Review Rules (16 CFR Part 465)](https://signedreviews.com/blog/fake-review-laws-ftc/)
- [How to Spot Fake Reviews in 2026](https://signedreviews.com/blog/how-to-spot-fake-reviews/)

## All Posts (24 articles)
Covers Stripe verified reviews, Trustpilot alternatives (SaaS, e-commerce, small business), fake review detection, review collection guides (Shopify, SaaS, email templates), FTC compliance, and platform-specific guides.

[Full blog index](https://signedreviews.com/blog/)
`;

MARKDOWN_PAGES['/api/'] = `# Signed Reviews — Public API

## Quick Start

### Headless Public Page (no auth)
\`\`\`
GET https://api.signedreviews.com/v1/public/{slug}/reviews
\`\`\`
Returns published reviews for any business profile. CORS enabled.

### API Access (publishable key required)
\`\`\`
Authorization: Bearer pk_live_...
GET https://api.signedreviews.com/v1/reviews
POST https://api.signedreviews.com/v1/invitations
\`\`\`

Get your API keys at [platform.signedreviews.com](https://platform.signedreviews.com) → Settings → API Keys.

[Full API documentation](https://signedreviews.com/api/) · [OpenAPI spec](https://signedreviews.com/openapi.json)
`;

MARKDOWN_PAGES['/subprocessors/'] = `# Sub-processors — Signed Reviews

Signed Reviews is operated by Paid Rightly LLC. This page lists the third-party service providers ("sub-processors") we use to operate Signed Reviews.

## Core Infrastructure

| Sub-processor | Purpose | Data Categories | Location |
|--------------|---------|-----------------|----------|
| Railway | Cloud hosting and managed PostgreSQL database | All Service data at rest | United States |
| Cloudinary | Image hosting for review photos and brand assets | User-uploaded images | United States |
| Stripe | Business Stripe account linking (Connect OAuth or restricted API key). Read-only access to verify reviews. | Stripe account ID, transaction metadata | United States |
| Resend | Transactional email delivery | Recipient email addresses, email content | United States |

## AI Services

| Sub-processor | Purpose | Data Categories |
|--------------|---------|-----------------|
| Anthropic (Claude) | Logo extraction from business websites | Public website HTML and images |
| Google (Gemini) | Alternate AI provider for logo extraction | Public website HTML and images |

**AI services are NOT used on review content, reviewer data, or payment data.**

## Analytics

| Sub-processor | Purpose | Data Categories | Location |
|--------------|---------|-----------------|----------|
| PostHog | Product analytics and session replay | Anonymized usage data, page views | United States (via Cloudflare proxy) |
| Cloudflare Web Analytics | Privacy-first traffic analytics | Aggregated page view counts | Global |

## Links
- [Full list on signedreviews.com](https://signedreviews.com/subprocessors/)
- [Privacy Policy](https://signedreviews.com/privacy/)
- [DPA](https://signedreviews.com/dpa/)
`;

// ── Web Bot Auth — JWKS directory ──────────────────────────────────────────
// Ed25519 key pair for signing outbound bot/agent requests.
// The public JWK is served at /.well-known/http-message-signatures-directory.
// The private key signs the response to prove key ownership (RFC 9421).

const WEB_BOT_AUTH_PRIVATE_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'jJH-4K0InHujI7tXJbkUkxw2cLFvmLg3JXfR5LpVrFU',
  d: 'mmL7MHR7dCFYkl539ncC_91FFULzsXaX_FyuwvXyx_M',
};

const WEB_BOT_AUTH_DIRECTORY = {
  keys: [
    {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'jJH-4K0InHujI7tXJbkUkxw2cLFvmLg3JXfR5LpVrFU',
    },
  ],
};

// JWK Thumbprint (RFC 7638) — pre-computed for the public key above.
const JWK_THUMBPRINT = '8ZKMcknlicIPt03USL4eO5qoVxV0a-JybV7_RnzSw6s';

/**
 * Sign the JWKS directory response with HTTP Message Signatures.
 * Uses WebCrypto (available in Workers runtime) for Ed25519 signing.
 */
async function serveWebBotAuthDirectory(hostname) {
  // Import the private key
  const key = await crypto.subtle.importKey(
    'jwk',
    WEB_BOT_AUTH_PRIVATE_JWK,
    { name: 'Ed25519' },
    false,
    ['sign'],
  );

  // Build signature parameters
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 10;
  const nonceBytes = crypto.getRandomValues(new Uint8Array(64));
  const nonce = btoa(String.fromCharCode(...nonceBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const sigParams = `sig1=("@authority";req);alg="ed25519";keyid="${JWK_THUMBPRINT}";nonce="${nonce}";tag="http-message-signatures-directory";created=${created};expires=${expires}`;

  // Build signature base (RFC 9421)
  const signatureBase = `"@authority": ${hostname}\n"@signature-params": ${sigParams}`;

  // Sign
  const sigBytes = await crypto.subtle.sign(
    'Ed25519',
    key,
    new TextEncoder().encode(signatureBase),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return new Response(JSON.stringify(WEB_BOT_AUTH_DIRECTORY, null, 2) + '\n', {
    status: 200,
    headers: {
      'Content-Type':
        'application/http-message-signatures-directory+json',
      'Signature-Input': sigParams,
      'Signature': `sig1=:${sig}:`,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ── Function handler ────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request } = context;
  const accept = request.headers.get('Accept') || '';
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Web Bot Auth: JWKS directory for bot/agent identity
  if (pathname === '/.well-known/http-message-signatures-directory') {
    return serveWebBotAuthDirectory(url.hostname);
  }

  // Serve markdown when requested by AI agents
  if (accept.includes('text/markdown')) {
    const markdown = MARKDOWN_PAGES[pathname] || defaultMarkdown(pathname);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': String(estimateTokens(markdown)),
        'x-debug-function': 'markdown-negotiation-v2',
        'Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept',
      },
    });
  }

  // Pass through to static assets for all other requests
  return context.next();
}
