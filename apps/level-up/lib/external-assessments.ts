import { z } from 'zod';
import assessmentData from '@/data/external-assessments.json';
import { localizedSchema, trackIdSchema } from './types';

export const externalAssessmentSchema = z.object({
  id: z.string().min(1),
  trackId: trackIdSchema,
  name: z.string().min(1),
  url: z.url(),
  mockUrl: z.url().optional(),
  sourceId: z.string().min(1),
  official: z.boolean(),
  offer: localizedSchema,
  access: localizedSchema,
  coverage: localizedSchema,
  lessonIds: z.array(z.string()).min(1),
});

export const externalAssessments = z.array(externalAssessmentSchema).parse(assessmentData);
