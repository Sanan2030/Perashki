import { pageMetadata } from '@/lib/page-metadata';
import { SettingsView } from '@/components/settings-view';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Settings', 'Tənzimləmələr');
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SettingsView locale={getLocale(locale)} />;
}
