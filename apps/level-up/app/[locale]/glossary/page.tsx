import { pageMetadata } from '@/lib/page-metadata';
import { GlossaryView } from '@/components/learning';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('BA & PO glossary', 'BA və PO terminlər lüğəti');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <GlossaryView locale={getLocale(locale)} />;
}
