import { z } from 'zod';
import { trackIdSchema, type ExamConfig, type QuizQuestion } from './types';

export const quizModes = ['practice', 'domain', 'mock', 'review'] as const;
export type QuizMode = (typeof quizModes)[number];

/** Copy before shuffling; answer keys remain stable because they use option IDs. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.min(0.999999999, Math.max(0, random())) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Stable per-question presentation prevents answer-position shortcuts without hydration differences. */
export function lessonOptionOrder(question: QuizQuestion): QuizQuestion['options'] {
  let state = 2166136261;
  for (const character of question.id) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return shuffle(question.options, () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  });
}

/** Written work is deliberately ungraded; a rubric supports human reflection. */
export function gradeAnswer(question: QuizQuestion, answer: readonly string[]): boolean | null {
  if (question.type === 'written') return null;
  if (!question.correct.length || (question.type === 'single' && question.correct.length !== 1))
    return false;
  if (new Set(answer).size !== answer.length) return false;
  if (answer.some((id) => !question.options.some((option) => option.id === id))) return false;
  if (question.type === 'ordering' || question.type === 'matching') {
    return (
      answer.length === question.correct.length &&
      answer.every((id, i) => id === question.correct[i])
    );
  }
  return (
    answer.length === question.correct.length && question.correct.every((id) => answer.includes(id))
  );
}

export function scoreQuiz(questions: readonly QuizQuestion[], answers: Record<string, string[]>) {
  const domainScores: Record<string, { correct: number; total: number }> = Object.create(null);
  const missedQuestions: QuizQuestion[] = [];
  let score = 0;
  let total = 0;
  for (const question of questions) {
    const correct = gradeAnswer(question, answers[question.id] ?? []);
    if (correct === null) continue;
    total++;
    domainScores[question.domain] ??= { correct: 0, total: 0 };
    domainScores[question.domain].total++;
    if (correct) {
      score++;
      domainScores[question.domain].correct++;
    } else missedQuestions.push(question);
  }
  return {
    score,
    total,
    percent: total ? Math.round((score / total) * 100) : null,
    domainScores,
    missedQuestions,
  };
}

export type MockBlocker =
  | 'missing-config'
  | 'unverified'
  | 'unsupported-format'
  | 'missing-rules'
  | 'insufficient-bank'
  | 'domain-coverage';

/** Never silently substitute a short practice session for a full official-format mock. */
export function mockEligibility(
  exam: ExamConfig | undefined,
  questions: readonly QuizQuestion[],
): { eligible: boolean; reason: MockBlocker | null } {
  if (!exam) return { eligible: false, reason: 'missing-config' };
  if (exam.verificationStatus !== 'verified') return { eligible: false, reason: 'unverified' };
  if (exam.format === null) return { eligible: false, reason: 'missing-rules' };
  if (exam.format !== 'selected-response') return { eligible: false, reason: 'unsupported-format' };
  if (!exam.questionCount || !exam.durationMinutes)
    return { eligible: false, reason: 'missing-rules' };
  const bank = [
    ...new Map(
      questions
        .filter((q) => q.trackId === exam.id && (q.type === 'single' || q.type === 'multiple'))
        .map((q) => [q.id, q]),
    ).values(),
  ];
  if (bank.length < exam.questionCount) return { eligible: false, reason: 'insufficient-bank' };
  const quotas = domainQuotas(exam);
  if (exam.domains.some((domain) => domain.weight !== undefined) && !quotas) {
    return { eligible: false, reason: 'missing-rules' };
  }
  if (
    quotas &&
    Object.entries(quotas).some(
      ([domain, count]) => bank.filter((q) => q.domain === domain).length < count,
    )
  ) {
    return { eligible: false, reason: 'domain-coverage' };
  }
  return { eligible: true, reason: null };
}

/** Largest-remainder allocation honors configured domain weights without duplicate items. */
export function domainQuotas(exam: ExamConfig): Record<string, number> | null {
  if (
    !exam.questionCount ||
    !exam.domains.length ||
    exam.domains.some(
      (d) => d.weight === undefined || !Number.isFinite(d.weight) || d.weight < 0 || d.weight > 100,
    ) ||
    new Set(exam.domains.map((d) => d.id)).size !== exam.domains.length
  )
    return null;
  const weightTotal = exam.domains.reduce((sum, d) => sum + (d.weight ?? 0), 0);
  if (Math.abs(weightTotal - 100) > 0.01) return null;
  const counts = exam.domains.map((domain) => {
    const expected = (exam.questionCount! * domain.weight!) / 100;
    return {
      id: domain.id,
      count: Math.floor(expected),
      remainder: expected - Math.floor(expected),
    };
  });
  let remaining = exam.questionCount - counts.reduce((sum, d) => sum + d.count, 0);
  const byRemainder = [...counts].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; remaining > 0; i++, remaining--) byRemainder[i % byRemainder.length].count++;
  return Object.fromEntries(counts.map((d) => [d.id, d.count]));
}

export function selectMockQuestions(
  exam: ExamConfig,
  questions: readonly QuizQuestion[],
  random: () => number = Math.random,
) {
  const eligibility = mockEligibility(exam, questions);
  if (!eligibility.eligible) throw new Error(`Mock unavailable: ${eligibility.reason}`);
  const bank = [
    ...new Map(
      questions
        .filter((q) => q.trackId === exam.id && (q.type === 'single' || q.type === 'multiple'))
        .map((q) => [q.id, q]),
    ).values(),
  ];
  const quotas = domainQuotas(exam);
  const selected = quotas
    ? Object.entries(quotas).flatMap(([domain, count]) =>
        shuffle(
          bank.filter((q) => q.domain === domain),
          random,
        ).slice(0, count),
      )
    : shuffle(bank, random).slice(0, exam.questionCount!);
  return shuffle(selected, random);
}

export const quizSessionSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1).max(200),
    trackId: trackIdSchema,
    mode: z.enum(quizModes),
    practiceSetId: z.string().min(1).max(200).optional(),
    feedbackMode: z.enum(['immediate', 'after-submit']).optional(),
    domain: z.string().nullable(),
    questionIds: z.array(z.string().min(1).max(200)).min(1).max(500),
    optionOrder: z.record(z.string(), z.array(z.string().min(1).max(200)).max(100)),
    answers: z.record(z.string(), z.array(z.string().max(12000)).max(100)),
    flags: z.array(z.string()).max(500),
    checked: z.array(z.string()).max(500),
    index: z.number().int().nonnegative(),
    startedAt: z.iso.datetime(),
    remainingSeconds: z.number().nonnegative().max(86400).nullable(),
    resumedAt: z.number().nonnegative().nullable(),
    paused: z.boolean(),
  })
  .superRefine((session, context) => {
    const ids = new Set(session.questionIds);
    if (ids.size !== session.questionIds.length || session.index >= ids.size)
      context.addIssue({ code: 'custom', message: 'Invalid question order or index.' });
    if (
      [
        ...Object.keys(session.answers),
        ...Object.keys(session.optionOrder),
        ...session.flags,
        ...session.checked,
      ].some((id) => !ids.has(id))
    )
      context.addIssue({ code: 'custom', message: 'Session refers to an unknown question.' });
    if (session.questionIds.some((id) => !(id in session.optionOrder)))
      context.addIssue({ code: 'custom', message: 'Missing saved option order.' });
    if (
      Object.values(session.optionOrder).some((options) => new Set(options).size !== options.length)
    )
      context.addIssue({ code: 'custom', message: 'Duplicate saved options.' });
    if (session.paused !== (session.resumedAt === null))
      context.addIssue({ code: 'custom', message: 'Inconsistent pause state.' });
    if (session.mode === 'mock' && session.remainingSeconds === null)
      context.addIssue({ code: 'custom', message: 'Missing mock timer.' });
  });
export type QuizSession = z.infer<typeof quizSessionSchema>;

export function createQuizSession(
  questions: QuizQuestion[],
  mode: QuizMode,
  durationMinutes: number | null = null,
  domain: string | null = null,
  now = Date.now(),
): QuizSession {
  if (!questions.length) throw new Error('A session requires at least one question.');
  if (questions.some((q) => q.trackId !== questions[0].trackId))
    throw new Error('A session must belong to one track.');
  if (new Set(questions.map((q) => q.id)).size !== questions.length)
    throw new Error('A session cannot repeat a question.');
  if (durationMinutes !== null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0))
    throw new Error('A timed session requires a positive duration.');
  if (mode === 'mock' && durationMinutes === null) throw new Error('A mock requires a duration.');
  return {
    version: 1,
    id: `quiz-${now}-${Math.random().toString(36).slice(2, 8)}`,
    trackId: questions[0].trackId,
    mode,
    domain,
    questionIds: questions.map((q) => q.id),
    optionOrder: Object.fromEntries(
      questions.map((q) => [
        q.id,
        q.providerId ? q.options.map((o) => o.id) : shuffle(q.options.map((o) => o.id)),
      ]),
    ),
    answers: {},
    flags: [],
    checked: [],
    index: 0,
    startedAt: new Date(now).toISOString(),
    remainingSeconds: durationMinutes === null ? null : durationMinutes * 60,
    resumedAt: now,
    paused: false,
  };
}

/** Timestamp-based clocks survive sleeping tabs and reloads. Paused clocks never tick. */
export function remainingTime(
  session: Pick<QuizSession, 'remainingSeconds' | 'resumedAt' | 'paused'>,
  now = Date.now(),
): number | null {
  if (session.remainingSeconds === null) return null;
  if (session.paused || session.resumedAt === null) return session.remainingSeconds;
  return Math.max(
    0,
    session.remainingSeconds - Math.max(0, Math.floor((now - session.resumedAt) / 1000)),
  );
}

export function pauseSession(session: QuizSession, now = Date.now()): QuizSession {
  return {
    ...session,
    remainingSeconds: remainingTime(session, now),
    resumedAt: null,
    paused: true,
  };
}

export function resumeSession(session: QuizSession, now = Date.now()): QuizSession {
  return { ...session, resumedAt: now, paused: false };
}

export function weakAreas(
  domainScores: Record<string, { correct: number; total: number }>,
  threshold = 0.7,
) {
  return Object.entries(domainScores)
    .filter(([, score]) => score.total > 0 && score.correct / score.total < threshold)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([domain, score]) => ({
      domain,
      ...score,
      percent: Math.round((score.correct / score.total) * 100),
    }));
}
