import { z } from 'zod';
import sourceData from '@/data/sources.json';
import { localizedSchema } from './types';
export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url(),
  kind: z.enum(['guide', 'book', 'assessment', 'community', 'announcement', 'listing', 'exam']),
  status: z.enum(['read', 'blocked', 'challenge']),
  checkedAt: z.string(),
  notes: localizedSchema,
});
export const sources = z.array(sourceSchema).parse(sourceData);
export function findSources(ids: string[]) {
  return sources.filter((source) => ids.includes(source.id));
}
