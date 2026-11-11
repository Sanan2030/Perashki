import { pageMetadata } from '@/lib/page-metadata';
import { CompetencyView } from '@/components/learning';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Competency matrix', 'Bacarıq matrisi');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CompetencyView locale={getLocale(locale)} />;
}
