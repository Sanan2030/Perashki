'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, House } from 'lucide-react';
import { useEffect, useRef } from 'react';

type NavigationEntry = { session: string; depth: number; url: string };

export function PageNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = pathname.split('/')[1] === 'az' ? 'az' : 'en';
  const az = locale === 'az';
  const entry = useRef<NavigationEntry | null>(null);

  useEffect(() => {
    const url = window.location.href;
    const stored = window.history.state?.merheleNavigation as NavigationEntry | undefined;
    const session = entry.current?.session ?? crypto.randomUUID();
    let depth = 0;
    if (stored?.session === session && stored.url === url) depth = stored.depth;
    else if (
      entry.current &&
      entry.current.url !== url &&
      (!stored || stored.session === session)
    ) {
      depth = entry.current.depth + 1;
    }
    entry.current = { session, depth, url };
    // Preserve Next.js history state while marking entries visited in this app session.
    window.history.replaceState(
      { ...window.history.state, merheleNavigation: entry.current },
      '',
      url,
    );
  }, [pathname, searchParams]);

  useEffect(() => {
    const restore = (event: PopStateEvent) => {
      if (!entry.current) return;
      const stored = event.state?.merheleNavigation as NavigationEntry | undefined;
      entry.current =
        stored?.session === entry.current.session
          ? stored
          : { ...entry.current, depth: 0, url: window.location.href };
    };
    // Restore our position before the router renders the destination.
    window.addEventListener('popstate', restore, true);
    return () => window.removeEventListener('popstate', restore, true);
  }, []);

  if (pathname === `/${locale}`) return null;

  function back() {
    const stored = window.history.state?.merheleNavigation as NavigationEntry | undefined;
    if (stored?.session === entry.current?.session && stored && stored.depth > 0) router.back();
    else router.push(`/${locale}`);
  }

  return (
    <nav className="page-navigation" aria-label={az ? 'Səhifə naviqasiyası' : 'Page navigation'}>
      <button type="button" className="button button-secondary" onClick={back}>
        <ArrowLeft size={16} aria-hidden="true" />
        {az ? 'Geri' : 'Back'}
      </button>
      <Link href={`/${locale}`} className="button button-secondary">
        <House size={16} aria-hidden="true" />
        {az ? 'Ana səhifə' : 'Home'}
      </Link>
    </nav>
  );
}
