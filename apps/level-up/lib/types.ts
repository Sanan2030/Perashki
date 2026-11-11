import { z } from 'zod';

export const localeSchema = z.enum(['az', 'en']);
export type Locale = z.infer<typeof localeSchema>;
export const localizedSchema = z.object({ az: z.string().min(1), en: z.string().min(1) });
export type Localized = z.infer<typeof localizedSchema>;
export const trackIdSchema = z.enum([
  'ba',
  'po',
  'ecba',
  'ccba',
  'cbap',
  'pspo1',
  'pspo2',
  'pspo3',
]);
export type TrackId = z.infer<typeof trackIdSchema>;
export const levelSchema = z.enum(['zero', 'junior', 'mid', 'lead']);
export type LevelId = z.infer<typeof levelSchema>;
export const moduleSchema = z.object({
  id: z.string(),
  placement: z.enum(['learning', 'library']).optional(),
  trackId: trackIdSchema,
  level: levelSchema,
  title: localizedSchema,
  description: localizedSchema,
  lessonIds: z.array(z.string()).min(1),
  estimatedMinutes: z.number().positive(),
  prerequisites: z.array(z.string()).default([]),
});
export type LearningModule = z.infer<typeof moduleSchema>;
export const lessonSchema = z.object({
  placement: z.enum(['learning', 'library']).optional(),
  sourceIds: z.array(z.string()).default([]),
  id: z.string(),
  trackId: trackIdSchema,
  level: levelSchema,
  moduleId: z.string(),
  title: localizedSchema,
  summary: localizedSchema,
  minutes: z.number().positive(),
  status: z.enum(['published', 'planned']),
  topics: z.array(z.string()),
  prerequisites: z.array(z.string()).default([]),
});
export type Lesson = z.infer<typeof lessonSchema>;
export const competencySchema = z.object({
  id: z.string(),
  trackId: z.enum(['ba', 'po']),
  level: z.enum(['junior', 'mid', 'lead']),
  title: localizedSchema,
  responsibilities: z.array(localizedSchema),
  hardSkills: z.array(localizedSchema),
  softSkills: z.array(localizedSchema),
  tools: z.array(localizedSchema),
  deliverables: z.array(localizedSchema),
  changes: localizedSchema,
  checklist: z.array(z.object({ id: z.string(), text: localizedSchema })),
  interviews: z.array(z.object({ question: localizedSchema, answer: localizedSchema })),
});
export type Competency = z.infer<typeof competencySchema>;
export const questionSchema = z.object({
  providerId: z.string().min(1).optional(),
  sourceQuestionId: z.string().min(1).optional(),
  sourceIds: z.array(z.string()).default([]),
  id: z.string(),
  trackId: trackIdSchema,
  type: z.enum(['single', 'multiple', 'ordering', 'matching', 'written']),
  domain: z.string(),
  difficulty: z.number().int().min(1).max(3),
  text: localizedSchema,
  options: z.array(
    z.object({ id: z.string(), text: localizedSchema, explanation: localizedSchema }),
  ),
  correct: z.array(z.string()),
  explanation: localizedSchema,
  lessonId: z.string(),
  practiceOnly: z.literal(true),
  rubric: z.array(localizedSchema).optional(),
  prompts: z.array(localizedSchema).optional(),
});
export type QuizQuestion = z.infer<typeof questionSchema>;
export const examSchema = z.object({
  id: trackIdSchema,
  name: z.string(),
  format: z.enum(['selected-response', 'written', 'mixed']).nullable(),
  questionCount: z.number().int().positive().nullable(),
  durationMinutes: z.number().positive().nullable(),
  passPercent: z.number().min(0).max(100).nullable(),
  domains: z.array(
    z.object({ id: z.string(), title: localizedSchema, weight: z.number().optional() }),
  ),
  verificationStatus: z.enum(['verified', 'needs-verification']),
  verifiedAt: z.string().nullable(),
  sources: z.array(z.object({ title: z.string(), url: z.url() })),
  notes: localizedSchema,
});
export type ExamConfig = z.infer<typeof examSchema>;
export interface Track {
  id: TrackId;
  category: 'career' | 'certification';
  name: Localized;
  description: Localized;
  color: string;
}
export interface LearningProfile {
  trackId: TrackId;
  currentLevel: LevelId;
  targetLevel: LevelId;
  dailyMinutes: number;
}
export interface QuizAttempt {
  id: string;
  trackId: TrackId;
  mode: string;
  practiceSetId?: string;
  startedAt: string;
  completedAt: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  score: number;
  total: number;
  domainScores: Record<string, { correct: number; total: number }>;
}
export interface ReviewCard {
  questionId: string;
  interval: number;
  repetitions: number;
  dueAt: string;
}
export interface UserProgress {
  version: 1;
  profiles: Partial<Record<TrackId, LearningProfile>>;
  activeTrack: TrackId;
  completedLessons: Record<string, string>;
  bookmarks: string[];
  notes: Record<string, string>;
  assessedSkills: string[];
  attempts: QuizAttempt[];
  reviews: ReviewCard[];
  activity: string[];
  sessions: Record<string, unknown>;
}
