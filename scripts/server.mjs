import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projects, root } from './projects.mjs';

const publicRoot = path.join(root, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };

function findProject(url) {
  const pathname = new URL(url, 'http://localhost').pathname;
  return projects.find(project => pathname === project.basePath || pathname.startsWith(`${project.basePath}/`));
}

function proxyRequest(req, res, project) {
  const upstream = http.request({
    hostname: '127.0.0.1', port: project.port, method: req.method, path: req.url,
    headers: { ...req.headers, host: `127.0.0.1:${project.port}`, 'x-forwarded-host': req.headers.host, 'x-forwarded-proto': req.socket.encrypted ? 'https' : 'http' },
  }, response => {
    if (response.headers.location) {
      try {
        const location = new URL(response.headers.location);
        if (location.hostname === '127.0.0.1' && location.port === String(project.port)) response.headers.location = `${location.pathname}${location.search}${location.hash}`;
      } catch {}
    }
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': types['.html'], 'Retry-After': '3', 'Cache-Control': 'no-store' });
      res.end('<!doctype html><html lang="az"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hazırlanır</title><style>body{font:16px system-ui;background:#f6f7f3;color:#253e35;padding:40px}button{padding:12px;border:1px solid;border-radius:8px;cursor:pointer}</style><h1>Tətbiq hazırlanır</h1><p>Bir neçə saniyə sonra yenidən yoxla.</p><button onclick="location.reload()">Yenidən yoxla</button></html>');
    } else res.destroy();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
}

export function createServer() {
  const server = http.createServer(async (req, res) => {
    const project = findProject(req.url);
    if (project) return proxyRequest(req, res, project);
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/health') {
      const apps = await Promise.all(projects.map(async project => {
        try {
          const response = await fetch(`http://127.0.0.1:${project.port}${project.basePath}`, { signal: AbortSignal.timeout(2000), redirect: 'follow' });
          await response.body?.cancel();
          return { id: project.id, ready: response.ok };
        } catch { return { id: project.id, ready: false }; }
      }));
      res.writeHead(apps.every(app => app.ready) ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ apps }));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    let filename;
    try { filename = path.resolve(publicRoot, `.${decodeURIComponent(pathname)}`); }
    catch { res.writeHead(400); return res.end(); }
    if (!filename.startsWith(`${publicRoot}${path.sep}`) && filename !== publicRoot) {
      res.writeHead(404); return res.end();
    }
    if (pathname === '/' || /^\/(sloth-ai|visio-generator|sprint-pointer|overtimer|level-up|calendar|todo)\/?$/.test(pathname)) filename = path.join(publicRoot, 'index.html');
    try {
      const content = await readFile(filename);
      res.writeHead(200, {
        'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'same-origin',
        'Cache-Control': 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Səhifə tapılmadı.');
    }
  });
  server.on('upgrade', (req, socket, head) => {
    const project = findProject(req.url);
    if (!project) return socket.destroy();
    const upstream = http.request({ hostname: '127.0.0.1', port: project.port, path: req.url, headers: req.headers });
    upstream.on('upgrade', (response, stream, upstreamHead) => {
      socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n')}\r\n\r\n`);
      if (upstreamHead.length) socket.write(upstreamHead);
      if (head.length) stream.write(head);
      stream.pipe(socket); socket.pipe(stream);
      socket.on('error', () => stream.destroy());
      stream.on('error', () => socket.destroy());
    });
    upstream.on('error', () => socket.destroy());
    upstream.end();
  });
  return server;
}
