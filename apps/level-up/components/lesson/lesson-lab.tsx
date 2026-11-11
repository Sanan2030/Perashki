'use client';

import dynamic from 'next/dynamic';
import { apiLessonExercises, sqlLessonExercises } from '@/lib/labs/catalog';
import { useLocale } from '@/components/use-ui-text';

function LabLoading({ kind }: { kind: 'SQL' | 'API' }) {
  const az = useLocale() === 'az';
  return <p role="status">{az ? `${kind} laboratoriyası yüklənir…` : `Loading ${kind} lab…`}</p>;
}

const SqlLab = dynamic(() => import('./labs/sql-lab').then((module) => module.SqlLab), {
  ssr: false,
  loading: () => <LabLoading kind="SQL" />,
});
const ApiLab = dynamic(() => import('./labs/api-lab').then((module) => module.ApiLab), {
  ssr: false,
  loading: () => <LabLoading kind="API" />,
});

export function LessonLab({ lessonId }: { lessonId: string }) {
  const sql = sqlLessonExercises[lessonId];
  const api = apiLessonExercises[lessonId];
  if (!sql && !api) return null;
  return (
    <div id="practice-lab" className="stack lesson-labs">
      {sql && <SqlLab key={`sql-${lessonId}`} initialExercise={sql} />}
      {api && <ApiLab key={`api-${lessonId}`} initialExercise={api} />}
    </div>
  );
}
