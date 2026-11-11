import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../scripts/server.mjs';

test('portal routes, source calendar, static assets and missing paths serve the expected content', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/todo', '/calendar', '/sloth-ai', '/sprint-pointer']) {
      const response = await fetch(origin + route);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /<html lang="az">/);
    }
    assert.match(await (await fetch(`${origin}/calendar.html`)).text(), /Azerbaijan Calendar 2026/);
    assert.match((await fetch(`${origin}/app.js`)).headers.get('content-type'), /javascript/);
    assert.equal((await fetch(`${origin}/missing`)).status, 404);
    assert.equal((await fetch(`${origin}/%E0%A4%A`)).status, 400);
    assert.equal((await fetch(`${origin}/todo`, { method: 'POST' })).status, 405);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
