import { describe, expect, it } from 'vitest';
import { getImportedQuestions, getQuestions } from '@/lib/assessments';
import { practiceSets, selectPracticeSetQuestions } from '@/lib/practice-sets';
import { createQuizSession, gradeAnswer, quizSessionSchema, scoreQuiz } from '@/lib/quiz';
import { emptyProgress, exportProgress, importProgress } from '@/lib/storage';
import originalRows from '@/data/import-provenance/pspo.en.json';
import manifest from '@/data/import-provenance/manifest.json';
import translationReview from '@/data/import-provenance/translation-review.json';

const imported = getImportedQuestions();

describe('attributed provider banks', () => {
  it('preserves source English wording, option keys and answer keys for every imported item', () => {
    expect(imported).toHaveLength(originalRows.length);
    for (const original of originalRows) {
      const q = imported.find(
        (item) =>
          item.providerId === original.providerId &&
          item.sourceQuestionId === original.sourceQuestionId,
      )!;
      expect(q, original.sourceQuestionId).toBeDefined();
      expect(q.text.en).toBe(original.question);
      expect(q.explanation.en).toBe(original.explanation);
      expect(q.options.map((option) => ({ id: option.id, text: option.text.en }))).toEqual(
        original.options,
      );
      expect(q.correct).toEqual(original.correct);
      expect(gradeAnswer(q, q.correct)).toBe(true);
      expect(gradeAnswer(q, [])).toBe(false);
    }
  });

  it('keeps imported items outside the original bank and every collection within its named provider', () => {
    const own = getQuestions();
    expect(own.every((q) => !q.providerId)).toBe(true);
    expect(new Set([...own, ...imported].map((q) => q.id)).size).toBe(own.length + imported.length);
    for (const provider of manifest) {
      const set = practiceSets.find((item) => item.providerId === provider.providerId)!;
      const study = selectPracticeSetQuestions(set, imported);
      const test = selectPracticeSetQuestions(set, imported, true);
      expect(study).toHaveLength(provider.count);
      expect(test).toHaveLength(set.testQuestionCount);
      expect(new Set(test.map((q) => q.id)).size).toBe(test.length);
      expect(study.every((q) => q.providerId === provider.providerId)).toBe(true);
      expect(scoreQuiz(study, Object.fromEntries(study.map((q) => [q.id, q.correct]))).score).toBe(
        study.length,
      );
      expect(() => selectPracticeSetQuestions(set, own)).toThrow();
      expect(() =>
        selectPracticeSetQuestions(
          { ...set, questionIds: [set.questionIds[0], set.questionIds[0]] },
          imported,
        ),
      ).toThrow();
    }
  });

  it('retains professional terms in every translated question, option and source explanation', () => {
    for (const q of imported) {
      for (const field of [q.text, q.explanation, ...q.options.map((option) => option.text)]) {
        expect(field.az).not.toMatch(/[⟦⟧]|§§/);
        for (const term of translationReview.reviewedTechnicalTerms) {
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp(`(?<!\\w)${escaped}(?!\\w)`, 'i').test(field.en))
            expect(field.az.toLowerCase(), `${q.id}: ${term}`).toContain(term.toLowerCase());
        }
      }
    }
  });

  it('preserves source option order so source explanations referring to A/B/C stay meaningful', () => {
    const session = createQuizSession(imported.slice(0, 3), 'practice');
    for (const q of imported.slice(0, 3))
      expect(session.optionOrder[q.id]).toEqual(q.options.map((o) => o.id));
  });

  it('round-trips provider attribution, deferred feedback and existing progress without changing old sessions', () => {
    const q = imported[0];
    const session = {
      ...createQuizSession([q], 'practice', 15),
      practiceSetId: q.providerId,
      feedbackMode: 'after-submit' as const,
    };
    expect(quizSessionSchema.parse(session).feedbackMode).toBe('after-submit');
    const progress = emptyProgress();
    progress.notes['product-backlog'] = 'Keep my notes';
    progress.sessions.quiz = session;
    progress.attempts.push({
      id: 'provider-result',
      trackId: q.trackId,
      mode: 'practice',
      practiceSetId: q.providerId,
      startedAt: session.startedAt,
      completedAt: session.startedAt,
      questionIds: [q.id],
      answers: { [q.id]: q.correct },
      score: 1,
      total: 1,
      domainScores: { [q.domain]: { correct: 1, total: 1 } },
    });
    const restored = importProgress(exportProgress(progress));
    expect(restored.attempts[0].practiceSetId).toBe(q.providerId);
    expect(restored.sessions.quiz).toEqual(session);
    expect(restored.notes['product-backlog']).toBe('Keep my notes');
    const legacy = createQuizSession([getQuestions()[0]], 'practice');
    expect(quizSessionSchema.parse(legacy).feedbackMode).toBeUndefined();
  });
});
