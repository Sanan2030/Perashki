'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookA, Search } from 'lucide-react';
import { glossary } from '@/lib/catalog';
import { copy, localize } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export function GlossaryView({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState('');
  const t = copy[locale];
  const az = locale === 'az';
  const normalized = query.trim().toLocaleLowerCase(locale);
  const terms = glossary
    .filter((term) =>
      [localize(term.term, locale), localize(term.definition, locale), term.term.en]
        .join(' ')
        .toLocaleLowerCase(locale)
        .includes(normalized),
    )
    .sort((a, b) => a.term.en.localeCompare(b.term.en, 'en'));
  return (
    <div className="stack">
      <div className="page-heading">
        <h1 className="page-title">{t.glossary}</h1>
      </div>
      <div className="card search-field">
        <Search size={20} />
        <label className="sr-only" htmlFor="glossary-search">
          {az ? 'Termin axtar' : 'Search glossary'}
        </label>
        <input
          className="input"
          id="glossary-search"
          type="search"
          placeholder={az ? 'Termin və ya anlayış axtar…' : 'Search a term or concept…'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <p className="muted small" role="status">
        {terms.length} {az ? 'termin' : 'terms'}
      </p>
      {terms.length ? (
        <dl className="glossary-grid grid-2">
          {terms.map((term) => (
            <div id={term.id} className="card glossary-entry" key={term.id}>
              <dt>
                <BookA size={20} />
                <h2 className="section-title" lang="en">
                  {term.term.en}
                </h2>
              </dt>
              <dd>
                <p className="muted">{localize(term.definition, locale)}</p>
                <Link
                  className="text-link small"
                  href={`/${locale}/lessons/${term.relatedLessonId}`}
                >
                  {az ? 'Əlaqəli dərs' : 'Related lesson'}
                  <ArrowRight size={14} />
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="card empty-state">
          <BookA size={32} />
          <h2 className="section-title">{az ? 'Termin tapılmadı' : 'No terms found'}</h2>
          <p className="muted">
            {az ? 'Başqa sözlə axtarmağa çalış.' : 'Try searching with another word.'}
          </p>
          <button className="button button-secondary" type="button" onClick={() => setQuery('')}>
            {az ? 'Axtarışı sıfırla' : 'Clear search'}
          </button>
        </div>
      )}
    </div>
  );
}
