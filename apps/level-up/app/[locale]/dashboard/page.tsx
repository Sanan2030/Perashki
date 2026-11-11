import { pageMetadata } from '@/lib/page-metadata';
import { Dashboard } from '@/components/dashboard';
import { getLocale } from '@/lib/i18n';
import { getQuestions } from '@/lib/assessments';
import { lessons, isIndependentLesson } from '@/lib/catalog';
export const generateMetadata = pageMetadata('My dashboard', 'Mənim panelim');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const independentIds = new Set(lessons.filter(isIndependentLesson).map((lesson) => lesson.id));
  const independentQuestionIds = getQuestions()
    .filter((q) => independentIds.has(q.lessonId))
    .map((q) => q.id);
  return <Dashboard locale={getLocale(locale)} independentQuestionIds={independentQuestionIds} />;
}
