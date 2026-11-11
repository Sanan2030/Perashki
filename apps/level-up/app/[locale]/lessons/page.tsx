import { pageMetadata } from '@/lib/page-metadata';
import { Suspense } from 'react';
import { LibraryView } from '@/components/learning';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Lesson library', 'Dərs kitabxanası');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<p>…</p>}>
      <LibraryView key={locale} locale={getLocale(locale)} />
    </Suspense>
  );
}
