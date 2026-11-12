import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { pointFormula, storyPoints } from '../lib/points.js';
import { copyText, normalizeWork } from '../lib/work.js';
import { createApp } from '../server/app.js';
import { localEstimate, parseAIResponse } from '../server/estimator.js';

const aiResult = {
  description: 'Göstərilən siyahıya axtarış əlavə edilir.',
  criteria: ['Uyğun nəticələr göstərilir.'],
  reasons: ['Mövcud siyahıdan istifadə olunur.'],
  assumptions: ['İnterfeys hazırdır.'],
  questions: [],
  hours: 12,
  minHours: 10,
  maxHours: 14,
  difficulty: 'medium',
  confidence: 'medium',
};

function envelope(result) {
  return {
    status: 'completed',
    output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(result) }] }],
  };
}

async function serve(t, options) {
  const server = createApp(options).listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

const post = (url, body, path = '/api/estimate') => fetch(url + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('Team conversion uses the 8-hour boundary and rounds to two decimal places', () => {
  const samples = [[1, .1], [2, .2], [6, .6], [7, .7], [8, 1], [9, 1.13], [10, 1.25], [12, 1.5], [16, 2], [24, 3]];
  for (const [hours, point] of samples) assert.equal(storyPoints(hours), point);
  assert.equal(pointFormula(7), '7 saat × 0.1 = 0.7');
  assert.equal(pointFormula(8), '8 saat ÷ 8 = 1');
  for (const invalid of [0, -1, 1.5, '8', Infinity]) assert.throws(() => storyPoints(invalid));
});

test('Work validation rejects malformed and out-of-range fields', () => {
  for (const value of [
    null, [], {}, { title: ' qısa  ' }, { title: 'x'.repeat(181) },
    { title: 'Yetərli başlıq', context: 'x'.repeat(6001) },
    { title: 'Yetərli başlıq', context: null },
    { title: 'Yetərli başlıq', scope: 'constructor' },
    { title: 'Yetərli başlıq', type: 'unknown' },
    { title: 'Yetərli başlıq', factors: 'database' },
    { title: 'Yetərli başlıq', factors: ['database', 'database'] },
  ]) assert.throws(() => normalizeWork(value), TypeError);
  assert.equal(normalizeWork({ title: 'x'.repeat(180), context: 'x'.repeat(6000) }).title.length, 180);
});

test('Local estimation recognizes the requested task categories', () => {
  const examples = [
    ['Düymənin rəngini dəyiş', 2], ['Form validasiyası əlavə et', 5],
    ['Login funksiyasını hazırla', 12], ['Sifarişlərə axtarış filtri əlavə et', 8],
    ['Satış dashboard səhifəsi', 12], ['SMS bildirişi göndər', 10], ['Ödəniş axını əlavə et', 20],
  ];
  for (const [title, hours] of examples) {
    const result = localEstimate(normalizeWork({ title }));
    assert.equal(result.hours, hours, title);
    assert.equal(result.points, storyPoints(hours));
    assert.ok(result.criteria.length);
    assert.ok(result.questions.length);
  }
  const result = localEstimate(normalizeWork({ title: 'İşləri qaydaya sal', context: 'Mümkün qədər tez.' }));
  assert.equal(result.confidence, 'low');
  assert.ok(result.minHours < result.hours && result.hours < result.maxHours);
  assert.match(result.assumptions.join(' '), /dəstəklənən açar söz tapılmadı/);
});

test('Scope, work type and keyword-based context affect the duration', () => {
  const work = normalizeWork({ title: 'Axtarış əlavə et', scope: 'backend', type: 'bug' });
  assert.equal(localEstimate(work).hours, 9);
  const result = localEstimate({ ...work, context: 'SQL miqrasiyası və E2E yoxlaması.', factors: ['database'] });
  assert.equal(result.hours, 15);
  assert.match(result.reasons.join(' '), /kontekst/);
});

test('Copied text uses shared calculation and the displayed source', () => {
  const local = localEstimate(normalizeWork({ title: 'Axtarış əlavə et', scope: 'frontend' }));
  assert.equal(copyText(local, 'point'), '0.6');
  assert.match(copyText(local, 'full'), /Story Point — 0\.6/);
  assert.match(copyText(local, 'full'), /Mənbə — Yerli təxmin/);
  assert.match(copyText(local, 'details'), /Qəbul meyarları/);
  const ai = parseAIResponse(envelope(aiResult), 'Axtarış əlavə et');
  assert.match(copyText(ai, 'full'), /Story Point — 1\.5[\s\S]*Mənbə — AI təxmini/);
});

test('AI parsing accepts structured output and rejects invalid fields and refusals', () => {
  const response = envelope(aiResult);
  response.output.unshift({ type: 'reasoning' });
  assert.equal(parseAIResponse(response, 'Başlıq').points, 1.5);
  for (const invalid of [
    { ...aiResult, hours: 1.25 }, { ...aiResult, maxHours: 11 },
    { ...aiResult, description: ' ' }, { ...aiResult, reasons: [] },
    { ...aiResult, criteria: [null] }, { ...aiResult, hours: '12' },
    { ...aiResult, confidence: 'certain' }, { ...aiResult, points: 4 },
  ]) assert.throws(() => parseAIResponse(envelope(invalid), 'Başlıq'));
  assert.throws(() => parseAIResponse({ ...response, status: 'incomplete' }, 'Başlıq'));
  response.output[1].content = [{ type: 'refusal', refusal: 'test refusal' }];
  assert.throws(() => parseAIResponse(response, 'Başlıq'));
});

test('Local API handles health, validation, estimates and rewritten URLs', async t => {
  const base = await serve(t, { key: '' });
  const health = await fetch(base + '/api/health');
  assert.deepEqual(await health.json(), { status: 'ok', mode: 'local', aiConfigured: false, aiVerified: false });
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await post(base, { title: 'qısa' })).status, 400);
  const malformed = await fetch(base + '/api/estimate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.match((await malformed.json()).error, /JSON/);
  assert.equal((await post(base, { title: 'a'.repeat(50_000) })).status, 413);
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
  for (const path of ['/api/estimate', '/api/index?route=estimate', '/tools/sprint-pointer/api/estimate', '/tools/sprint-pointer/api/index?route=estimate']) {
    const response = await post(base, { title: 'Sifarişlərdə filtr əlavə et' }, path);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).points, 1);
  }
  assert.equal((await fetch(base + '/tools/sprint-pointer/api/health')).status, 200);
});

test('AI API calls Responses with strict output and surfaces provider and timeout errors', async t => {
  let request;
  let behavior = 'success';
  const base = await serve(t, {
    key: 'mock-key', model: 'mock-model',
    fetcher: async (url, options) => {
      request = { url, body: JSON.parse(options.body), signal: options.signal };
      if (behavior === 'timeout') throw new DOMException('Timed out', 'TimeoutError');
      if (behavior === 'error') return new Response('service unavailable', { status: 503 });
      if (behavior === 'invalid') return Response.json(envelope({ ...aiResult, hours: 0 }));
      return Response.json(envelope(aiResult));
    },
  });
  const health = await fetch(base + '/api/health').then(response => response.json());
  assert.deepEqual(health, { status: 'ok', mode: 'ai', aiConfigured: true, aiVerified: false });
  assert.equal(request, undefined);

  const work = { title: 'Axtarış əlavə et', context: 'Sınaq üçün istifadəçi mətni' };
  const result = await post(base, work).then(response => response.json());
  assert.equal(result.source, 'ai');
  assert.equal(result.points, 1.5);
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.body.model, 'mock-model');
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.strict, true);
  assert.equal(JSON.parse(request.body.input).context, work.context);
  assert.ok(request.signal instanceof AbortSignal);

  for (const [mode, status] of [['error', 502], ['invalid', 502], ['timeout', 504]]) {
    behavior = mode;
    const response = await post(base, work);
    assert.equal(response.status, status);
    assert.match((await response.json()).error, /AI/);
  }
});
