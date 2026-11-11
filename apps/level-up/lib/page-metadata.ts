import { getLocale } from './i18n';

export function pageMetadata(en: string, az: string) {
  return async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    return { title: getLocale(locale) === 'az' ? az : en };
  };
}
