import { pageMetadata } from '@/lib/page-metadata';
import { OnboardingView } from '@/components/learning';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Your learning path', 'Öyrənmə yolun');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <OnboardingView locale={getLocale(locale)} />;
}
