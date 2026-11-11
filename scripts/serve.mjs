import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './projects.mjs';
import { serviceRoutes, portalRoutes } from './deployment.mjs';

const output = path.join(root, '.vercel/output');
const staticRoot = path.join(output, 'static');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.xml': 'application/xml' };
await stat(path.join(output, 'config.json')).catch(() => { throw new Error('Run npm run build before npm start.'); });
const handlers = new Map();
for (const route of serviceRoutes) handlers.set(route.path, pathToFileURL(path.join(output, 'functions', `${route.path}.func/index.mjs`)).href);
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (handlers.has(pathname)) return (await import(handlers.get(pathname))).default(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let filename = path.resolve(staticRoot, `.${pathname === '/api/health' ? '/api-health.json' : pathname}`);
    if (!filename.startsWith(`${staticRoot}/`) && filename !== staticRoot) { res.writeHead(404); return res.end(); }
    if (portalRoutes.includes(pathname.replace(/\/$/, '') || '/')) filename = path.join(staticRoot, 'index.html');
    else if ((await stat(filename).catch(() => null))?.isDirectory()) filename = path.join(filename, 'index.html');
    const content = await readFile(filename);
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404);
    res.end('Səhifə tapılmadı.');
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Serving the single Vercel build on port', process.env.PORT || 3000));
