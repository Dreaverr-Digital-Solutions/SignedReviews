#!/usr/bin/env node
/**
 * Copy the site-analytics tracking plan from the platform repo (the canonical copy, read by the
 * collector, the reports and the admin dashboard) into analytics/analytics.config.json, which
 * build.js inlines into the tracker. Run it whenever the plan changes, then deploy the backend
 * before this site (the collector drops events it doesn't know). See platform/ANALYTICS.md.
 *
 *   node scripts/sync-analytics-config.js           # copy
 *   node scripts/sync-analytics-config.js --check   # exit 1 when the copies differ
 */
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', '..', 'platform', 'backend', 'src', 'siteAnalytics', 'analytics.config.json');
const DEST = path.join(__dirname, '..', 'analytics', 'analytics.config.json');

if (!fs.existsSync(SRC)) {
  console.error(`sync-analytics-config: canonical plan not found at ${SRC}`);
  process.exit(process.argv.includes('--check') ? 0 : 1);
}
const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const dest = fs.existsSync(DEST) ? fs.readFileSync(DEST, 'utf8').replace(/\r\n/g, '\n') : null;
if (process.argv.includes('--check')) {
  if (src !== dest) {
    console.error('sync-analytics-config: analytics/analytics.config.json differs from the platform copy. Run node scripts/sync-analytics-config.js');
    process.exit(1);
  }
  console.log('sync-analytics-config: copies match');
} else {
  fs.writeFileSync(DEST, src);
  console.log(`sync-analytics-config: ${src === dest ? 'already up to date' : 'updated'} analytics/analytics.config.json`);
}
