import { describe, expect, it } from 'vitest';
import {
  createLocalStorageAdapter,
  emptyProgress,
  exportProgress,
  importProgress,
  parseProgress,
  streakDays,
} from '@/lib/storage';

describe('portable progress storage', () => {
  it('round-trips completion, notes and attempts without losing data', async () => {
    const data = new Map<string, string>();
    const adapter = createLocalStorageAdapter(() => ({
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => {
        data.set(k, v);
      },
      removeItem: (k) => {
        data.delete(k);
      },
    }));
    const value = emptyProgress();
    value.completedLessons['stakeholder-mapping'] = '2026-10-20T12:00:00.000Z';
    value.notes['stakeholder-mapping'] = 'Ask who owns the outcome.';
    value.bookmarks = ['product-goal'];
    await adapter.save(value);
    expect(await adapter.load()).toEqual(value);
    expect(importProgress(exportProgress(value))).toEqual(value);
    await adapter.clear();
    expect(await adapter.load()).toEqual(emptyProgress());
  });
  it('rejects corrupt, unsupported and oversized imports', () => {
    expect(() => importProgress('{invalid')).toThrow();
    expect(() => parseProgress({ ...emptyProgress(), version: 2 })).toThrow();
    expect(() =>
      parseProgress({ ...emptyProgress(), completedLessons: { x: 'yesterday' } }),
    ).toThrow();
    expect(() => importProgress(' '.repeat(5_000_001))).toThrow('5 MB');
  });
  it('migrates a version-zero progress export while preserving notes', () => {
    const migrated = parseProgress({
      version: 0,
      completedLessons: ['a'],
      notes: { a: 'My note' },
    });
    expect(migrated.version).toBe(1);
    expect(migrated.completedLessons.a).toBe(new Date(0).toISOString());
    expect(migrated.notes.a).toBe('My note');
  });
  it('reports unavailable browser storage instead of silently discarding data', async () => {
    const adapter = createLocalStorageAdapter(() => {
      throw new Error('Storage denied');
    });
    await expect(adapter.load()).rejects.toThrow('Storage denied');
    await expect(adapter.save(emptyProgress())).rejects.toThrow('Storage denied');
  });
  it('counts a streak across month boundaries and preserves yesterday’s streak', () => {
    const now = new Date(2026, 10, 1, 12);
    expect(streakDays(['2026-10-30', '2026-10-31', '2026-11-01'], now)).toBe(3);
    expect(streakDays(['2026-10-30', '2026-10-31'], now)).toBe(2);
    expect(streakDays(['2026-10-29'], now)).toBe(0);
  });
});
