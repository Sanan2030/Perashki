'use client';
import { useLocale } from '@/components/use-ui-text';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const az = useLocale() === 'az';
  return (
    <div className="card padded empty-state" role="alert">
      <h1>{az ? 'Səhifə yüklənmədi' : 'This page couldn’t load'}</h1>
      <button className="button button-primary" onClick={reset}>
        {az ? 'Yenidən sına' : 'Try again'}
      </button>
    </div>
  );
}
