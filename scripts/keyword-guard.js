#!/usr/bin/env node
/**
 * keyword-guard.js — read-only tracked-keyword presence guard.
 *
 * The rank tracker validates a keyword against a live page with strict exact
 * phrase matching (platform/backend/src/services/seoEngine.js, normalized so
 * hyphens read as spaces). Before page titles and meta descriptions are
 * rewritten site-wide, this guard proves no tracked keyword loses that
 * presence: it reads the BUILT html files (the committed ground truth under
 * landingpage/<page>/index.html) and reports, for every entry in
 * platform/backend/src/lib/seo-targets.js, whether the exact phrase appears
 * in the title, the meta description, the body text and the H2 text.
 *
 * It reads and reports. The only thing it ever writes is the optional --json
 * snapshot file.
 *
 * Usage:
 *   node landingpage/scripts/keyword-guard.js                  # human report (exits 0)
 *   node landingpage/scripts/keyword-guard.js --json <path>    # human report + snapshot
 *   node landingpage/scripts/keyword-guard.js --diff <path>    # compare against a snapshot
 *
 * Both invocations resolve the tree from __dirname, never cwd:
 *   node landingpage/scripts/keyword-guard.js      # from the SignedReviews root
 *   node scripts/keyword-guard.js                  # from landingpage/
 *
 * Exit codes: 0 = ran (or --diff with no losses), 1 = --diff found at least one
 *             loss, 2 = bad usage or an unreadable input.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LANDING_DIR = path.join(REPO_ROOT, 'landingpage');
const SCRIPT_REL = 'landingpage/scripts/keyword-guard.js';

// ── extraction ───────────────────────────────────────────────────────────────

const TITLE_RE = /<title>([^<]*)<\/title>/i;
const META_RE = /<meta\s+(?:name="description"\s+content="([^"]*)"|content="([^"]*)"\s+name="description")/i;
const H2_RE = /<h2[^>]*>[\s\S]*?<\/h2>/gi;

// ── small helpers ────────────────────────────────────────────────────────────

function toPosix(file) {
  return file.split(path.sep).join('/');
}

/** Same normalization the seoEngine validator uses: hyphens read as spaces. */
function norm(s) {
  return s.toLowerCase().replace(/-/g, ' ');
}

function present(keyword, fieldText) {
  return norm(fieldText).includes(norm(keyword));
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function collapse(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function yn(value) {
  return value ? 'Y' : 'N';
}

// ── per-page extraction ──────────────────────────────────────────────────────

/** `/` -> landingpage/index.html, `/blog/x/` -> landingpage/blog/x/index.html. */
function builtFileFor(page) {
  const rel = `landingpage/${page.replace(/^\//, '')}index.html`;
  return { abs: path.join(REPO_ROOT, ...rel.split('/')), rel };
}

/**
 * Built titles contain entities ("Options &amp; Yotpo"), so decode title, meta,
 * body and H2 text before matching. Tag stripping mirrors the tracker: body
 * tags become a space, H2 tags are removed outright.
 */
function extractFields(html) {
  const titleMatch = html.match(TITLE_RE);
  const metaMatch = html.match(META_RE);
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  const h2Blocks = stripped.match(H2_RE) || [];

  return {
    title: titleMatch ? decodeEntities(titleMatch[1]) : '',
    meta: metaMatch ? decodeEntities(metaMatch[1] || metaMatch[2]) : '',
    body: decodeEntities(collapse(stripped.replace(/<[^>]+>/g, ' '))),
    h2: decodeEntities(collapse(h2Blocks.map((block) => block.replace(/<[^>]+>/g, '')).join(' '))),
  };
}

/** Returns { rel, fields } for a readable page, or null for a missing one. */
function loadPage(abs, rel) {
  let html;
  try {
    html = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    if (fs.existsSync(abs)) {
      process.stderr.write(`keyword-guard: cannot read ${rel}: ${err.message}\n`);
    }
    return null;
  }
  return { rel, fields: extractFields(html) };
}

// ── keywords ─────────────────────────────────────────────────────────────────

function loadTargets() {
  let targetsModule;
  try {
    targetsModule = require(path.join(__dirname, '..', '..', 'platform', 'backend', 'src', 'lib', 'seo-targets.js'));
  } catch (err) {
    process.stderr.write(`keyword-guard: cannot load seo-targets.js: ${err.message}\n`);
    process.exit(2);
  }
  const { TARGETS } = targetsModule;
  if (!Array.isArray(TARGETS)) {
    process.stderr.write('keyword-guard: seo-targets.js does not export a TARGETS array\n');
    process.exit(2);
  }
  return TARGETS;
}

function collectResults(targets) {
  const cache = new Map();

  return targets.map((target) => {
    const built = builtFileFor(target.page);
    if (!cache.has(built.abs)) cache.set(built.abs, loadPage(built.abs, built.rel));
    const page = cache.get(built.abs);

    if (!page) {
      return {
        keyword: target.keyword,
        page: target.page,
        file: null,
        inTitle: false,
        inMeta: false,
        inBody: false,
        inH2: false,
      };
    }

    return {
      keyword: target.keyword,
      page: target.page,
      file: toPosix(page.rel),
      inTitle: present(target.keyword, page.fields.title),
      inMeta: present(target.keyword, page.fields.meta),
      inBody: present(target.keyword, page.fields.body),
      inH2: present(target.keyword, page.fields.h2),
    };
  });
}

// ── output ───────────────────────────────────────────────────────────────────

const USAGE = `keyword-guard — read-only tracked-keyword presence guard

  node landingpage/scripts/keyword-guard.js [--json <path> | --diff <path>]

  (no flags)      print the human report (exits 0)
  --json <path>   write the snapshot JSON to <path>, then print the human report
  --diff <path>   compare the current built pages against a snapshot; exits 1 on a loss

Human rows are ordered missing-page first, then partial, then fully present
(title+meta+body). Sources: platform/backend/src/lib/seo-targets.js (TARGETS)
and the built pages under landingpage/<page>/index.html.

Exit codes: 0 = ran (or --diff with no losses), 1 = --diff found at least one
loss, 2 = bad usage or an unreadable input.
`;

function renderReport(results, pageCount, jsonPath) {
  const missing = results.filter((row) => row.file === null);
  const partial = results.filter((row) => row.file !== null && !(row.inTitle && row.inMeta && row.inBody));
  const full = results.filter((row) => row.file !== null && row.inTitle && row.inMeta && row.inBody);

  const lines = [
    `keyword-guard: ${results.length} keywords across ${pageCount} unique pages; ${full.length} fully exact-present (title+meta+body), ${partial.length} partial, ${missing.length} missing-page.`,
  ];

  for (const row of [...missing, ...partial, ...full]) {
    lines.push(`${row.keyword}  ->  ${row.page}   title:${yn(row.inTitle)} meta:${yn(row.inMeta)} body:${yn(row.inBody)} h2:${yn(row.inH2)}`);
  }

  if (jsonPath) lines.push(`snapshot written: ${jsonPath} (${results.length} rows)`);

  return lines.join('\n') + '\n';
}

// ── snapshot ─────────────────────────────────────────────────────────────────

function writeSnapshot(file, results) {
  const abs = path.resolve(process.cwd(), file);
  const snapshot = {
    generated: new Date().toISOString(),
    script: SCRIPT_REL,
    results,
  };
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(snapshot, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`keyword-guard: cannot write snapshot ${file}: ${err.message}\n`);
    return 2;
  }
  return 0;
}

function loadSnapshot(file) {
  const abs = path.resolve(process.cwd(), file);
  let raw;
  try {
    raw = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    process.stderr.write(`keyword-guard: cannot read snapshot ${file}: ${err.message}\n`);
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`keyword-guard: cannot parse snapshot ${file}: ${err.message}\n`);
    process.exit(2);
  }
  if (!parsed || !Array.isArray(parsed.results)) {
    process.stderr.write(`keyword-guard: snapshot ${file} needs a results array\n`);
    process.exit(2);
  }
  return parsed;
}

// ── diff ─────────────────────────────────────────────────────────────────────

const FIELDS = ['inTitle', 'inMeta', 'inBody', 'inH2'];

function diffKey(row) {
  return `${row.keyword} -> ${row.page}`;
}

function renderDiff(results, baseline) {
  const baseByKey = new Map(baseline.results.map((row) => [diffKey(row), row]));
  const lines = [];
  let losses = 0;
  let gains = 0;
  let news = 0;

  for (const row of results) {
    const base = baseByKey.get(diffKey(row));

    if (!base) {
      lines.push(`NEW   ${row.keyword} -> ${row.page}`);
      news++;
      continue;
    }

    // A page whose built file was captured and is now missing loses every field.
    if (row.file === null && base.file !== null) {
      for (const field of FIELDS) {
        lines.push(`LOSS  ${field}  ${row.keyword}  ->  ${row.page}`);
        losses++;
      }
      continue;
    }

    for (const field of FIELDS) {
      const before = base[field] === true;
      const after = row[field] === true;
      if (before && !after) {
        lines.push(`LOSS  ${field}  ${row.keyword}  ->  ${row.page}`);
        losses++;
      } else if (!before && after) {
        lines.push(`GAIN  ${field}  ${row.keyword}  ->  ${row.page}`);
        gains++;
      }
    }
  }

  lines.push(`keyword-guard diff: ${losses} loss(es), ${gains} gain(s), ${news} new`);
  return { text: lines.join('\n') + '\n', losses };
}

// ── entry point ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const options = { json: null, diff: null };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json' || arg === '--diff') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        process.stderr.write(`keyword-guard: ${arg} needs a path\n\n${USAGE}`);
        process.exit(2);
      }
      if (options.json || options.diff) {
        process.stderr.write(`keyword-guard: --json and --diff cannot be combined\n\n${USAGE}`);
        process.exit(2);
      }
      options[arg.slice(2)] = value;
      i++;
    } else {
      process.stderr.write(`keyword-guard: unknown argument: ${arg}\n\n${USAGE}`);
      process.exit(2);
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const targets = loadTargets();
  const results = collectResults(targets);

  if (options.diff) {
    const baseline = loadSnapshot(options.diff);
    const diff = renderDiff(results, baseline);
    process.stdout.write(diff.text);
    return diff.losses > 0 ? 1 : 0;
  }

  const pageCount = new Set(targets.map((target) => target.page)).size;

  if (options.json) {
    const failure = writeSnapshot(options.json, results);
    if (failure !== 0) return failure;
  }

  process.stdout.write(renderReport(results, pageCount, options.json));
  return 0;
}

process.exitCode = main();
