#!/usr/bin/env node
/**
 * Tiny zero-dependency static file server for local preview.
 * Resolves /foo/ to /foo/index.html so the deployed routing matches GitHub Pages.
 *   node dev-server.js  →  http://localhost:4173
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = Number(process.env.PORT || 4173);
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
  .listen(PORT, () => {
    console.log(`signedreviews.com preview at http://localhost:${PORT}`);
  });
