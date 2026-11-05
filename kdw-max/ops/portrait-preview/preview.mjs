#!/usr/bin/env node
// PORTRAIT-LAYOUT-C preview: serves apps/max-game/www on 127.0.0.1 with the
// shipped app.js patched in memory (see patch-bundle.mjs). It also answers
// /__kdw/settings like the launcher, with manual entry (missions start by touch).
// Usage: node ops/portrait-preview/preview.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {patchBundle} from './patch-bundle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../../apps/max-game');
const www = path.join(app, 'www');
const port = Number(process.argv[2] ?? 8770);
const bundle = Buffer.from(patchBundle(fs.readFileSync(path.join(www, 'webgl-v5/app.js'), 'utf8')));
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8'};

function settings() {
  const value = JSON.parse(fs.readFileSync(path.join(app, 'settings/stand.json'), 'utf8').replace(/^﻿/, ''));
  value.max.entryMode = 'manual';
  // production:true needs the launcher; the stand look is restored in client.html below.
  return {production: false, revision: 'portrait-preview', acceptedAt: new Date().toISOString(), error: null, value};
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (status, headers, body) => { res.writeHead(status, {'Cache-Control': 'no-store', ...headers}); res.end(body); };
  if (url.pathname === '/__kdw/settings') return send(200, {'Content-Type': 'application/json'}, JSON.stringify(settings()));
  if (url.pathname === '/webgl-v5/app.js') return send(200, {'Content-Type': 'text/javascript'}, bundle);
  if (url.pathname === '/webgl-v5/client.html') {
    // As in production: no debug "Назад" button and no corner MAX logo during missions.
    const html = fs.readFileSync(path.join(www, 'webgl-v5/client.html'), 'utf8')
      .replace('</head>', '<style>.kdw-browser-back,.v5-brand{display:none!important}</style></head>');
    return send(200, {'Content-Type': 'text/html; charset=utf-8'}, html);
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(www, '.' + rel);
  if (!file.startsWith(www + path.sep)) return send(403, {}, '');
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return send(404, {}, '');
    const type = types[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : stat.size - 1;
      res.writeHead(206, {'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1});
      fs.createReadStream(file, {start, end}).pipe(res);
    } else {
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes', 'Content-Length': stat.size});
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`MAX portrait preview: http://127.0.0.1:${port}/webgl-v5/client.html?backend=local&view=pixel-map&display=portrait`);
  console.log('Open it in Chrome on the vertical monitor and press F11. Ctrl+C stops the server.');
});
