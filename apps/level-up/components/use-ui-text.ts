'use client';
import { usePathname } from 'next/navigation';
import { uiText } from '@/lib/ui-text';
export function useLocale() {
  const pathname = usePathname();
  return pathname.split('/')[1] === 'az' ? 'az' : 'en';
}
export function useUIText() {
  const locale = useLocale();
  return (text: string) => uiText(text, locale);
}
