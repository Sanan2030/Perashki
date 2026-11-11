import modulesData from '@/data/modules.json';
import lessonsData from '@/data/lessons.json';
import competenciesData from '@/data/competencies/index.json';
import glossaryData from '@/data/glossary.json';
import { moduleSchema, lessonSchema, competencySchema, localizedSchema } from './types';
import { z } from 'zod';
import { getTrack } from './tracks';
import type { Lesson, Locale } from './types';
import { uiText } from './ui-text';
export const modules = z.array(moduleSchema).parse(modulesData);
export const lessons = z.array(lessonSchema).parse(lessonsData);
export const learningModules = modules.filter((module) => module.placement !== 'library');
export const learningLessons = lessons.filter((lesson) => !isIndependentLesson(lesson));

export function isIndependentLesson(lesson: Pick<Lesson, 'placement'>): boolean {
  return lesson.placement === 'library';
}

export function lessonCategory(lesson: Lesson, locale: Locale): string {
  if (!isIndependentLesson(lesson)) return getTrack(lesson.trackId).name[locale];
  const groups: Record<string, string> = {
    'software-development': 'Architecture, coding & APIs',
    devops: 'DevOps',
    'data-analysis': 'Data analysis',
    databases: 'Advanced databases',
    messaging: 'Messaging & caching',
    testing: 'Software testing',
    'data-engineering': 'Data engineering',
    'cloud-security': 'Cloud & security',
  };
  return uiText(
    lesson.topics.map((topic) => groups[topic]).find(Boolean) ?? 'Independent lessons',
    locale,
  );
}
export const competencies = z.array(competencySchema).parse(competenciesData);
export const glossary = z
  .array(
    z.object({
      id: z.string(),
      term: localizedSchema,
      definition: localizedSchema,
      relatedLessonId: z.string(),
    }),
  )
  .parse(glossaryData);
