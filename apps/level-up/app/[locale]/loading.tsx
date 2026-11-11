'use client';
import { useLocale } from '@/components/use-ui-text';
export default function Loading() {
  const az = useLocale() === 'az';
  return (
    <div className="page-skeleton" aria-busy="true" aria-label={az ? 'Yüklənir' : 'Loading'}>
      <div />
      <div />
      <div />
    </div>
  );
}
