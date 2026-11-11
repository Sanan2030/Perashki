import { findSources } from '@/lib/sources';
import type { Locale } from '@/lib/types';
export function SourceLinks({ ids, locale }: { ids: string[]; locale: Locale }) {
  if (!ids.length) return null;
  return (
    <div className="question-sources small">
      <strong>{locale === 'az' ? 'Əsas mənbələr' : 'Supporting sources'}</strong>
      <ul>
        {findSources(ids).map((s) => (
          <li key={s.id}>
            <a className="text-link" href={`/${locale}/sources#${s.id}`}>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
