#!/usr/bin/env node
/**
 * Tiny zero-dependency static file server for local preview.
 * Resolves /foo/ to /foo/index.html so the deployed routing matches GitHub Pages.
 *
 *   node dev-server.js              →  http://localhost:4173
 *   node dev-server.js --host       →  http://0.0.0.0:4173 (accessible from LAN / iOS devices)
 *   node dev-server.js --host 8080  →  http://0.0.0.0:8080
 */
const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const url  = require('node:url');
const os   = require('node:os');

const HOST = process.argv.includes('--host') ? '0.0.0.0' : '127.0.0.1';
const PORT = Number(process.env.PORT || (process.argv.includes('--host') && /^\d+$/.test(process.argv[process.argv.indexOf('--host') + 1])
  ? process.argv[process.argv.indexOf('--host') + 1]
  : 4173));
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname || '/');
    let filePath = path.join(ROOT, pathname);

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    } catch (_) {
      // not found — fall through; if it's a path without extension, try /index.html
      if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('404 — ' + pathname);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.end(data);
    });
  })
  .listen(PORT, HOST, () => {
    const addr = HOST === '0.0.0.0' ? '0.0.0.0' : 'localhost';
    console.log(`signedreviews.com preview at http://${addr}:${PORT}`);

    // When bound to all interfaces, print LAN addresses for device testing
    if (HOST === '0.0.0.0') {
      const ifaces = os.networkInterfaces();
      const seen = new Set();
      for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            if (seen.has(iface.address)) continue;
            seen.add(iface.address);
            console.log(`  → iOS device: http://${iface.address}:${PORT}`);
          }
        }
      }
      console.log('  (open that URL in Safari on your iPhone/iPad — same Wi-Fi network)');
    }
  });
