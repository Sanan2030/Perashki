import { pageMetadata } from '@/lib/page-metadata';
import { RoadmapView } from '@/components/learning';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Learning roadmap', 'Öyrənmə yol xəritəsi');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RoadmapView locale={getLocale(locale)} />;
}
