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

// ── Markdown for Agents ─────────────────────────────────────────────────────
// Every indexable landing page has a markdown twin at <page>/index.md, written
// by build.js (scripts/markdown-twins.js) from the same build as the HTML, so an
// agent always gets the current copy. The apex worker answers markdown requests
// on signedreviews.com; this function covers direct pages.dev hits. This replaced hand-written markdown that
// drifted from the pages. Paths with no twin (platform routes, hidden pages) get
// the short overview below. Keep this block in step with workers/apex-router.js.

const SITE_OVERVIEW = `# Signed Reviews: site overview

Signed Reviews collects customer reviews for businesses paid through Stripe. Review links go only to customers with a completed Stripe charge, each review is matched to that charge, and each review is signed so later edits can be detected. Anyone can check a review on its public verification page.

## Main pages
- [How it works](https://signedreviews.com/how-it-works/)
- [How review verification works](https://signedreviews.com/how-verification-works/)
- [Pricing](https://signedreviews.com/pricing/): free plan, paid plans from $29/mo
- [Fake review checker](https://signedreviews.com/tools/fake-review-checker/): free tool
- [Public API](https://signedreviews.com/api/)
- [Blog](https://signedreviews.com/blog/)

## For AI agents
- [llms.txt](https://signedreviews.com/llms.txt): site map for language models
- [Sitemap](https://signedreviews.com/sitemap.xml): every page on this site
- Any page as markdown: send \`Accept: text/markdown\`, or add \`index.md\` to a page URL that ends in \`/\`.
`;

function defaultMarkdown(pathname) {
  return `> \`${pathname}\` has no markdown version. Site overview follows.\n\n${SITE_OVERVIEW}`;
}

// 404 body: the overview plus an explicit note that the requested path is not
// on this site, so an agent can recover from the sitemap.
function missingMarkdown(pathname) {
  return `> **404:** \`${pathname}\` does not exist on this site. The sitemap lists every page that does.\n\n${SITE_OVERVIEW}`;
}

// Rough heuristic: ~4 chars/token for English. Used for x-markdown-tokens.
function estimateTokens(markdown) {
  return Math.ceil(markdown.length / 4);
}

// The twin's URL for a page path, or null for a file path (/llms.txt,
// /auth.md...), which is served as itself.
function twinPath(pathname) {
  if (/\.[a-z0-9]+$/i.test(pathname)) return null;
  return (pathname.endsWith('/') ? pathname : pathname + '/') + 'index.md';
}


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

  // Serve the page's markdown twin when an AI agent asks for markdown. File
  // paths (/llms.txt, /auth.md...) fall through and are served as themselves.
  const twin = twinPath(pathname);
  if (accept.includes('text/markdown') && twin) {
    const twinResponse = await context.env.ASSETS.fetch(new URL(twin, url));
    const twinText = twinResponse.status === 200 ? await twinResponse.text() : '';
    let markdown;
    let status = 200;
    if (twinText.startsWith('---')) {
      markdown = twinText;
    } else {
      // No twin: answer 404 when the page itself does not exist.
      const assetResponse = await context.next();
      status = assetResponse.status === 404 ? 404 : 200;
      markdown = status === 404 ? missingMarkdown(pathname) : defaultMarkdown(pathname);
    }
    return new Response(markdown, {
      status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': String(estimateTokens(markdown)),
        'x-debug-function': 'markdown-negotiation-v3',
        'Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept',
      },
    });
  }

  // Pass through to static assets for all other requests
  return context.next();
}
