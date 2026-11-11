import { z } from 'zod';
import competencyData from '@/data/scrum-competencies.json';
const areaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  lessonIds: z.array(z.string()),
});
const groupSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  areas: z.array(areaSchema),
});
export const scrumCompetencies = z.array(groupSchema).parse(competencyData);
