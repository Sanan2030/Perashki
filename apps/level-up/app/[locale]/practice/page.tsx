import { pageMetadata } from '@/lib/page-metadata';
import { Suspense } from 'react';
import { QuizWorkspace } from '@/components/quiz/quiz-workspace';
import { getLocale } from '@/lib/i18n';
import { getExams, getQuestions, getImportedQuestions } from '@/lib/assessments';
export const generateMetadata = pageMetadata(
  'Practice & certification exams',
  'Məşq və sertifikasiya imtahanları',
);
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<p>…</p>}>
      <QuizWorkspace
        locale={getLocale(locale)}
        questions={[...getQuestions(), ...getImportedQuestions()]}
        exams={getExams()}
      />
    </Suspense>
  );
}
