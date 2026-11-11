import { z } from 'zod';
import setData from '@/data/practice-sets.json';
import { localizedSchema, trackIdSchema, type QuizQuestion } from './types';
import { shuffle } from './quiz';

export const practiceSetSchema = z
  .object({
    id: z.string().min(1),
    trackId: trackIdSchema,
    providerId: z.string().min(1),
    sourceUrl: z.url(),
    title: localizedSchema,
    description: localizedSchema,
    durationMinutes: z.number().int().positive().max(1440),
    testQuestionCount: z.number().int().positive().max(500),
    questionIds: z.array(z.string().min(1)).min(1).max(500),
  })
  .refine(
    (set) =>
      new Set(set.questionIds).size === set.questionIds.length &&
      set.testQuestionCount <= set.questionIds.length,
    {
      message: 'A practice set cannot repeat a question.',
    },
  );

export type PracticeSet = z.infer<typeof practiceSetSchema>;
export const practiceSets = z.array(practiceSetSchema).parse(setData);

export function selectPracticeSetQuestions(
  set: PracticeSet,
  bank: readonly QuizQuestion[],
  testMode = false,
) {
  const byId = new Map(bank.map((question) => [question.id, question]));
  const questions = set.questionIds.map((id) => byId.get(id));
  if (
    questions.some(
      (q) =>
        !q ||
        q.trackId !== set.trackId ||
        q.providerId !== set.providerId ||
        !['single', 'multiple'].includes(q.type),
    )
  )
    throw new Error(`Practice set ${set.id} has missing or incompatible questions.`);
  if (new Set(set.questionIds).size !== set.questionIds.length)
    throw new Error(`Practice set ${set.id} repeats questions.`);
  if (set.testQuestionCount > questions.length)
    throw new Error(`Practice set ${set.id} is too small.`);
  const selected = shuffle(questions as QuizQuestion[]);
  return testMode ? selected.slice(0, set.testQuestionCount) : selected;
}
