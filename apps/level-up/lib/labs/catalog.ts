export const sqlLessonExercises: Record<string, string> = {
  'sql-basics': 'paid-revenue',
  'data-analysis-grain-quality': 'join-grain',
  'data-sql-windows-cohorts': 'cohort-retention',
  'data-excel-powerbi-models': 'monthly',
  'data-dashboards-storytelling': 'monthly',
  'data-etl-warehouse': 'join-grain',
  'data-dbt-quality-lineage': 'all-customers',
};
export const apiLessonExercises: Record<string, string> = {
  'rest-apis': 'read',
  'api-idempotency-concurrency': 'idempotency',
  'api-contracts-evolution': 'validation',
  'secure-api-coding': 'validation',
  'jwt-validation-authorization': 'authorization',
  'testing-postman-apis': 'read',
  'testing-strategy-contracts': 'version',
};
export function hasLessonLab(lessonId: string): boolean {
  return !!sqlLessonExercises[lessonId] || !!apiLessonExercises[lessonId];
}
