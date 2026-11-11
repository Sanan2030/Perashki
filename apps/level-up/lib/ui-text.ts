import translations from '@/data/i18n/interface-az.json';
import type { Locale } from './types';

const azText: Readonly<Record<string, string>> = translations;
/** Reviewed interface copy only. Code, identifiers and professional terms are not translated. */
export function uiText(text: string, locale: Locale): string {
  if (locale !== 'az') return text;
  const reviewed = azText[text.trim()];
  if (reviewed) return reviewed;
  const columns = /^Use these result columns: (.+)\.$/.exec(text);
  if (columns) return `Bu nəticə sütunlarını istifadə et: ${columns[1]}.`;
  const rows =
    /^Not yet\. Expected (\d+) row\(s\)\. Check the grain, filters and denominator; then run the query again\.$/.exec(
      text,
    );
  if (rows)
    return `Hələ düzgün deyil. ${rows[1]} sətir gözlənilir. Grain, filter və denominator-u yoxla, sonra sorğunu yenidən icra et.`;
  return text;
}
