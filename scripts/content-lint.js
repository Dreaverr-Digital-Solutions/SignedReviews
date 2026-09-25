#!/usr/bin/env node
/**
 * content-lint.js — read-only copy linter for Signed Reviews prose.
 *
 * Reports the two house copy rules from content-humanization-plan.md §4:
 *   S1  no em dashes (U+2014) in prose
 *   S3  no AI-flavoured vocabulary, whole word and case-insensitive
 * plus the exemptions the plan spells out in S2 and S9.
 *
 * It reads and reports. It never writes, rewrites or fixes anything.
 *
 * Usage:
 *   node landingpage/scripts/content-lint.js                 # human report (exits 0)
 *   node landingpage/scripts/content-lint.js --json          # findings as JSON
 *   node landingpage/scripts/content-lint.js --strict        # exit 1 when findings exist
 *   node landingpage/scripts/content-lint.js --file <path>   # one file only, for editor hooks
 *
 * Both invocations scan the same files:
 *   node landingpage/scripts/content-lint.js       # from the repo root
 *   node scripts/content-lint.js                   # from landingpage/
 *
 * Exit codes: 0 = ran (with or without findings), 1 = --strict and findings exist,
 *             2 = bad usage or an unreadable input file.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ALLOWLIST_FILE = path.join(__dirname, 'content-lint-allowlist.json');
const EM_DASH = '—';

// ── the rules ────────────────────────────────────────────────────────────────

const BANNED_TERMS = [
  'delve',
  'underscore',
  'enhance',
  'unlock',
  'foster',
  'groundbreaking',
  'enlightening',
  'elevate',
  'empower',
  'streamlined',
  'robust',
  'forge',
  'paradigm',
  'revolutionary',
  'realm',
  'tapestry',
  'leverage',
  'seamless',
  'cutting-edge',
  'game-changer',
  'meticulous',
  'testament',
  'pivotal',
  'crucial',
  'comprehensive',
  'moreover',
  'furthermore',
  'additionally',
  'navigate the',
  "in today's fast-paced",
  "it's worth noting",
  'at the end of the day',
  'finds you well',
  'trust this email',
];

const BANNED_PATTERNS = BANNED_TERMS.map((term) => ({
  term,
  pattern: new RegExp('\\b' + escapeRegExp(term) + '\\b', 'gi'),
}));

// ── where copy lives (content-humanization-plan.md §3.1) ─────────────────────

const SCAN_FILES = [
  'landingpage/index.html',
  'landingpage/build.js',
  'platform/backend/src/services/email.js',
  'platform/backend/src/services/emailVariants.js',
  'platform/backend/src/services/reminderTemplate.js',
];

const SCAN_GLOBS = [
  'landingpage/files/**/*.md',
  'platform/frontend/src/**/*.jsx',
  'platform/frontend/src/**/*.js',
];

// Exemptions (S9, plus the one-off exclusions named in the brief).
const SKIP_GLOBS = [
  'platform/.planning/**',
  'platform/.claude/**',
  'landingpage/SEO_PLAN.md',
  // The dashboard is not publicly exposed, so its copy is out of scope by an
  // explicit decision recorded on 2026-09-24.
  'platform/frontend/**',
  'platform/frontend/src/components/admin/**',
  'platform/backend/prisma/seed.js',
  'landingpage/files/blog/trustpilot-widget-examples.md',
  // Test files: their hits are test titles rather than copy.
  '**/__tests__/**',
  '**/*.test.jsx',
  '**/*.test.js',
  '**/*.spec.js',
];

const SKIP_PATTERNS = SKIP_GLOBS.map(globToRegExp);

// ── small helpers ────────────────────────────────────────────────────────────

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPosix(file) {
  return file.split(path.sep).join('/');
}

// Glob to RegExp: a double star crosses separators, a double star followed by a
// slash may also match nothing, and a single star stays inside one segment.
function globToRegExp(glob) {
  let out = '';
  let i = 0;
  while (i < glob.length) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?';
          i += 3;
        } else {
          out += '.*';
          i += 2;
        }
      } else {
        out += '[^/]*';
        i += 1;
      }
    } else {
      out += escapeRegExp(ch);
      i += 1;
    }
  }
  return new RegExp('^' + out + '$');
}

function isSkippedPath(relPath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(relPath));
}

function rulesFor(relPath) {
  const lower = relPath.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'js';
  return 'text';
}

function walk(dir, matches, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, matches, out);
    else if (matches(full)) out.push(full);
  }
  return out;
}

// ── source masking: blank out everything that is not prose ───────────────────

function blank(chars, from, to) {
  for (let i = from; i < to && i < chars.length; i++) {
    if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
  }
}

const WORD_CHAR = /[A-Za-z0-9_$]/;
const REGEX_PRECEDERS = new Set(['(', ',', '{', '[', ';', ':', '=', '!', '&', '|', '?', '+', '-', '*', '%', '<', '>', '^', '~']);
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do', 'else', 'yield', 'await', 'case']);

/**
 * Blank // line comments and /* block comments in JS/JSX, keeping every offset
 * intact so line and column numbers still point at the original source.
 * Strings and template literals are NOT blanked: email and UI copy lives there.
 */
function maskJavaScript(src) {
  const chars = src.split('');
  const n = src.length;
  let i = 0;
  let state = 'code';
  let inRegexClass = false;
  let lastSig = '';
  let lastWord = '';
  const stack = []; // { type: 'template' } | { type: 'expr', braces }

  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        let end = i;
        while (end < n && src[end] !== '\n') end++;
        blank(chars, i, end);
        i = end;
        continue;
      }
      if (ch === '/' && next === '*') {
        const close = src.indexOf('*/', i + 2);
        const end = close === -1 ? n : close + 2;
        blank(chars, i, end);
        i = end;
        continue;
      }
      if (ch === "'" || ch === '"') {
        state = ch === "'" ? 'single' : 'double';
        i++;
        continue;
      }
      if (ch === '`') {
        stack.push({ type: 'template' });
        state = 'template';
        i++;
        continue;
      }
      if (ch === '/' && (lastSig === '' || REGEX_PRECEDERS.has(lastSig) || REGEX_KEYWORDS.has(lastWord))) {
        state = 'regex';
        inRegexClass = false;
        i++;
        continue;
      }
      const top = stack[stack.length - 1];
      if (top && top.type === 'expr') {
        if (ch === '{') top.braces++;
        else if (ch === '}') {
          if (top.braces === 0) {
            stack.pop();
            state = 'template';
            i++;
            continue;
          }
          top.braces--;
        }
      }
      if (!/\s/.test(ch)) {
        if (WORD_CHAR.test(ch)) lastWord += ch;
        else lastWord = '';
        lastSig = ch;
      }
      i++;
      continue;
    }

    if (state === 'single' || state === 'double') {
      const quote = state === 'single' ? "'" : '"';
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) {
        state = 'code';
        lastSig = quote;
        lastWord = '';
        i++;
        continue;
      }
      if (ch === '\n') {
        // An unterminated quote cannot span a line in JS; treat it as ordinary text.
        state = 'code';
        i++;
        continue;
      }
      i++;
      continue;
    }

    if (state === 'template') {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') {
        stack.pop();
        state = 'code';
        lastSig = '`';
        lastWord = '';
        i++;
        continue;
      }
      if (ch === '$' && next === '{') {
        stack.push({ type: 'expr', braces: 0 });
        state = 'code';
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // state === 'regex'
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '[') {
      inRegexClass = true;
      i++;
      continue;
    }
    if (ch === ']') {
      inRegexClass = false;
      i++;
      continue;
    }
    if (ch === '/' && !inRegexClass) {
      state = 'code';
      lastSig = '/';
      lastWord = '';
      i++;
      continue;
    }
    if (ch === '\n') {
      state = 'code';
      i++;
      continue;
    }
    i++;
  }

  return chars.join('');
}

/**
 * Blank HTML comments, and the whole of any <script> or <style> element.
 * Safe to run on markdown too: fenced code is already blanked by then.
 */
function maskHtml(src) {
  const chars = src.split('');
  const lower = src.toLowerCase();
  const n = src.length;
  let i = 0;

  while (i < n) {
    if (lower.startsWith('<!--', i)) {
      const close = lower.indexOf('-->', i + 4);
      const end = close === -1 ? n : close + 3;
      blank(chars, i, end);
      i = end;
      continue;
    }
    if (lower.startsWith('<script', i) || lower.startsWith('<style', i)) {
      const closeTag = lower.startsWith('<script', i) ? '</script' : '</style';
      const close = lower.indexOf(closeTag, i + 1);
      let end = n;
      if (close !== -1) {
        const gt = lower.indexOf('>', close);
        end = gt === -1 ? n : gt + 1;
      }
      blank(chars, i, end);
      i = end;
      continue;
    }
    i++;
  }

  return chars.join('');
}

/** Blank fenced code blocks (triple backticks), then apply the HTML rules. */
function maskMarkdown(src) {
  const chars = src.split('');
  const n = src.length;
  let inFence = false;
  let lineStart = 0;

  while (lineStart < n) {
    let lineEnd = src.indexOf('\n', lineStart);
    if (lineEnd === -1) lineEnd = n;
    const line = src.slice(lineStart, lineEnd);
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      blank(chars, lineStart, lineEnd);
    } else if (inFence) {
      blank(chars, lineStart, lineEnd);
    }
    lineStart = lineEnd + 1;
  }

  return maskHtml(chars.join(''));
}

function maskSource(src, rules) {
  if (rules === 'html') return maskHtml(src);
  if (rules === 'md') return maskMarkdown(src);
  if (rules === 'js') return maskJavaScript(src);
  return src;
}

// ── scanning ─────────────────────────────────────────────────────────────────

function scanMaskedLine(maskedLine, lineNumber) {
  const hits = [];

  for (let col = 0; col < maskedLine.length; col++) {
    if (maskedLine[col] === EM_DASH) {
      hits.push({ column: col + 1, kind: 'em-dash', term: EM_DASH });
    }
  }

  for (const { term, pattern } of BANNED_PATTERNS) {
    for (const match of maskedLine.matchAll(pattern)) {
      hits.push({ column: match.index + 1, kind: 'banned-word', term });
    }
  }

  hits.sort((a, b) => a.column - b.column || a.term.localeCompare(b.term));
  for (const hit of hits) hit.line = lineNumber;
  return hits;
}

function scanFile(target) {
  const src = fs.readFileSync(target.abs, 'utf8');
  const masked = maskSource(src, rulesFor(target.rel));
  const srcLines = src.split('\n');
  const maskedLines = masked.split('\n');
  const findings = [];

  for (let index = 0; index < srcLines.length; index++) {
    const maskedLine = maskedLines[index] || '';
    if (!maskedLine.trim()) continue;
    for (const hit of scanMaskedLine(maskedLine, index + 1)) {
      findings.push({
        file: target.rel,
        line: hit.line,
        column: hit.column,
        term: hit.term,
        kind: hit.kind,
        lineText: srcLines[index].replace(/\r$/, ''),
      });
    }
  }

  return findings;
}

// ── targets ──────────────────────────────────────────────────────────────────

function collectTargets() {
  const files = SCAN_FILES.slice();

  for (const pattern of SCAN_GLOBS) {
    const star = pattern.indexOf('*');
    const base = path.join(REPO_ROOT, pattern.slice(0, star).replace(/[/\\]+$/, ''));
    const extension = pattern.slice(pattern.lastIndexOf('*') + 1).replace(/^\./, '').toLowerCase();
    const matches = (full) => full.toLowerCase().endsWith('.' + extension);
    for (const full of walk(base, matches, [])) {
      files.push(toPosix(path.relative(REPO_ROOT, full)));
    }
  }

  return [...new Set(files)]
    .filter((rel) => !isSkippedPath(rel))
    .sort()
    .map((rel) => ({ abs: path.join(REPO_ROOT, rel), rel }));
}

function resolveOneTarget(input) {
  const candidates = path.isAbsolute(input)
    ? [input]
    : [path.resolve(process.cwd(), input), path.resolve(REPO_ROOT, input)];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return { abs: candidate, rel: toPosix(path.relative(REPO_ROOT, candidate)) };
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}

// ── allowlist ────────────────────────────────────────────────────────────────

function loadAllowlist() {
  let raw;
  try {
    raw = fs.readFileSync(ALLOWLIST_FILE, 'utf8');
  } catch {
    process.stderr.write(`content-lint: no allowlist at ${toPosix(path.relative(REPO_ROOT, ALLOWLIST_FILE))}; continuing without one\n`);
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`content-lint: cannot parse ${toPosix(path.relative(REPO_ROOT, ALLOWLIST_FILE))}: ${err.message}\n`);
    process.exit(2);
  }

  const entries = Array.isArray(parsed) ? parsed : parsed.entries;
  if (!Array.isArray(entries)) {
    process.stderr.write('content-lint: allowlist needs an "entries" array\n');
    process.exit(2);
  }

  const usable = [];
  for (const entry of entries) {
    const hasLine = Number.isInteger(entry && entry.line);
    const hasLineText = typeof (entry && entry.lineText) === 'string' && entry.lineText.length > 0;
    const hasMatch = typeof (entry && entry.match) === 'string';
    if (!entry || typeof entry.file !== 'string' || (!hasLine && !hasLineText && !hasMatch)) {
      process.stderr.write('content-lint: skipping malformed allowlist entry (needs file plus line, lineText or match)\n');
      continue;
    }
    if (typeof entry.reason !== 'string' || !entry.reason) {
      process.stderr.write(`content-lint: allowlist entry for ${entry.file} has no reason\n`);
    }
    usable.push(entry);
  }
  return usable;
}

/**
 * An entry matches a finding when the file matches and one of these does:
 *   lineText present  -> the finding's source line contains the entry's lineText
 *                        substring (the entry's line number, if any, is ignored)
 *   otherwise         -> the entry's line number equals the finding's line
 * plus, when the entry carries a "match", the matched term.
 */
function isAllowlisted(finding, allowlist) {
  return allowlist.some((entry) => {
    if (entry.file !== finding.file) return false;
    if (typeof entry.lineText === 'string') {
      if (!finding.lineText.includes(entry.lineText)) return false;
    } else if (Number.isInteger(entry.line) && entry.line !== finding.line) {
      return false;
    }
    if (typeof entry.match === 'string' && entry.match.toLowerCase() !== finding.term.toLowerCase()) return false;
    return true;
  });
}

// ── output ───────────────────────────────────────────────────────────────────

const USAGE = `content-lint — read-only em dash and AI-vocabulary reporter

  node landingpage/scripts/content-lint.js [--json] [--strict] [--file <path>]

  --json          print the findings as JSON (file, line, column, term, kind, lineText)
  --strict        exit 1 when any finding exists, 0 otherwise
  --file <path>   scan one file only, for an editor hook
  --help          print this message

Exit codes: 0 = ran, 1 = --strict with findings, 2 = bad usage or unreadable input.
Allowlist: landingpage/scripts/content-lint-allowlist.json (file plus line, lineText or match, and a reason).
`;

function renderReport(findings, fileCount, allowlistCount) {
  const out = [];
  for (const finding of findings) {
    const label = finding.kind === 'em-dash' ? 'em dash  U+2014' : `banned word "${finding.term}"`;
    out.push(`${finding.file}:${finding.line}:${finding.column}  ${label}`);
    out.push(`  | ${finding.lineText.trim()}`);
  }

  const dashes = findings.filter((finding) => finding.kind === 'em-dash').length;
  const words = findings.length - dashes;

  if (findings.length === 0) {
    out.push(`content-lint: no findings in ${fileCount} file(s) scanned (${allowlistCount} allowlisted).`);
  } else {
    out.push('');
    out.push(`content-lint: ${findings.length} finding(s) in ${fileCount} file(s) scanned: ${dashes} em dash(es), ${words} banned word(s); ${allowlistCount} allowlisted.`);
  }
  return out.join('\n') + '\n';
}

function toJsonFinding(finding) {
  return {
    file: finding.file,
    line: finding.line,
    column: finding.column,
    term: finding.term,
    kind: finding.kind,
    lineText: finding.lineText,
  };
}

// ── entry point ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const options = { json: false, strict: false, file: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--file') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        process.stderr.write(`content-lint: --file needs a path\n\n${USAGE}`);
        process.exit(2);
      }
      options.file = value;
      i++;
    } else {
      process.stderr.write(`content-lint: unknown argument: ${arg}\n\n${USAGE}`);
      process.exit(2);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  const allowlist = loadAllowlist();

  let targets;
  if (options.file) {
    const target = resolveOneTarget(options.file);
    if (!target) {
      process.stderr.write(`content-lint: file not found: ${options.file}\n`);
      return 2;
    }
    if (isSkippedPath(target.rel)) {
      process.stdout.write(`content-lint: skipped (excluded path): ${target.rel}\n`);
      return 0;
    }
    targets = [target];
  } else {
    targets = collectTargets();
  }

  const findings = [];
  let allowlistCount = 0;

  for (const target of targets) {
    let fileFindings;
    try {
      fileFindings = scanFile(target);
    } catch (err) {
      process.stderr.write(`content-lint: cannot read ${target.rel}: ${err.message}\n`);
      return 2;
    }
    for (const finding of fileFindings) {
      if (isAllowlisted(finding, allowlist)) {
        allowlistCount++;
        continue;
      }
      findings.push(finding);
    }
  }

  if (options.json) {
    process.stdout.write(JSON.stringify(findings.map(toJsonFinding), null, 2) + '\n');
  } else {
    process.stdout.write(renderReport(findings, targets.length, allowlistCount));
  }

  return options.strict && findings.length > 0 ? 1 : 0;
}

process.exitCode = main();
