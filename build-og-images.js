#!/usr/bin/env node
/**
 * Per-article OG image generator.
 *
 * Creates 1200×630 social preview PNGs for every blog post. Each image uses the
 * Signed Reviews brand colors (navy background, gold accents) with the article
 * title overlaid. Output goes to images/og/ — referenced by build.js for
 * og:image + twitter:image on each blog post page.
 *
 * Requires sharp (already a devDependency). Run standalone or as part of
 * `npm run build`.
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = __dirname;
const FILES_DIR = path.join(ROOT, 'files');
const OUT_DIR = path.join(ROOT, 'images', 'og');
const LOGO_PATH = path.join(ROOT, 'images', 'SignedReviews_logo_only.png');
const WORDMARK_PATH = path.join(ROOT, 'images', 'SignedReviews_font_only.webp');

const WIDTH = 1200;
const HEIGHT = 630;

// ── Brand palette ──────────────────────────────────────────────────────────────
const NAVY_DARK = '#0c1320';
const NAVY_MID = '#1c2840';
const GOLD = '#d4c466';
const GOLD_DIM = 'rgba(212, 196, 102, 0.5)';
const WHITE = '#e7ecf3';
const MUTED = 'rgba(231, 236, 243, 0.65)';

function wrapText(title, maxCharsPerLine) {
  const words = title.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxCharsPerLine) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function svgOgImage(title, eyebrow) {
  const lines = wrapText(title, 45);
  const lineHeight = 58;
  // Position text block vertically centered, adjusted for logo
  const totalTextHeight = lines.length * lineHeight;
  const startY = (HEIGHT - totalTextHeight) / 2 - 10;

  const textSpans = lines
    .map(
      (line, i) =>
        `<tspan x="600" dy="${i === 0 ? 0 : lineHeight}" style="font-family:'Instrument Serif',Georgia,serif;font-size:48px;font-weight:400;fill:${WHITE};letter-spacing:-0.01em;text-anchor:middle;">${escapeXml(line)}</tspan>`
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${NAVY_DARK}"/>
      <stop offset="100%" stop-color="${NAVY_MID}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Subtle decorative line -->
  <line x1="80" y1="${startY - 24}" x2="160" y2="${startY - 24}" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>

  <!-- Eyebrow -->
  <text x="600" y="${startY - 40}" style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;font-weight:600;letter-spacing:0.15em;fill:${GOLD};text-anchor:middle;text-transform:uppercase;">${escapeXml(eyebrow)}</text>

  <!-- Title -->
  <text x="600" y="${startY}" style="font-family:'Instrument Serif',Georgia,serif;font-size:48px;font-weight:400;fill:${WHITE};text-anchor:middle;">
    ${textSpans}
  </text>

  <!-- Bottom: brand + URL -->
  <text x="600" y="590" style="font-family:'Inter',system-ui,sans-serif;font-size:14px;fill:${MUTED};text-anchor:middle;">signedreviews.com</text>

  <!-- Gold accent bottom bar -->
  <rect x="0" y="626" width="${WIDTH}" height="4" fill="${GOLD}" opacity="0.6"/>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  // Read blog posts to get titles
  const blogDir = path.join(FILES_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    console.log('  (no blog posts — skipping OG images)');
    return;
  }

  // Ensure output directory
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const titleMatch = raw.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '').replace(/-/g, ' ');
    const slug = file.replace(/\.md$/, '');
    const outFile = path.join(OUT_DIR, `${slug}.png`);

    const svg = svgOgImage(title, 'Signed Reviews Blog');

    try {
      await sharp(Buffer.from(svg)).png().toFile(outFile);
      console.log(`  ✓ og:${slug}`);
    } catch (err) {
      console.error(`  ✗ og:${slug} — ${err.message}`);
    }
  }

  console.log(`  → ${files.length} OG images in images/og/`);
}

main().catch((err) => {
  console.error('OG image generation failed:', err.message);
  process.exit(1);
});
