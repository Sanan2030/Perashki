'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartNoAxesColumnIncreasing, Menu, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { copy } from '@/lib/i18n';
import { tracks } from '@/lib/tracks';
import type { Locale, TrackId } from '@/lib/types';
import { useProgress } from './providers';
import { ThemeToggle } from './theme-toggle';
import { TranslateButton } from './translate-panel';
import { PageNavigation } from './page-navigation';
import { LanguageSwitch } from './language-switch';

export function AppShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const path = usePathname();
  const home = path === `/${locale}`;
  const az = locale === 'az';
  const t = copy[locale];
  const { progress, ready, update, error } = useProgress();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const links = home
    ? [
        ['#how', az ? 'Necə işləyir' : 'How it works'],
        [`/${locale}/lessons`, az ? 'Dərslər' : 'Lessons'],
        ['#certifications', az ? 'Sertifikatlar' : 'Certifications'],
      ]
    : [
        [`/${locale}/roadmap`, az ? 'Yol xəritəm' : 'My roadmap'],
        [`/${locale}/lessons`, az ? 'Dərslər' : 'Lessons'],
        [`/${locale}/practice`, az ? 'Quizlər' : 'Quizzes'],
      ];
  return (
    <div className={`merhele-shell ${home ? 'is-home' : ''}`}>
      <header className="merhele-header">
        <div className="merhele-header-inner">
          <Link
            href={`/${locale}`}
            className="merhele-brand"
            aria-label={az ? 'Mərhələ — Ana səhifə' : 'Mərhələ — Home'}
          >
            <span>
              <ChartNoAxesColumnIncreasing size={23} />
            </span>
            Mərhələ
          </Link>
          <nav
            className={`merhele-nav ${menu ? 'is-open' : ''}`}
            aria-label={az ? 'Əsas naviqasiya' : 'Main navigation'}
          >
            {links.map(([url, label]) => (
              <Link
                key={url}
                href={url}
                onClick={() => setMenu(false)}
                aria-current={path === url ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
            <Link
              href={`/${locale}/dashboard`}
              className="button button-outline"
              onClick={() => setMenu(false)}
              aria-current={path === `/${locale}/dashboard` ? 'page' : undefined}
            >
              {az ? 'Mənim panelim' : 'My dashboard'}
            </Link>
          </nav>
          <div className="merhele-utilities">
            <LanguageSwitch locale={locale} />
            <TranslateButton />
            <ThemeToggle locale={locale} />
            <button
              type="button"
              className="icon-button merhele-menu"
              aria-label={
                menu
                  ? az
                    ? 'Menyunu bağla'
                    : 'Close navigation'
                  : az
                    ? 'Menyu'
                    : 'Open navigation'
              }
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      {!home && (
        <div className="workspace-toolbar">
          <label>
            <span>{az ? 'İstiqamət' : 'Track'}</span>
            <select
              aria-label={az ? 'Aktiv istiqamət' : 'Active learning track'}
              value={progress.activeTrack}
              disabled={!ready}
              onChange={(e) => update((p) => ({ ...p, activeTrack: e.target.value as TrackId }))}
            >
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name[locale]}
                </option>
              ))}
            </select>
          </label>
          <nav aria-label={az ? 'Əlavə bölmələr' : 'More learning tools'}>
            <Link href={`/${locale}/competencies`}>{t.competencies}</Link>
            <Link href={`/${locale}/glossary`}>{t.glossary}</Link>
            <Link href={`/${locale}/study-guide`}>{az ? 'Öyrənmə bələdçisi' : 'Study guide'}</Link>
            <Link href={`/${locale}/sources`}>{az ? 'Mənbələr' : 'Sources'}</Link>
            <Link href={`/${locale}/settings`}>{t.settings}</Link>
          </nav>
        </div>
      )}
      {error && (
        <div className="merhele-storage-warning" role="alert">
          {az
            ? 'Brauzer yaddaşı oxunmur. Əvvəlki məlumatlar qorunur; dəyişiklikləri Tənzimləmələr bölməsindən ixrac et.'
            : 'Browser storage is unavailable or unreadable. Previous data is preserved; export session changes in Settings.'}
        </div>
      )}
      <main id="main-content" className="main-content">
        <Suspense fallback={null}>
          <PageNavigation />
        </Suspense>
        {children}
      </main>
      <footer className="merhele-footer">
        <Link href={`/${locale}`} className="merhele-footer-brand">
          Mərhələ
        </Link>
        <Link href={`/${locale}/sources`}>
          {az ? 'Mənbələr və məzmun qeydləri' : 'Sources & content notes'}
        </Link>
      </footer>
    </div>
  );
}
