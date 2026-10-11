/**
 * Markdown twins for AI agents.
 *
 * Writes dist/<page>/index.md next to every indexable page in dist/, converted
 * from the page's <main> content, so the markdown an agent receives (via
 * `Accept: text/markdown`, see workers/apex-router.js and functions/[[path]].js)
 * is always the copy we just built. These replaced hand-written markdown tables
 * that drifted from the site and kept claims the pages had already dropped.
 *
 * Also adds <link rel="alternate" type="text/markdown"> to each twinned page.
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

// Directories that hold assets or non-page HTML, never pages worth a twin.
const SKIP_DIRS = new Set(['files', 'images', 'js', 'functions', '.well-known', 'video']);

const DROP_TAGS = ['script', 'style', 'noscript', 'template', 'svg', 'form', 'button', 'iframe',
  'select', 'textarea', 'input', 'nav', 'img', 'picture', 'video', 'audio', 'canvas', 'dialog'];

function decode(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function meta(html, re) {
  const m = html.match(re);
  return m ? decode(m[1]).trim() : '';
}

function makeConverter(siteUrl, pageUrl) {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  td.use(gfm);
  td.remove(DROP_TAGS);
  // Built-in rules (image, paragraph...) outrank remove(), so drop these with a rule.
  td.addRule('dropHidden', {
    filter: node => node.nodeName === 'IMG' || (node.getAttribute && node.getAttribute('aria-hidden') === 'true'),
    replacement: () => '',
  });
  td.addRule('absoluteLinks', {
    filter: node => node.nodeName === 'A' && node.getAttribute('href'),
    replacement: (content, node) => {
      const text = content.trim();
      if (!text) return '';
      let href = node.getAttribute('href');
      if (/^(javascript:|mailto:$)/i.test(href)) return text;
      if (href.startsWith('#')) href = pageUrl + href;
      else if (href.startsWith('/')) href = siteUrl + href;
      else if (!/^[a-z]+:/i.test(href)) href = new URL(href, pageUrl).href;
      return `[${text}](${href})`;
    },
  });
  return td;
}

function pagesIn(distDir) {
  const out = [];
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!rel && SKIP_DIRS.has(entry.name)) continue;
      const sub = path.join(dir, entry.name);
      const r = `${rel}/${entry.name}`;
      if (fs.existsSync(path.join(sub, 'index.html'))) out.push({ file: path.join(sub, 'index.html'), route: `${r}/` });
      walk(sub, r);
    }
  };
  if (fs.existsSync(path.join(distDir, 'index.html'))) out.push({ file: path.join(distDir, 'index.html'), route: '/' });
  walk(distDir, '');
  return out;
}

function writeMarkdownTwins(distDir, siteUrl) {
  let written = 0;
  let skipped = 0;
  for (const { file, route } of pagesIn(distDir)) {
    let html = fs.readFileSync(file, 'utf8');
    // Hidden pages (noindex) and redirect stubs get no twin.
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html) || /http-equiv="refresh"/i.test(html)) { skipped++; continue; }
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    if (!main) { skipped++; continue; }

    const pageUrl = meta(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || siteUrl + route;
    const title = meta(html, /<title>([\s\S]*?)<\/title>/i);
    const description = meta(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i);

    const body = makeConverter(siteUrl, pageUrl)
      .turndown(main[1])
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (body.length < 200) { skipped++; continue; }

    const front = ['---', `title: ${JSON.stringify(title)}`];
    if (description) front.push(`description: ${JSON.stringify(description)}`);
    front.push(`url: ${pageUrl}`, '---', '');
    fs.writeFileSync(path.join(path.dirname(file), 'index.md'), front.join('\n') + '\n' + body + '\n', 'utf8');

    const mdHref = route === '/' ? '/index.md' : `${route}index.md`;
    if (!html.includes('type="text/markdown"')) {
      html = html.replace('</head>', `  <link rel="alternate" type="text/markdown" href="${mdHref}">\n</head>`);
      fs.writeFileSync(file, html, 'utf8');
    }
    written++;
  }
  return { written, skipped };
}

module.exports = { writeMarkdownTwins };
