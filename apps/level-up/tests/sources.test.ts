import { describe, expect, it } from 'vitest';
import { sources } from '@/lib/sources';
import { lessons } from '@/lib/catalog';
import { getQuestions } from '@/lib/assessments';

describe('source-backed certification learning', () => {
  it('never attributes teaching to a source whose text could not be read', () => {
    const read = new Set(sources.filter((s) => s.status === 'read').map((s) => s.id));
    for (const item of [...lessons, ...getQuestions()])
      for (const id of item.sourceIds) expect(read.has(id), `${item.id} / ${id}`).toBe(true);
  });
  it('links every PSPO practice question to a complete lesson and keeps written work unscored', () => {
    for (const q of getQuestions().filter((q) => q.trackId.startsWith('pspo'))) {
      expect(lessons.find((l) => l.id === q.lessonId)?.status).toBe('published');
      if (q.type === 'written') {
        expect(q.correct).toEqual([]);
        expect(q.rubric?.length).toBeGreaterThan(0);
      }
    }
  });
  it('provides original explained practice for every PSPO I and II lesson', () => {
    for (const lesson of lessons.filter((l) => ['pspo1', 'pspo2'].includes(l.trackId))) {
      const qs = getQuestions().filter((q) => q.lessonId === lesson.id && q.sourceIds.length);
      expect(qs.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(
        qs.every(
          (q) => q.practiceOnly && q.options.every((o) => o.explanation.az && o.explanation.en),
        ),
      ).toBe(true);
    }
  });
});
