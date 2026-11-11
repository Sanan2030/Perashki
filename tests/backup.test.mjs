import test from 'node:test';
import assert from 'node:assert/strict';
import { backupLocale, createBackup, parseBackup, restoreBackup, snapshotStorage } from '../public/backup.js';
import { generateStory } from '../public/stories.js';

class Storage {
  data = new Map();
  failOnceOn = null;
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { if (key === this.failOnceOn) { this.failOnceOn = null; throw new Error('quota'); } this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
function fixture() {
  const storage = new Storage();
  const profile = { employee: 'Sanan', manager: '', customer: '', project: '', environment: 'ofis şəraiti' };
  storage.setItem('overtime-noter:v1', JSON.stringify({ version: 1, profile, months: {}, entries: [] }));
  storage.setItem('level-up.progress.v1', JSON.stringify({ version: 1, profiles: {}, activeTrack: 'ba', completedLessons: {}, bookmarks: ['lesson-1'], notes: { 'lesson-1': 'Şəxsi qeyd' }, assessedSkills: [], attempts: [], reviews: [], activity: [], sessions: {} }));
  storage.setItem('visioflow:v1:diagram-1', JSON.stringify({ version: 1, id: 'diagram-1', name: 'Saxlanmış diaqram', pools: [{ id: 'pool-1', name: 'Təşkilat', lanes: [{ id: 'lane-1', name: 'Analitik' }] }], steps: [] }));
  storage.setItem('slothai-personal-lexicon-v1', JSON.stringify({ pending: [], confirmed: [{ source: 'sened', target: 'sənəd', left: '', right: '' }] }));
  storage.setItem('slothai-transform-log-v1', JSON.stringify([{ id: 'log-1', at: '2026-11-11T08:00:00Z', module: 'text', input: 'salam', output: 'Salam.', source: 'transformed' }]));
  storage.setItem('slothai-reviewed-tests-v1', JSON.stringify({ kind: 'slothai-reviewed-tests', version: 1, cases: [] }));
  storage.setItem('slothai-workspace-v1', JSON.stringify({ version: 1, activeModule: 'text', textValue: 'Qaralama', mailValue: '', textOutput: '', mailOutput: '', textGenerated: '', mailGenerated: '', mailGreeting: 'Salam,', preserveFormatting: true }));
  storage.setItem('perashki:todos:v1', JSON.stringify({ version: 1, tasks: [{ id: 'todo-1', title: 'Məlumatı saxla', priority: 'high', completed: false, due: '2026-11-11', createdAt: '2026-11-11T08:00:00Z' }] }));
  const draft = generateStory({ title: 'Müştəri məlumatlarının Excel ixracı' });
  storage.setItem('perashki:stories:v1', JSON.stringify({ version: 1, draft, stories: [draft] }));
  storage.setItem('perashki:calendar:v1', JSON.stringify({ version: 1, year: 2027, month: 5 }));
  storage.setItem('perashki:workspace:v1', JSON.stringify({ version: 1, route: '/visio-generator', frames: { 'visio-generator': '/tools/visio-generator/#diagram-1' } }));
  storage.setItem('artisaat:theme', 'dark');
  storage.setItem('unrelated-app', 'must stay private');
  return storage;
}

test('one JSON restores every app, drafts, diagram paths and preferences in a clean browser', () => {
  const original = fixture();
  const backup = createBackup(original, 'en');
  const parsed = parseBackup(JSON.stringify(backup));
  assert.equal(parsed.storage['unrelated-app'], undefined);
  const restored = new Storage(); restored.setItem('unrelated-app', 'keep');
  const route = restoreBackup(restored, parsed);
  assert.equal(route, '/visio-generator');
  assert.deepEqual(snapshotStorage(restored), snapshotStorage(original));
  assert.equal(parsed.preferences.locale, 'en');
  assert.equal(restored.getItem('unrelated-app'), 'keep');
});

test('restoring a snapshot removes newer owned records and retains other applications', () => {
  const storage = fixture(); const backup = createBackup(storage);
  storage.setItem('visioflow:v1:new-draft', storage.getItem('visioflow:v1:diagram-1'));
  restoreBackup(storage, backup);
  assert.equal(storage.getItem('visioflow:v1:new-draft'), null);
  assert.equal(storage.getItem('unrelated-app'), 'must stay private');
});

test('invalid files, foreign keys, unsafe frame links and future versions do not mutate storage', () => {
  const storage = fixture(); const original = snapshotStorage(storage);
  for (const mutate of [
    data => { data.version = 2; },
    data => { data.storage['foreign-key'] = 'bad'; },
    data => { data.storage['perashki:todos:v1'] = '{"version":1,"tasks":[{}]}'; },
    data => { data.storage['perashki:workspace:v1'] = JSON.stringify({ version: 1, route: '/', frames: { 'sloth-ai': '/tools/sloth-ai/../../evil' } }); },
    data => { data.storage['level-up.progress.v1'] = '{}'; },
    data => { const draft = JSON.parse(data.storage['slothai-workspace-v1']); draft.textDocument = { blocks: [{ type: 'paragraph', children: [{ text: 'Unsafe mark', marks: ['script'] }] }] }; data.storage['slothai-workspace-v1'] = JSON.stringify(draft); },
  ]) {
    const backup = createBackup(storage); mutate(backup);
    assert.throws(() => restoreBackup(storage, backup));
    assert.deepEqual(snapshotStorage(storage), original);
  }
  assert.throws(() => parseBackup('{broken'));
});

test('a failed write rolls back all apps together', () => {
  const storage = fixture(); const original = snapshotStorage(storage);
  const incoming = createBackup(storage); incoming.storage['artisaat:theme'] = 'light';
  storage.failOnceOn = 'level-up.progress.v1';
  assert.throws(() => restoreBackup(storage, incoming), /geri qaytarıldı/);
  assert.deepEqual(snapshotStorage(storage), original);
});

test('backup language follows explicit preference, then the open page, then the original app default', () => {
  const storage = new Storage();
  assert.equal(backupLocale(storage), 'en');
  storage.setItem('perashki:workspace:v1', JSON.stringify({ version: 1, route: '/', frames: { 'level-up': '/tools/level-up/az/lessons/' } }));
  assert.equal(backupLocale(storage), 'az');
  assert.equal(backupLocale(storage, 'other=1; level-up.locale=en'), 'en');
});
