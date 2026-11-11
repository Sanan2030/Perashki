import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgressProvider } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import { localeSchema } from '@/lib/types';
import { locales } from '@/lib/i18n';
import { publicSiteUrl } from '@/lib/site-url';
import '../globals.css';
import '../merhele.css';
import '../../../../public/workspace-theme.css';
import { themeScript } from '../../../../shared/theme.mjs';
const site = publicSiteUrl();
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Mərhələ — Business Analysis & Product Ownership', template: '%s | Mərhələ' },
  description:
    'Business analysis and product ownership lessons, roadmaps and certification practice in Azerbaijani and English, with English professional terminology.',
  openGraph: {
    type: 'website',
    siteName: 'Mərhələ',
    title: 'Mərhələ — Business Analysis & Product Ownership',
    description:
      'Azerbaijani and English lessons, learning roadmaps and certification practice with English professional terminology.',
    images: ['/opengraph-image'],
  },
  twitter: { card: 'summary_large_image' },
};
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const parsed = localeSchema.safeParse(raw);
  if (!parsed.success) notFound();
  const locale = parsed.data;
  return (
    <html lang={locale} data-app="level-up" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main-content" className="skip-link">
          {locale === 'az' ? 'Məzmuna keç' : 'Skip to content'}
        </a>
        <ProgressProvider>
          <AppShell locale={locale}>{children}</AppShell>
        </ProgressProvider>
      </body>
    </html>
  );
}
