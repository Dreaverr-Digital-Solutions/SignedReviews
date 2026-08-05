// Notify the SEO dashboard that a deploy is expected.
// Reads SEO_DEPLOY_NOTIFY_KEY from the local .env file.
// Usage: node notify-deploy.js [commit-sha]
const fs = require('fs');
const path = require('path');

// Load .env manually (no dependency needed)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && val) process.env[key] = val;
    }
  }
}

const key = process.env.SEO_DEPLOY_NOTIFY_KEY;
if (!key) {
  console.error('✗ SEO_DEPLOY_NOTIFY_KEY not found in .env');
  process.exit(1);
}

const commit = process.argv[2] || null;
const body = JSON.stringify(commit ? { commit } : {});

fetch('https://api.signedreviews.com/api/admin/seo/expect-deploy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Deploy-Notify-Key': key,
  },
  body,
})
  .then(r => r.json())
  .then(d => {
    if (d.error) {
      console.error('✗', d.error);
      process.exit(1);
    }
    console.log('✓ SEO dashboard notified:', JSON.stringify(d));
  })
  .catch(e => {
    console.error('✗', e.message);
    process.exit(1);
  });
