import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTodos, filterTodos, todayInBaku, isValidDate } from '../public/todos.js';

const task = { id: 'test-1', title: 'İşi tamamla', priority: 'normal', due: '2026-11-11', completed: false, createdAt: '2026-11-10T10:00:00Z' };

test('saved tasks round-trip without losing dates, priorities or completion', () => {
  const tasks = [task, { ...task, id: 'test-2', due: '', priority: 'high', completed: true }];
  assert.deepEqual(parseTodos(JSON.stringify({ version: 1, tasks })), tasks);
  assert.deepEqual(parseTodos(null), []);
});

test('invalid or future storage is rejected rather than overwritten', () => {
  for (const raw of ['invalid', 'null', '{"version":2,"tasks":[]}', JSON.stringify({ version: 1, tasks: [task, task] }), JSON.stringify({ version: 1, tasks: [{ ...task, due: '2026-02-30' }] }), JSON.stringify({ version: 1, tasks: [{ ...task, priority: '__proto__' }] })]) {
    assert.throws(() => parseTodos(raw));
  }
});

test('filters combine Azerbaijani search, status and the selected date', () => {
  const tasks = [task, { ...task, id: '2', completed: true }, { ...task, id: '3', due: '2026-11-12', title: 'Diaqramı yoxla' }];
  assert.equal(filterTodos(tasks, 'all', 'İŞİ').length, 2);
  assert.equal(filterTodos(tasks, 'completed', 'işi').length, 1);
  assert.equal(filterTodos(tasks, 'active').length, 2);
  assert.equal(filterTodos(tasks, 'today', '', '2026-11-11').length, 1);
  assert.equal(filterTodos(tasks, 'today', 'Diaqramı', '2026-11-11').length, 0);
});

test('today follows Baku when the UTC date is still the previous day', () => {
  assert.equal(todayInBaku(new Date('2026-11-10T21:00:00Z')), '2026-11-11');
});

test('calendar dates reject rollover and allow leap days', () => {
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2026-13-01'), false);
});
