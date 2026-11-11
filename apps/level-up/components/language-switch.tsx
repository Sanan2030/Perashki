'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@/lib/types';

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const az = locale === 'az';
  return (
    <button
      type="button"
      role="switch"
      aria-label="Azərbaycan dili / English"
      aria-checked={az}
      aria-busy={pending}
      title={az ? 'English dilinə keç' : 'Switch to Azerbaijani'}
      className="language-switch"
      data-locale={locale}
      disabled={pending}
      onClick={() => {
        const next = az ? 'en' : 'az';
        document.cookie = `level-up.locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
        const target = pathname.replace(/^\/(az|en)(?=\/|$)/, `/${next}`);
        startTransition(() =>
          router.push(`${target}${window.location.search}${window.location.hash}`, {
            scroll: false,
          }),
        );
      }}
    >
      <span aria-hidden="true" lang="az">
        AZ
      </span>
      <span aria-hidden="true" lang="en">
        EN
      </span>
    </button>
  );
}
