'use client';
import Link from 'next/link';
import { useLocale } from '@/components/use-ui-text';
export default function NotFound() {
  const locale = useLocale();
  const az = locale === 'az';
  return (
    <div className="empty-state card padded">
      <span className="eyebrow">404</span>
      <h1>{az ? 'Səhifə tapılmadı' : 'Page not found'}</h1>
      <Link className="button button-primary" href={`/${locale}`}>
        {az ? 'Ana səhifə' : 'Home'}
      </Link>
    </div>
  );
}
