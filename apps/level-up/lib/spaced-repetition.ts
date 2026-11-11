import type { ReviewCard } from './types';

const DAY = 86_400_000;

/** Simple retrieval schedule: missed → tomorrow; successful recalls → 3, 7, 14… days. */
export function scheduleReview(
  questionId: string,
  correct: boolean,
  previous?: ReviewCard,
  now = new Date(),
): ReviewCard {
  const repetitions = correct ? (previous?.repetitions ?? 0) + 1 : 0;
  const interval = !correct
    ? 1
    : repetitions === 1
      ? 3
      : repetitions === 2
        ? 7
        : Math.min(180, Math.max(14, (previous?.interval ?? 7) * 2));
  return {
    questionId,
    interval,
    repetitions,
    dueAt: new Date(now.getTime() + interval * DAY).toISOString(),
  };
}

export function dueReviews(cards: readonly ReviewCard[], now = new Date()) {
  return cards
    .filter(
      (card) => Number.isFinite(Date.parse(card.dueAt)) && Date.parse(card.dueAt) <= now.getTime(),
    )
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

export function updateReviewCards(
  existing: readonly ReviewCard[],
  results: readonly { questionId: string; correct: boolean }[],
  now = new Date(),
): ReviewCard[] {
  const cards = new Map(existing.map((card) => [card.questionId, card]));
  for (const result of results) {
    const previous = cards.get(result.questionId);
    // New correct responses do not create extra review work; mistakes do.
    if (!result.correct || previous)
      cards.set(
        result.questionId,
        scheduleReview(result.questionId, result.correct, previous, now),
      );
  }
  return [...cards.values()];
}
