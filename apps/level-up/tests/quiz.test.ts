import { describe, expect, it } from 'vitest';
import { questionSchema, type ExamConfig, type QuizQuestion } from '@/lib/types';
import { emptyProgress, exportProgress, importProgress } from '@/lib/storage';
import ecbaQuestions from '@/data/questions/ecba.json';
import pspoQuestions from '@/data/questions/pspo1.json';
import writtenQuestions from '@/data/questions/pspo3.json';
import {
  createQuizSession,
  lessonOptionOrder,
  domainQuotas,
  gradeAnswer,
  mockEligibility,
  pauseSession,
  quizSessionSchema,
  remainingTime,
  resumeSession,
  scoreQuiz,
  selectMockQuestions,
  shuffle,
  weakAreas,
} from '@/lib/quiz';

const l = { az: 'Mətn', en: 'Text' };
const question: QuizQuestion = {
  sourceIds: [],
  id: 'q1',
  trackId: 'ecba',
  type: 'single',
  domain: 'a',
  difficulty: 1,
  text: l,
  options: ['a', 'b', 'c'].map((id) => ({ id, text: l, explanation: l })),
  correct: ['a'],
  explanation: l,
  lessonId: 'stakeholder-mapping',
  practiceOnly: true,
};
const exam: ExamConfig = {
  id: 'ecba',
  name: 'Practice',
  format: 'selected-response',
  questionCount: 3,
  durationMinutes: 10,
  passPercent: null,
  domains: [
    { id: 'a', title: l, weight: 67 },
    { id: 'b', title: l, weight: 33 },
  ],
  verificationStatus: 'verified',
  verifiedAt: '2026-10-20',
  sources: [],
  notes: l,
};

describe('grading', () => {
  it('requires exact choice sets and rejects duplicates or unknown options', () => {
    const multiple = { ...question, type: 'multiple' as const, correct: ['a', 'c'] };
    expect(gradeAnswer(multiple, ['c', 'a'])).toBe(true);
    expect(gradeAnswer(multiple, ['a'])).toBe(false);
    expect(gradeAnswer(multiple, ['a', 'a', 'c'])).toBe(false);
    expect(gradeAnswer(multiple, ['a', 'x'])).toBe(false);
  });
  it('checks ordering and matching by position, not by membership', () => {
    for (const type of ['ordering', 'matching'] as const) {
      expect(gradeAnswer({ ...question, type, correct: ['a', 'b', 'c'] }, ['a', 'b', 'c'])).toBe(
        true,
      );
      expect(gradeAnswer({ ...question, type, correct: ['a', 'b', 'c'] }, ['b', 'a', 'c'])).toBe(
        false,
      );
    }
  });
  it('excludes written work from automated scores and counts unanswered objective questions', () => {
    const result = scoreQuiz(
      [
        question,
        { ...question, id: 'q2', domain: 'b' },
        { ...question, id: 'essay', type: 'written' },
      ],
      { q1: ['a'], essay: ['response'] },
    );
    expect(result.score).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percent).toBe(50);
    expect(result.domainScores.b).toEqual({ correct: 0, total: 1 });
    expect(result.missedQuestions.map((q) => q.id)).toEqual(['q2']);
    expect(scoreQuiz([{ ...question, type: 'written' }], {}).percent).toBeNull();
  });
  it('identifies actual weak domains with evidence', () => {
    expect(
      weakAreas({
        strong: { correct: 4, total: 5 },
        weak: { correct: 1, total: 4 },
        empty: { correct: 0, total: 0 },
      }).map((a) => a.domain),
    ).toEqual(['weak']);
  });
});

describe('mock safety and randomization', () => {
  const bank = [question, { ...question, id: 'q2' }, { ...question, id: 'q3', domain: 'b' }];
  it('blocks unverified, unsupported and incomplete simulations', () => {
    expect(mockEligibility(undefined, bank).reason).toBe('missing-config');
    expect(
      mockEligibility({ ...exam, verificationStatus: 'needs-verification' }, bank).reason,
    ).toBe('unverified');
    expect(mockEligibility({ ...exam, format: 'written' }, bank).reason).toBe('unsupported-format');
    expect(mockEligibility(exam, [question, question, question]).reason).toBe('insufficient-bank');
    expect(
      mockEligibility(exam, [question, { ...question, id: 'q2' }, { ...question, id: 'q3' }])
        .reason,
    ).toBe('domain-coverage');
  });
  it('handles unknown formats and nullable official rules without inventing defaults', () => {
    expect(mockEligibility({ ...exam, format: null }, bank).reason).toBe('missing-rules');
    expect(mockEligibility({ ...exam, questionCount: null }, bank).reason).toBe('missing-rules');
    expect(mockEligibility({ ...exam, durationMinutes: null }, bank).reason).toBe('missing-rules');
    expect(mockEligibility({ ...exam, passPercent: null }, bank).eligible).toBe(true);
    expect(
      mockEligibility({ ...exam, format: null, verificationStatus: 'needs-verification' }, bank)
        .reason,
    ).toBe('unverified');
  });
  it('rejects partial or invalid domain allocations instead of silently using random quotas', () => {
    const invalidWeights = {
      ...exam,
      domains: [
        { id: 'a', title: l, weight: -10 },
        { id: 'b', title: l, weight: 110 },
      ],
    };
    expect(domainQuotas(invalidWeights)).toBeNull();
    expect(mockEligibility(invalidWeights, bank).reason).toBe('missing-rules');
    const partialWeights = {
      ...exam,
      domains: [
        { id: 'a', title: l, weight: 67 },
        { id: 'b', title: l },
      ],
    };
    expect(mockEligibility(partialWeights, bank).reason).toBe('missing-rules');
  });
  it('allocates rounded domain weights and selects unique questions', () => {
    expect(domainQuotas(exam)).toEqual({ a: 2, b: 1 });
    const result = selectMockQuestions(exam, bank, () => 0);
    expect(new Set(result.map((q) => q.id)).size).toBe(3);
    expect(result.filter((q) => q.domain === 'b')).toHaveLength(1);
    expect(() => selectMockQuestions(exam, [])).toThrow('insufficient-bank');
  });
  it('does not mutate source arrays while shuffling', () => {
    const source = ['a', 'b', 'c'];
    expect(shuffle(source, () => 0)).toEqual(['b', 'c', 'a']);
    expect(source).toEqual(['a', 'b', 'c']);
  });
});

describe('authored question banks and storage integration', () => {
  it('scores real selected-response banks by their stable option IDs', () => {
    const questions = [...ecbaQuestions, ...pspoQuestions].map((q) => questionSchema.parse(q));
    const answers = Object.fromEntries(
      questions.map((q) => [
        q.id,
        q.type === 'single' || q.type === 'multiple' ? [...q.correct].reverse() : [...q.correct],
      ]),
    );
    const result = scoreQuiz(questions, answers);
    expect(questions.some((q) => q.type === 'multiple')).toBe(true);
    expect(questions.length).toBeGreaterThanOrEqual(60);
    expect(result.total).toBe(questions.length);
    expect(result.score).toBe(questions.length);
    expect(result.percent).toBe(100);
    expect(result.missedQuestions).toHaveLength(0);
  });
  it('keeps written responses across export/import without falsely grading them', () => {
    const questions = writtenQuestions.slice(0, 3).map((q) => questionSchema.parse(q));
    const session = createQuizSession(questions, 'practice', 10);
    session.answers[questions[0].id] = ['Mənim orijinal cavabım / my original response'];
    session.checked = [questions[0].id];
    session.flags = [questions[1].id];
    const progress = emptyProgress();
    progress.sessions.quiz = pauseSession(session);
    const restored = quizSessionSchema.parse(
      importProgress(exportProgress(progress)).sessions.quiz,
    );
    expect(restored.answers).toEqual(session.answers);
    expect(restored.flags).toEqual(session.flags);
    expect(restored.paused).toBe(true);
    expect(scoreQuiz(questions, restored.answers)).toMatchObject({
      score: 0,
      total: 0,
      percent: null,
    });
    expect(questions.every((q) => q.rubric && q.rubric.length > 0)).toBe(true);
  });
});

describe('persistent clocks', () => {
  it('rejects corrupt saved state while accepting a real session round trip', () => {
    const session = createQuizSession([question], 'practice');
    expect(quizSessionSchema.safeParse(JSON.parse(JSON.stringify(session))).success).toBe(true);
    expect(quizSessionSchema.safeParse({ ...session, index: 1 }).success).toBe(false);
    expect(quizSessionSchema.safeParse({ ...session, questionIds: ['q1', 'q1'] }).success).toBe(
      false,
    );
    expect(quizSessionSchema.safeParse({ ...session, flags: ['missing'] }).success).toBe(false);
    expect(quizSessionSchema.safeParse({ ...session, optionOrder: {} }).success).toBe(false);
    expect(quizSessionSchema.safeParse({ ...session, paused: true }).success).toBe(false);
  });
  it('rejects duplicate questions, mixed tracks, and invalid clock configuration', () => {
    expect(() => createQuizSession([question, question], 'practice')).toThrow('repeat');
    expect(() =>
      createQuizSession([question, { ...question, id: 'other', trackId: 'po' }], 'practice'),
    ).toThrow('one track');
    expect(() => createQuizSession([question], 'practice', -1)).toThrow('positive duration');
    expect(() => createQuizSession([question], 'mock')).toThrow('requires a duration');
  });
  it('deducts real elapsed time across reloads and prevents negative time', () => {
    const session = createQuizSession([question], 'mock', 1, null, 100_000);
    expect(remainingTime(session, 120_900)).toBe(40);
    expect(remainingTime(JSON.parse(JSON.stringify(session)), 200_000)).toBe(0);
    expect(remainingTime(session, 99_000)).toBe(60);
  });
  it('pause and resume preserve the remaining budget', () => {
    const session = createQuizSession([question], 'mock', 1, null, 100_000);
    const paused = pauseSession(session, 110_000);
    expect(remainingTime(paused, 900_000)).toBe(50);
    const resumed = resumeSession(paused, 900_000);
    expect(remainingTime(resumed, 905_000)).toBe(45);
    expect(remainingTime(createQuizSession([question], 'practice'), 999_999)).toBeNull();
  });
});

describe('learning presentation and exam format boundaries', () => {
  it('keeps lesson options deterministic without leaving every first answer in the same position', () => {
    const original = JSON.stringify(question.options);
    const positions = new Set<number>();
    for (let index = 0; index < 20; index++) {
      const item = { ...question, id: `source-check-${index}` };
      const first = lessonOptionOrder(item);
      expect(first).toEqual(lessonOptionOrder(item));
      expect(new Set(first.map((option) => option.id))).toEqual(
        new Set(item.options.map((option) => option.id)),
      );
      positions.add(first.findIndex((option) => option.id === item.correct[0]));
    }
    expect(positions.size).toBeGreaterThan(1);
    expect(JSON.stringify(question.options)).toBe(original);
  });
  it('does not count matching or ordering exercises toward a selected-response mock', () => {
    const mixed = [
      { ...question, id: 'only-single', domain: 'a' },
      { ...question, id: 'ordering', domain: 'a', type: 'ordering' as const },
      { ...question, id: 'matching', domain: 'b', type: 'matching' as const },
    ];
    expect(mockEligibility(exam, mixed).reason).toBe('insufficient-bank');
  });
});
