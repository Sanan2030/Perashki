import test from 'node:test';
import assert from 'node:assert/strict';
import { boundServiceUrl, checkServices } from '../scripts/service-health.mjs';
import { projects } from '../scripts/projects.mjs';
import config from '../next.config.mjs';

test('missing bindings never fall back to localhost or public URLs', async () => {
  const result = await checkServices({}, () => { throw new Error('No network request should run.'); });
  assert.equal(result.length, 4);
  assert(result.every(service => !service.ready));
  assert.equal(boundServiceUrl(projects[0], {}), null);
});

test('runtime bindings preserve the target base URL and the app route prefix', async () => {
  const environment = Object.fromEntries(projects.map(project => [project.binding, `https://${project.id}.internal.example/private/`]));
  const requested = [];
  const result = await checkServices(environment, async (url, options) => {
    requested.push(url.href);
    assert.equal(options.cache, 'no-store');
    return new Response('Application page');
  });
  assert(result.every(service => service.ready));
  for (const project of projects) assert(requested.includes(`https://${project.id}.internal.example/private${project.healthPath}`));
  environment[projects[0].binding] = 'https://new-preview.internal.example/';
  assert.equal(boundServiceUrl(projects[0], environment).hostname, 'new-preview.internal.example');
});

test('a failed internal request reports an unavailable service without leaking its URL', async () => {
  const environment = Object.fromEntries(projects.map(project => [project.binding, `https://${project.id}.internal.example/`]));
  const result = await checkServices(environment, async url => {
    if (url.hostname.startsWith('sloth-ai')) throw new Error('Connection unavailable');
    return new Response('Page', { status: url.hostname.startsWith('overtimer') ? 503 : 200 });
  });
  assert.equal(result.find(service => service.id === 'sloth-ai').ready, false);
  assert.equal(result.find(service => service.id === 'overtimer').ready, false);
  assert.equal(result.find(service => service.id === 'level-up').ready, true);
  assert(!JSON.stringify(result).includes('internal.example'));
});

test('portal page rewrites leave API and static asset paths available to Next.js', async () => {
  const { beforeFiles } = await config.rewrites();
  assert(beforeFiles.some(rule => rule.source === '/' && rule.destination === '/index.html'));
  assert(beforeFiles.some(rule => rule.source === '/todo'));
  assert(!beforeFiles.some(rule => rule.source.startsWith('/api') || rule.source.startsWith('/tools')));
});
