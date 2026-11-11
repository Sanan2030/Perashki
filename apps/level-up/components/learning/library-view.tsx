'use client';
import { useUIText } from '@/components/use-ui-text';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock3,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useProgress } from '@/components/providers';
import { lessons, glossary, isIndependentLesson, lessonCategory } from '@/lib/catalog';
import { tracks } from '@/lib/tracks';
import { copy, localize } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export function LibraryView({
  locale,
  initialQuery = '',
}: {
  locale: Locale;
  initialQuery?: string;
}) {
  const ui = useUIText();
  const { progress, ready, update } = useProgress();
  const [query, setQuery] = useState(initialQuery);
  const params = useSearchParams();
  const initialTrack = params.get('track');
  const [track, setTrack] = useState(
    initialTrack && (initialTrack === 'library' || tracks.some((t) => t.id === initialTrack))
      ? initialTrack
      : 'all',
  );
  const [status, setStatus] = useState('all');
  const initialSubject = params.get('subject');
  const [subject, setSubject] = useState(
    initialSubject &&
      [
        'technical',
        'pspo',
        'devops',
        'data',
        'databases',
        'messaging',
        'testing',
        'data-engineering',
        'cloud-security',
      ].includes(initialSubject)
      ? initialSubject
      : 'all',
  );
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const t = copy[locale];
  const az = locale === 'az';
  const normalized = query.trim().toLocaleLowerCase(locale);
  const results = lessons.filter(
    (lesson) =>
      (track === 'all' ||
        (track === 'library'
          ? isIndependentLesson(lesson)
          : !isIndependentLesson(lesson) && lesson.trackId === track)) &&
      (status === 'all' || lesson.status === status) &&
      (subject === 'all' ||
        (subject === 'technical' && lesson.topics.includes('software-development')) ||
        (subject === 'devops' && lesson.topics.includes('devops')) ||
        (subject === 'data' && lesson.topics.includes('data-analysis')) ||
        (['databases', 'messaging', 'testing', 'data-engineering', 'cloud-security'].includes(
          subject,
        ) &&
          lesson.topics.includes(subject)) ||
        (subject === 'pspo' && lesson.trackId.startsWith('pspo'))) &&
      (!bookmarksOnly || progress.bookmarks.includes(lesson.id)) &&
      (!normalized ||
        [localize(lesson.title, locale), localize(lesson.summary, locale), ...lesson.topics]
          .join(' ')
          .toLocaleLowerCase(locale)
          .includes(normalized)),
  );
  const terms = normalized
    ? glossary
        .filter((term) =>
          [term.term.en, term.term.az, localize(term.definition, locale)]
            .join(' ')
            .toLocaleLowerCase(locale)
            .includes(normalized),
        )
        .slice(0, 8)
    : [];
  return (
    <div className="stack">
      <div className="page-heading">
        <h1 className="page-title">{t.lessons}</h1>
      </div>
      <section
        className="card stack"
        aria-label={az ? 'Kitabxanada axtarış və filtrlər' : 'Library search and filters'}
      >
        <div className="search-field">
          <Search size={20} />
          <label className="sr-only" htmlFor="library-search">
            {t.search}
          </label>
          <input
            className="input"
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
          />
        </div>
        <div className="filter-bar">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <label className="field-label">
            {ui('Subject')}
            <select
              className="input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              <option value="all">{ui('All subjects')}</option>
              <option value="technical">{ui('Architecture, coding & APIs')}</option>
              <option value="devops">DevOps</option>
              <option value="data">{ui('Data analysis')}</option>
              <option value="databases">{ui('Advanced databases')}</option>
              <option value="messaging">{ui('Messaging & caching')}</option>
              <option value="testing">{ui('Software testing')}</option>
              <option value="data-engineering">{ui('Data engineering')}</option>
              <option value="cloud-security">{ui('Cloud & security')}</option>
              <option value="pspo">{ui('PSPO preparation')}</option>
            </select>
          </label>
          <label className="field-label">
            {az ? 'İstiqamət' : 'Track'}
            <select
              className="input"
              value={track}
              onChange={(event) => setTrack(event.target.value)}
            >
              <option value="all">{t.all}</option>
              <option value="library">{ui('Independent lessons')}</option>
              {tracks.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {localize(entry.name, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            {az ? 'Məzmun' : 'Content'}
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">{t.all}</option>
              <option value="published">{az ? 'Tam dərslər' : 'Complete lessons'}</option>
              <option value="planned">{az ? 'Məzmun planları' : 'Curriculum outlines'}</option>
            </select>
          </label>
          <button
            className={`button button-secondary ${bookmarksOnly ? 'is-active' : ''}`}
            type="button"
            aria-pressed={bookmarksOnly}
            onClick={() => setBookmarksOnly(!bookmarksOnly)}
          >
            <Bookmark size={16} fill={bookmarksOnly ? 'currentColor' : 'none'} />
            {az ? 'Seçilmişlər' : 'Bookmarks'}
          </button>
        </div>
      </section>
      <div className="results-heading">
        <p role="status" className="muted">
          {results.length} {az ? 'mövzu tapıldı' : 'topics found'}
        </p>
        <span className="small muted">
          {lessons.filter((lesson) => lesson.status === 'published').length}{' '}
          {az ? 'tam dərs' : 'complete lessons'} ·{' '}
          {lessons.filter((lesson) => lesson.status === 'planned').length}{' '}
          {az ? 'kontur' : 'outlines'}
        </span>
      </div>
      {results.length > 0 ? (
        <div className="grid-3 lesson-card-grid">
          {results.map((lesson) => {
            const bookmarked = progress.bookmarks.includes(lesson.id);
            const complete = !!progress.completedLessons[lesson.id];
            return (
              <article
                className={`card library-lesson-card ${lesson.status === 'planned' ? 'is-planned' : ''}`}
                key={lesson.id}
              >
                <div className={`lesson-card-art art-${lesson.trackId}`}>
                  <BookOpen size={34} strokeWidth={1.3} />
                  <span>{lessonCategory(lesson, locale)}</span>
                </div>
                <div className="lesson-card-content">
                  <div className="lesson-card-meta">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={!ready}
                      aria-label={
                        bookmarked
                          ? az
                            ? 'Seçilmişlərdən çıxar'
                            : 'Remove bookmark'
                          : az
                            ? 'Seçilmişlərə əlavə et'
                            : 'Bookmark lesson'
                      }
                      aria-pressed={bookmarked}
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          bookmarks: bookmarked
                            ? p.bookmarks.filter((id) => id !== lesson.id)
                            : Array.from(new Set([...p.bookmarks, lesson.id])),
                        }))
                      }
                    >
                      <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <h2>
                    <Link href={`/${locale}/lessons/${lesson.id}`}>
                      {localize(lesson.title, locale)}
                    </Link>
                  </h2>
                  <p className="muted">{localize(lesson.summary, locale)}</p>
                  <div className="lesson-card-footer">
                    <span className="small muted">
                      <Clock3 size={14} />
                      {lesson.minutes} {t.minutes}
                    </span>
                    {complete ? (
                      <span className="badge success">
                        <CheckCircle2 size={13} />
                        {t.completed}
                      </span>
                    ) : lesson.status === 'planned' ? (
                      <span className="badge">{az ? 'Kontur' : 'Outline'}</span>
                    ) : (
                      <Link
                        className="text-link"
                        href={`/${locale}/lessons/${lesson.id}`}
                        aria-label={`${az ? 'Oxu' : 'Read'}: ${localize(lesson.title, locale)}`}
                      >
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <Search size={32} />
          <h2 className="section-title">{az ? 'Uyğun dərs tapılmadı' : 'No matching lessons'}</h2>
          <p className="muted">
            {az
              ? 'Başqa söz yaz və ya filtrləri sıfırla.'
              : 'Try a different search or clear your filters.'}
          </p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setQuery('');
              setTrack('all');
              setStatus('all');
              setSubject('all');
              setBookmarksOnly(false);
            }}
          >
            {az ? 'Filtrləri sıfırla' : 'Clear filters'}
          </button>
        </div>
      )}
      {terms.length > 0 && (
        <section className="card stack">
          <h2 className="section-title">{az ? 'Lüğətdə tapılanlar' : 'Related glossary terms'}</h2>
          <dl className="search-terms">
            {terms.map((term) => (
              <div key={term.id}>
                <dt>
                  <Link className="text-link" href={`/${locale}/glossary#${term.id}`}>
                    {term.term.en}
                    <ArrowRight size={14} />
                  </Link>
                </dt>
                <dd className="muted">{localize(term.definition, locale)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
