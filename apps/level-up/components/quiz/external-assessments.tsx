import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { externalAssessments } from '@/lib/external-assessments';
import { lessons } from '@/lib/catalog';
import { getTrack } from '@/lib/tracks';
import type { Locale, TrackId } from '@/lib/types';

export function ExternalAssessments({ locale, trackId }: { locale: Locale; trackId: TrackId }) {
  const items = externalAssessments.filter((item) => item.trackId === trackId);
  const az = locale === 'az';
  if (!items.length) return null;

  return (
    <section className="stack external-assessments" aria-labelledby="external-assessments-title">
      <div>
        <h2 id="external-assessments-title">
          {getTrack(trackId).name[locale]} {az ? 'sınaq platformaları' : 'practice platforms'}
        </h2>
        <p className="muted">
          {az
            ? 'Sınaqlar platformanın özündə açılır. Buradakı məşq sualları və nəticə tarixçəsi ayrıdır.'
            : 'Tests open on the provider’s site. This app’s original practice and result history are separate.'}
        </p>
      </div>
      <div className="grid-2">
        {items.map((item) => (
          <article className="card stack" style={{ padding: '1.25rem' }} key={item.id}>
            <div>
              <span className="badge badge-peach">
                {item.official
                  ? az
                    ? 'Rəsmi əsas bilik testi'
                    : 'Official foundational assessment'
                  : az
                    ? 'Müstəqil hazırlıq platforması'
                    : 'Independent practice provider'}
              </span>
              <h3>{item.name}</h3>
              <p>{item.offer[locale]}</p>
              <p className="small muted">{item.access[locale]}</p>
            </div>
            <div className="button-row">
              <a
                className="button button-secondary"
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                {az ? 'Sınağı aç' : 'Open practice'}
                <ArrowUpRight size={16} aria-hidden="true" />
                <span className="sr-only">{item.name}</span>
              </a>
              {item.mockUrl && (
                <a className="text-link" href={item.mockUrl} target="_blank" rel="noreferrer">
                  {az ? 'Vaxtlı sınağı aç' : 'Open timed mock'} ↗
                </a>
              )}
            </div>
            <details>
              <summary>{az ? 'Mövzular və uyğun dərslər' : 'Topics and related lessons'}</summary>
              <p className="small">{item.coverage[locale]}</p>
              <ul>
                {item.lessonIds.map((id) => (
                  <li key={id}>
                    <Link className="text-link" href={`/${locale}/lessons/${id}`}>
                      <BookOpen size={14} aria-hidden="true" />
                      {lessons.find((lesson) => lesson.id === id)!.title[locale]}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            <Link className="text-link small" href={`/${locale}/sources#${item.sourceId}`}>
              {az ? 'Mənbə və yoxlama qeydi' : 'Source and review notes'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
