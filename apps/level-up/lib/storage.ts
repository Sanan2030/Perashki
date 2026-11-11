import { z } from 'zod';
import { levelSchema, trackIdSchema, type UserProgress } from './types';

const profile = z
  .object({
    trackId: trackIdSchema,
    currentLevel: levelSchema,
    targetLevel: levelSchema,
    dailyMinutes: z.number().int().min(5).max(480),
  })
  .superRefine((value, context) => {
    const order = ['zero', 'junior', 'mid', 'lead'];
    if (
      (value.trackId === 'ba' || value.trackId === 'po') &&
      order.indexOf(value.targetLevel) <= order.indexOf(value.currentLevel)
    )
      context.addIssue({
        code: 'custom',
        message: 'Career target must be above the current level.',
      });
  });
const date = z.iso.datetime();
export const progressSchema = z
  .object({
    version: z.literal(1),
    profiles: z.partialRecord(trackIdSchema, profile),
    activeTrack: trackIdSchema,
    completedLessons: z.record(z.string(), date),
    bookmarks: z.array(z.string()).max(20000),
    notes: z.record(z.string(), z.string().max(50000)),
    assessedSkills: z.array(z.string()).max(20000),
    attempts: z
      .array(
        z.object({
          id: z.string(),
          trackId: trackIdSchema,
          mode: z.string(),
          practiceSetId: z.string().min(1).max(200).optional(),
          startedAt: date,
          completedAt: date,
          questionIds: z.array(z.string()),
          answers: z.record(z.string(), z.array(z.string())),
          score: z.number().nonnegative(),
          total: z.number().int().nonnegative(),
          domainScores: z.record(
            z.string(),
            z.object({ correct: z.number().nonnegative(), total: z.number().nonnegative() }),
          ),
        }),
      )
      .max(10000),
    reviews: z.array(
      z.object({
        questionId: z.string(),
        interval: z.number().nonnegative(),
        repetitions: z.number().int().nonnegative(),
        dueAt: date,
      }),
    ),
    activity: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    sessions: z.record(z.string(), z.unknown()),
  })
  .superRefine((value, context) => {
    for (const [key, profile] of Object.entries(value.profiles))
      if (profile && profile.trackId !== key)
        context.addIssue({ code: 'custom', message: 'Profile key and track must match.' });
    for (const attempt of value.attempts) {
      if (
        attempt.score > attempt.total ||
        attempt.score % 1 !== 0 ||
        new Date(attempt.completedAt) < new Date(attempt.startedAt)
      )
        context.addIssue({ code: 'custom', message: 'Invalid quiz attempt totals or dates.' });
      for (const score of Object.values(attempt.domainScores))
        if (score.correct > score.total)
          context.addIssue({ code: 'custom', message: 'Invalid domain score.' });
    }
  });

export function emptyProgress(): UserProgress {
  return {
    version: 1,
    profiles: {},
    activeTrack: 'ba',
    completedLessons: {},
    bookmarks: [],
    notes: {},
    assessedSkills: [],
    attempts: [],
    reviews: [],
    activity: [],
    sessions: {},
  };
}
export const STORAGE_KEY = 'level-up.progress.v1';
export interface StorageAdapter {
  load(): Promise<UserProgress>;
  save(progress: UserProgress): Promise<void>;
  clear(): Promise<void>;
}
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function parseProgress(raw: unknown): UserProgress {
  const legacy = z
    .object({
      version: z.literal(0),
      completedLessons: z.array(z.string()),
      bookmarks: z.array(z.string()).optional(),
      notes: z.record(z.string(), z.string()).optional(),
    })
    .safeParse(raw);
  if (legacy.success) {
    const next = emptyProgress();
    next.completedLessons = Object.fromEntries(
      legacy.data.completedLessons.map((id) => [id, new Date(0).toISOString()]),
    );
    next.bookmarks = legacy.data.bookmarks ?? [];
    next.notes = legacy.data.notes ?? {};
    return progressSchema.parse(next) as UserProgress;
  }
  return progressSchema.parse(raw) as UserProgress;
}
export function createLocalStorageAdapter(getStorage: () => StorageLike): StorageAdapter {
  return {
    async load() {
      const raw = getStorage().getItem(STORAGE_KEY);
      return raw ? parseProgress(JSON.parse(raw)) : emptyProgress();
    },
    async save(value) {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(parseProgress(value)));
    },
    async clear() {
      getStorage().removeItem(STORAGE_KEY);
    },
  };
}
export function exportProgress(value: UserProgress) {
  return JSON.stringify(parseProgress(value), null, 2);
}
export function importProgress(value: string): UserProgress {
  if (new TextEncoder().encode(value).byteLength > 5_000_000)
    throw new Error('Progress file exceeds 5 MB');
  return parseProgress(JSON.parse(value));
}
export function activityDate(dateValue = new Date()) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function recordActivity(progress: UserProgress): UserProgress {
  return { ...progress, activity: [...new Set([...progress.activity, activityDate()])].sort() };
}
export function streakDays(days: string[], now = new Date()): number {
  const set = new Set(days);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!set.has(activityDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (set.has(activityDate(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
