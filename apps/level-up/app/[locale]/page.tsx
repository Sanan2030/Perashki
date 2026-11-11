import { Landing } from '@/components/landing';
import { getLocale } from '@/lib/i18n';
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Landing locale={getLocale(locale)} />;
}
