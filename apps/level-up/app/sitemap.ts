import type { MetadataRoute } from 'next';
import { lessons } from '@/lib/catalog';
import { locales } from '@/lib/i18n';
import { publicSiteUrl } from '@/lib/site-url';
export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicSiteUrl();
  return locales.flatMap((locale) =>
    [
      '',
      '/lessons',
      '/glossary',
      '/sources',
      '/study-guide',
      ...lessons.filter((l) => l.status === 'published').map((l) => `/lessons/${l.id}`),
    ].map((route) => ({
      url: `${site}/${locale}${route}`,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.7,
      alternates: { languages: { en: `${site}/en${route}`, az: `${site}/az${route}` } },
    })),
  );
}
