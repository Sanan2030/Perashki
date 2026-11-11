'use client';
import { useUIText } from '@/components/use-ui-text';

import { Languages, Search, X, LoaderCircle, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  dictionaryResponseSchema,
  findDictionaryEntry,
  MAX_DICTIONARY_QUERY_LENGTH,
  suggestDictionaryEntries,
  validateDictionaryQuery,
  type DictionaryEntry,
  type DictionaryResponse,
} from '@/lib/dictionary';

export function TranslateButton({ className = '' }: { className?: string }) {
  const t = useUIText();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<AbortController | null>(null);
  const selected = useRef('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DictionaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => pending.current?.abort(), []);

  function captureSelection() {
    selected.current = window.getSelection()?.toString().replace(/\s+/g, ' ').trim() ?? '';
  }

  function open() {
    const selection = selected.current || window.getSelection()?.toString().trim() || '';
    selected.current = '';
    const validation = validateDictionaryQuery(selection);
    setQuery(validation.valid ? validation.query : '');
    setResult(
      validation.valid && findDictionaryEntry(validation.query)
        ? { kind: 'curated', entry: findDictionaryEntry(validation.query)! }
        : null,
    );
    setError(selection && !validation.valid ? validation.message : '');
    setLoading(false);
    dialog.current?.showModal();
    requestAnimationFrame(() => {
      input.current?.focus();
      if (validation.valid) input.current?.select();
    });
  }

  function close() {
    pending.current?.abort();
    setLoading(false);
    dialog.current?.close();
  }

  function showEntry(entry: DictionaryEntry) {
    pending.current?.abort();
    setLoading(false);
    setError('');
    setQuery(entry.term);
    setResult({ kind: 'curated', entry });
  }

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pending.current?.abort();
    const validation = validateDictionaryQuery(query);
    if (!validation.valid) {
      setError(validation.message);
      setResult(null);
      setLoading(false);
      return;
    }
    setError('');
    const entry = findDictionaryEntry(validation.query);
    if (entry) {
      showEntry(entry);
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/translate?q=${encodeURIComponent(validation.query)}`, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(16_000)]),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Lookup failed');
      const parsed = dictionaryResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('Unrecognized dictionary result');
      if (!controller.signal.aborted) setResult(parsed.data);
    } catch {
      if (!controller.signal.aborted)
        setError(
          'Online lookup is unavailable. Try a study term below or open an external dictionary.',
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const suggestions = suggestDictionaryEntries(query);
  const valid = validateDictionaryQuery(query);
  const externalQuery = valid.valid ? valid.query : '';

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`button button-secondary translate-trigger ${className}`}
        aria-haspopup="dialog"
        onPointerDown={captureSelection}
        onClick={open}
      >
        <Languages size={17} aria-hidden="true" />
        <span className="translate-label">{t('Translate')}</span>
      </button>
      <dialog
        ref={dialog}
        className="translate-dialog"
        aria-labelledby="translate-title"
        aria-describedby="translate-description"
        onClose={() => {
          pending.current?.abort();
          trigger.current?.focus();
        }}
        onCancel={() => {
          pending.current?.abort();
          setLoading(false);
        }}
      >
        <div className="translate-dialog-header">
          <div>
            <h2 id="translate-title">{t('Translate and understand')}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label={t('Close translator')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p id="translate-description" className="muted">
          {t(
            'Enter an English word or short phrase for its meaning, English explanation, Azerbaijani explanation and a practical example. You can select text on the page before opening Translate.',
          )}
        </p>
        <form className="translate-search" onSubmit={lookup}>
          <label htmlFor="translate-query">{t('Word or phrase')}</label>
          <div className="translate-search-row">
            <input
              ref={input}
              id="translate-query"
              className="input"
              type="search"
              maxLength={MAX_DICTIONARY_QUERY_LENGTH}
              placeholder={t('For example: onboarding, validation, Sprint Goal')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setError('');
              }}
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={error ? 'translate-error translate-privacy' : 'translate-privacy'}
            />
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? (
                <LoaderCircle className="translate-spinner" size={17} aria-hidden="true" />
              ) : (
                <Search size={17} aria-hidden="true" />
              )}
              {loading ? t('Looking up…') : t('Look up')}
            </button>
          </div>
          <p id="translate-privacy" className="small muted">
            {t(
              'Study terms work offline. Looking up other words sends only your entered phrase to public dictionary and machine translation services.',
            )}
          </p>
        </form>
        {loading && (
          <p role="status" className="translate-status">
            {t('Looking for a definition and Azerbaijani translation…')}
          </p>
        )}
        {error && (
          <p id="translate-error" className="notice" role="alert">
            {t(error)}
          </p>
        )}
        {result?.kind === 'curated' && <CuratedMeaning entry={result.entry} />}
        {result?.kind === 'online' && (
          <section
            className="translate-result"
            aria-label={t('Translation result')}
            aria-live="polite"
          >
            <div className="button-row">
              <h3>{result.term}</h3>
              <span className="badge">{t('Online · General English')}</span>
              {result.partOfSpeech && <span className="small muted">{result.partOfSpeech}</span>}
            </div>
            <p className="small muted">
              {t(
                'Machine translation may miss the subject-specific meaning. Check it against the lesson context.',
              )}
            </p>
            <div className="translate-language-block">
              <h4>{t('English explanation')}</h4>
              <p lang="en">
                {result.definitionEn ?? 'An English definition is unavailable for this phrase.'}
              </p>
            </div>
            <div className="translate-language-block">
              <h4>{t('Azerbaijani meaning · machine translated')}</h4>
              <p lang="az">
                {result.meaningAz ?? 'Tərcümə xidməti bu ifadə üçün nəticə qaytarmadı.'}
              </p>
            </div>
            <div className="translate-language-block">
              <h4>{t('Azerbaijani explanation · machine translated')}</h4>
              <p lang="az">
                {result.explanationAz ?? 'Bu nəticə üçün Azərbaycan dilində izah mövcud deyil.'}
              </p>
            </div>
            {result.example ? (
              <div className="translate-examples">
                <h4>{t('Practical example')}</h4>
                <p lang="en">{result.example.en}</p>
                {result.example.az && <p lang="az">{result.example.az}</p>}
              </div>
            ) : (
              <p className="small muted">
                {t('The dictionary did not provide an example for this result.')}
              </p>
            )}
            <p className="small muted">
              {t('Sources:')}{' '}
              {result.sources.map((source, index) => (
                <span key={source.url}>
                  {index ? ' · ' : ''}
                  <a className="text-link" href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </span>
              ))}
            </p>
          </section>
        )}
        {result?.kind === 'not-found' && (
          <div className="notice" role="status">
            <p>{t(result.message)}</p>
          </div>
        )}
        <div className="translate-suggestions">
          <h3>{query.trim() ? t('Related study terms') : t('Try a study term')}</h3>
          {suggestions.length ? (
            <div className="button-row">
              {suggestions.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="button button-secondary"
                  onClick={() => showEntry(entry)}
                >
                  {entry.term}
                </button>
              ))}
            </div>
          ) : (
            <p className="small muted">
              {t('No matching study term. Try a shorter phrase or another spelling.')}
            </p>
          )}
        </div>
        {externalQuery && (
          <div className="translate-external-links small">
            <a
              className="text-link"
              href={`https://en.wiktionary.org/w/index.php?search=${encodeURIComponent(externalQuery)}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('Open external dictionary')}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
            <a
              className="text-link"
              href={`https://translate.google.com/?sl=en&tl=az&text=${encodeURIComponent(externalQuery)}&op=translate`}
              target="_blank"
              rel="noreferrer"
            >
              {t('Open English → Azerbaijani translation')}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        )}
      </dialog>
    </>
  );
}

function CuratedMeaning({ entry }: { entry: DictionaryEntry }) {
  const t = useUIText();
  return (
    <section className="translate-result" aria-label={t('Translation result')} aria-live="polite">
      <div className="button-row">
        <h3>{entry.term}</h3>
        <span className="badge">{entry.context}</span>
        <span className="badge success">{t('Study dictionary')}</span>
      </div>
      <div className="translate-language-block">
        <h4>{t('English explanation')}</h4>
        <p lang="en">{entry.definitionEn}</p>
      </div>
      <div className="translate-language-block">
        <h4>{t('Azerbaijani meaning')}</h4>
        <p lang="az">
          <strong>{entry.meaningAz}</strong>
        </p>
      </div>
      <div className="translate-language-block">
        <h4>{t('Azerbaijani explanation')}</h4>
        <p lang="az">{entry.explanationAz}</p>
      </div>
      <div className="translate-examples">
        <h4>{t('Practical example')}</h4>
        <p lang="en">{entry.example.en}</p>
        <p lang="az">{entry.example.az}</p>
      </div>
    </section>
  );
}
