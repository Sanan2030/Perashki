import type { LearningModule, LearningProfile, Lesson, LevelId } from './types';

export const levelOrder: LevelId[] = ['zero', 'junior', 'mid', 'lead'];

/** Sort dependencies first, preserving curriculum order for unrelated entries. */
export function orderByPrerequisites<T extends { id: string; prerequisites: string[] }>(
  items: T[],
): T[] {
  const lookup = new Map(items.map((item) => [item.id, item]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const result: T[] = [];
  function visit(item: T) {
    if (visiting.has(item.id)) throw new Error(`Cyclic curriculum prerequisite: ${item.id}`);
    if (visited.has(item.id)) return;
    visiting.add(item.id);
    for (const id of item.prerequisites) {
      const dependency = lookup.get(id);
      // Prior-level prerequisites are satisfied by the learner's selected current level.
      if (dependency) visit(dependency);
    }
    visiting.delete(item.id);
    visited.add(item.id);
    result.push(item);
  }
  items.forEach(visit);
  return result;
}

/** Return the selected learning gap without counting prior-level content as unfinished. */
export function generateRoadmap(
  profile: LearningProfile,
  allModules: LearningModule[],
  allLessons: Lesson[],
  completedLessons: Record<string, string> = {},
) {
  const career = profile.trackId === 'ba' || profile.trackId === 'po';
  const current = levelOrder.indexOf(profile.currentLevel);
  const target = levelOrder.indexOf(profile.targetLevel);
  if (career && target <= current)
    throw new Error('Target level must be higher than current level');
  if (!Number.isFinite(profile.dailyMinutes) || profile.dailyMinutes <= 0) {
    throw new Error('Daily study minutes must be positive');
  }
  const lessonLookup = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
  const selectedModules = orderByPrerequisites(
    allModules
      .filter(
        (module) =>
          module.trackId === profile.trackId &&
          module.placement !== 'library' &&
          (!career ||
            (levelOrder.indexOf(module.level) > current &&
              levelOrder.indexOf(module.level) <= target)),
      )
      .map((module) => ({
        ...module,
        lessonIds: module.lessonIds.filter((id) => lessonLookup.get(id)?.placement !== 'library'),
      }))
      .filter((module) => module.lessonIds.length > 0),
  );
  const selectedLessons = orderByPrerequisites(
    selectedModules.flatMap((module) =>
      module.lessonIds
        .map((id) => lessonLookup.get(id))
        .filter((lesson): lesson is Lesson => !!lesson),
    ),
  );
  const totalMinutes = selectedLessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const remainingMinutes = selectedLessons.reduce(
    (sum, lesson) => sum + (completedLessons[lesson.id] ? 0 : lesson.minutes),
    0,
  );
  const completedCount = selectedLessons.filter((lesson) => completedLessons[lesson.id]).length;
  return {
    modules: selectedModules,
    lessons: selectedLessons,
    totalMinutes,
    remainingMinutes,
    estimatedDays: Math.ceil(remainingMinutes / profile.dailyMinutes),
    publishedCount: selectedLessons.filter((lesson) => lesson.status === 'published').length,
    completedCount,
    completionPercent: selectedLessons.length
      ? Math.round((completedCount / selectedLessons.length) * 100)
      : 0,
    nextLesson: selectedLessons.find(
      (lesson) => lesson.status === 'published' && !completedLessons[lesson.id],
    ),
  };
}
