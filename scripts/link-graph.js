#!/usr/bin/env node
/**
 * link_graph.js — internal link graph auditor for signedreviews.com
 *
 * Parses the BUILT html in landingpage/ (repo root = build output) and classifies
 * every internal link by the container it sits in, because the containers are not
 * equal — see INTERNAL_LINKING_PLAN.md §3.
 *
 *   body     inside <article>, in running text. The ONLY class that counts
 *            toward the orphan test, and the only one with real click probability.
 *   related  a paragraph whose TEXT starts with "Related:". Matched on text,
 *            not on container: these paragraphs sit INSIDE <article> and are
 *            deliberately excluded from `body` so this link family can be
 *            tracked separately. "related" does NOT mean "outside the article".
 *   nav      <header class="site-header">
 *   footer   <footer class="site-footer">
 *
 * Usage:
 *   node link_graph.js                 # human report
 *   node link_graph.js --json out.json # also write machine-readable graph
 */

const fs = require('fs');
const path = require('path');

const LANDING = path.join(__dirname, '..');
const SKIP_DIRS = new Set([
  // 'dist' is a copy assembled by build.js for Cloudflare Pages — the repo root
  // is the authoritative build output (GitHub Pages serves it in place).
  'dist',
  'node_modules', '.git', '.seo_tmp', '.ruff_cache', 'screenshots', 'reports',
  'CREATOR_BRIEFS', 'social-media-images', 'launchigniter-assets', 'hero3d-prototype',
  'video-ui', 'oneoff', 'chrome-extension', 'functions', 'workers', 'src', 'files',
  'images', 'tests', 'test-results', 'playwright-report', '.claude',
]);

// ── collect built pages ──────────────────────────────────────────────────────
function findPages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      findPages(path.join(dir, e.name), out);
    } else if (e.name === 'index.html' && dir !== LANDING) {
      out.push(path.join(dir, 'index.html'));
    }
  }
  return out;
}

const slugOf = (file) =>
  '/' + path.relative(LANDING, path.dirname(file)).split(path.sep).join('/') + '/';

// ── parse one page ───────────────────────────────────────────────────────────
function parsePage(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const slug = slugOf(file);

  const title = (raw.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();
  const h1 = (raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]
    .replace(/<[^>]+>/g, '').trim();

  // Region boundaries. Strip <script>/<style> first so their contents can't
  // contribute links or shift offsets meaningfully (we keep length parity by
  // blanking rather than removing).
  const blank = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, (m) => ' '.repeat(m.length))
                       .replace(/<style[\s\S]*?<\/style>/gi, (m) => ' '.repeat(m.length));
  const html = blank(raw);

  const span = (tag) => {
    const m = new RegExp(`<${tag}\\b[^>]*>`, 'i').exec(html);
    if (!m) return null;
    const close = html.indexOf(`</${tag}>`, m.index);
    return { start: m.index, end: close === -1 ? html.length : close };
  };
  const header = span('header');
  const main = span('main');
  const footer = span('footer');
  const article = span('article');

  // Ranges of "Related:" boilerplate paragraphs (and any .related* container).
  const relatedRanges = [];
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRe.exec(html))) {
    const text = pm[1].replace(/<[^>]+>/g, '').trim();
    if (/^Related\s*:/i.test(text)) relatedRanges.push([pm.index, pm.index + pm[0].length]);
  }
  const divRe = /<div\b[^>]*class="[^"]*related[^"]*"[^>]*>/gi;
  let dm;
  while ((dm = divRe.exec(html))) relatedRanges.push([dm.index, html.length]);

  const inRange = (i, r) => r && i >= r.start && i <= r.end;
  const inAny = (i, ranges) => ranges.some(([a, b]) => i >= a && i <= b);

  // ── every internal link ──
  const linkRe = /<a\s[^>]*href="(\/[^"#?]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let m;
  while ((m = linkRe.exec(html))) {
    const href = m[1].endsWith('/') ? m[1] : m[1] + '/';
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    let zone = 'body';
    if (inRange(m.index, header)) zone = 'nav';
    else if (inRange(m.index, footer)) zone = 'footer';
    else if (inAny(m.index, relatedRanges)) zone = 'related';
    else if (!inRange(m.index, article) && !inRange(m.index, main)) zone = 'other';

    links.push({ href, text, zone, pos: m.index });
  }

  // body links ranked by order of appearance — the click-probability proxy (§3.2)
  let n = 0;
  for (const l of links) if (l.zone === 'body') l.order = ++n;

  return { slug, file: path.relative(LANDING, file), title, h1, links, raw: html };
}

// ── build the graph ──────────────────────────────────────────────────────────
const files = findPages(LANDING);
const pages = files.map(parsePage);
const bySlug = new Map(pages.map((p) => [p.slug, p]));

const inbound = new Map();  // slug -> {body, related, nav, footer}
const touch = (s) => {
  if (!inbound.has(s)) inbound.set(s, { body: 0, related: 0, nav: 0, footer: 0, other: 0, sources: [] });
  return inbound.get(s);
};
for (const p of pages) touch(p.slug);
for (const p of pages) {
  for (const l of p.links) {
    if (!bySlug.has(l.href)) continue;         // only count links to pages we build
    const rec = touch(l.href);
    rec[l.zone] = (rec[l.zone] || 0) + 1;
    if (l.zone === 'body') rec.sources.push(p.slug);
  }
}

// ── anchor quality: token overlap between anchor text and target title ───────
const STOP = new Set(['a','an','the','and','or','for','to','of','in','on','vs','versus','is','are','your','you','with','what','how','signed','reviews','signedreviews','review','2026','mean','means','does','do','it','that','this','from','by']);
// Crude suffix stripping. Without it "feature set" -> /features/ scored 0 and was
// reported as a weak anchor purely because "feature" !== "features". Only plurals
// and the two most common verb endings: aggressive enough to stop the noise,
// conservative enough not to merge unrelated words.
const stem = (w) => {
  const s = w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '');
  return s.length > 2 ? s : w;
};
const toks = (s) => new Set(
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
   .filter((w) => w.length > 2 && !STOP.has(w))
   .map(stem)
);
const similarity = (a, b) => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size);
};

const anchorIssues = [];
for (const p of pages) {
  const target = bySlug.get(p.slug);
  for (const l of p.links) {
    if (l.zone !== 'body' && l.zone !== 'related') continue;
    const t = bySlug.get(l.href);
    if (!t) continue;
    const sim = similarity(l.text, t.title || t.h1);
    const generic = /^(click here|read more|learn more|more|this|here|see more|find out more|this page|this article)$/i.test(l.text);
    if (generic || sim < 0.34) {
      anchorIssues.push({ from: p.slug, to: l.href, text: l.text, zone: l.zone, sim: +sim.toFixed(2), generic });
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────
const orphans = [...inbound.entries()]
  .filter(([s, r]) => r.body < 3)
  .sort((a, b) => a[1].body - b[1].body);

const totalBody = [...inbound.values()].reduce((n, r) => n + r.body, 0);
const totalRelated = [...inbound.values()].reduce((n, r) => n + r.related, 0);
const totalNav = [...inbound.values()].reduce((n, r) => n + r.nav, 0);
const totalFooter = [...inbound.values()].reduce((n, r) => n + r.footer, 0);

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log('\n═══ INTERNAL LINK GRAPH — signedreviews.com ═══\n');
console.log(`Pages parsed: ${pages.length}\n`);
console.log('Inbound links by container:');
console.log(`  body (counts)     ${padL(totalBody, 5)}`);
console.log(`  related (boiler)  ${padL(totalRelated, 5)}`);
console.log(`  nav               ${padL(totalNav, 5)}`);
console.log(`  footer            ${padL(totalFooter, 5)}`);
const contentLinks = totalBody + totalRelated;
const chromeLinks = totalNav + totalFooter;
const allLinks = contentLinks + chromeLinks;
console.log(`\n  → body links are ${((totalBody / (contentLinks || 1)) * 100).toFixed(1)}% of content links (body + related).`);
console.log(`  → ${((chromeLinks / (allLinks || 1)) * 100).toFixed(1)}% of all ${allLinks} internal links are nav+footer chrome.`);

console.log(`\n── Orphans (fewer than 3 inbound BODY links): ${orphans.length} of ${pages.length} ──\n`);
console.log(`  ${pad('body', 6)}${pad('rel', 6)}${pad('nav', 5)}${pad('ftr', 5)}  URL`);
for (const [s, r] of orphans) {
  console.log(`  ${pad(r.body, 6)}${pad(r.related, 6)}${pad(r.nav, 5)}${pad(r.footer, 5)}  ${s}`);
}

console.log('\n── Most-linked targets (body) ──\n');
[...inbound.entries()]
  .filter(([, r]) => r.body > 0)
  .sort((a, b) => b[1].body - a[1].body)
  .slice(0, 15)
  .forEach(([s, r]) => console.log(`  ${padL(r.body, 4)}  ${s}`));

console.log(`\n── Weak / generic anchors: ${anchorIssues.length} ──\n`);
const genericOnes = anchorIssues.filter((a) => a.generic);
if (genericOnes.length) {
  console.log('  GENERIC (highest priority):');
  genericOnes.forEach((a) => console.log(`    "${a.text}"  ${a.from} → ${a.to}  [${a.zone}]`));
} else {
  console.log('  no generic "click here"-style anchors found');
}
console.log(`\n  low-similarity anchors: ${anchorIssues.length - genericOnes.length}`);

const jsonPath = process.argv.indexOf('--json');
if (jsonPath !== -1 && process.argv[jsonPath + 1]) {
  const out = {
    generated: new Date().toISOString(),
    pages: pages.map((p) => ({
      slug: p.slug, title: p.title,
      outbound: p.links.reduce((a, l) => (a[l.zone] = (a[l.zone] || 0) + 1, a), {}),
      bodyLinks: p.links.filter((l) => l.zone === 'body').map((l) => ({ href: l.href, text: l.text, order: l.order })),
    })),
    inbound: Object.fromEntries([...inbound.entries()].map(([s, r]) => [s, { ...r }])),
    orphans: orphans.map(([s, r]) => ({ slug: s, ...r })),
    anchorIssues,
  };
  fs.writeFileSync(process.argv[jsonPath + 1], JSON.stringify(out, null, 2));
  console.log(`\nJSON → ${process.argv[jsonPath + 1]}`);
}
console.log('');
