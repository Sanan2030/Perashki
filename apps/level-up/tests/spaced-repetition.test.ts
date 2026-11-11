import { describe, expect, it } from 'vitest';
import { dueReviews, scheduleReview, updateReviewCards } from '@/lib/spaced-repetition';

const now = new Date('2026-10-20T12:00:00.000Z');

describe('retrieval scheduling', () => {
  it('schedules missed items for tomorrow and expands successful recall intervals', () => {
    const missed = scheduleReview('q1', false, undefined, now);
    expect(missed.dueAt).toBe('2026-10-21T12:00:00.000Z');
    const first = scheduleReview('q1', true, missed, now);
    expect(first.interval).toBe(3);
    const second = scheduleReview('q1', true, first, now);
    expect(second.interval).toBe(7);
    expect(scheduleReview('q1', false, second, now).repetitions).toBe(0);
  });
  it('ignores invalid dates and returns due cards in due-date order', () => {
    expect(
      dueReviews(
        [
          { questionId: 'future', interval: 1, repetitions: 0, dueAt: '2026-10-22T00:00:00Z' },
          { questionId: 'bad', interval: 1, repetitions: 0, dueAt: 'bad' },
          { questionId: 'old', interval: 1, repetitions: 0, dueAt: '2026-10-18T00:00:00Z' },
        ],
        now,
      ).map((q) => q.questionId),
    ).toEqual(['old']);
  });
  it('adds only mistakes, updates existing cards, and preserves unrelated cards', () => {
    const previous = scheduleReview('old', false, undefined, now);
    const cards = updateReviewCards(
      [previous],
      [
        { questionId: 'good', correct: true },
        { questionId: 'bad', correct: false },
      ],
      now,
    );
    expect(cards.map((c) => c.questionId)).toEqual(['old', 'bad']);
    const updated = updateReviewCards(cards, [{ questionId: 'bad', correct: true }], now);
    expect(updated.find((c) => c.questionId === 'bad')?.interval).toBe(3);
    expect(updated.find((c) => c.questionId === 'old')).toEqual(previous);
  });
});
