import express from 'express';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const app = createApp();
const port = Number(process.env.PORT || 3000);
const basePath = process.env.PERASHKI_BASE_PATH ?? '/tools/sprint-pointer';
if (basePath) app.get('/', (_req, res) => res.redirect(`${basePath}/`));

if (process.argv.includes('--dev')) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(basePath || '/', express.static(fileURLToPath(new URL('../dist/', import.meta.url))));
}

app.listen(port, () => console.log(`SprintPointer — http://localhost:${port}`));
