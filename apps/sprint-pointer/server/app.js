import express from 'express';
import { normalizeWork } from '../lib/work.js';
import { aiEstimate, localEstimate } from './estimator.js';

export function createApp({
  key = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL,
  fetcher = fetch,
  basePath = process.env.PERASHKI_BASE_PATH ?? '/tools/sprint-pointer',
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  const aiConfigured = Boolean(key?.trim());
  const api = express.Router();

  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: aiConfigured ? 'ai' : 'local', aiConfigured, aiVerified: false });
  });
  api.post('/estimate', express.json({ limit: '48kb' }), async (req, res) => {
    let work;
    try {
      work = normalizeWork(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    if (!aiConfigured) return res.json(localEstimate(work));

    try {
      return res.json(await aiEstimate(work, { key: key.trim(), model: model?.trim() || 'gpt-4.1-mini', fetcher }));
    } catch (error) {
      if (error.name === 'TimeoutError') {
        return res.status(504).json({ error: 'AI sorğusunun vaxt limiti bitdi. Yenidən cəhd edin.' });
      }
      return res.status(502).json({ error: 'AI qiymətləndirməsi alınmadı. Yenidən cəhd edin. Xəta davam edərsə, AI ayarlarını yoxlayın.' });
    }
  });
  api.use((_req, res) => res.status(404).json({ error: 'API yolu tapılmadı.' }));
  api.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Sorğu həddən artıq böyükdür.' });
    if (error.status === 400) return res.status(400).json({ error: 'Sorğu düzgün JSON formatında olmalıdır.' });
    if (error.status === 415) return res.status(415).json({ error: 'Sorğunun kodlaşdırma formatı dəstəklənmir.' });
    return res.status(500).json({ error: 'Serverdə xəta baş verdi. Yenidən cəhd edin.' });
  });

  // Vercel can present the original URL or the rewritten function URL.
  app.use((req, _res, next) => {
    if (basePath && req.url.startsWith(`${basePath}/api/`)) req.url = req.url.slice(basePath.length);
    if (/^\/api\/index(?:\?|$)/.test(req.url) && req.query.route) {
      req.url = `/api/${encodeURIComponent(req.query.route)}`;
    }
    next();
  });
  app.use('/api', api);
  return app;
}
