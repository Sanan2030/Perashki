'use client';
import { useUIText, useLocale } from '@/components/use-ui-text';

import { useEffect, useRef, useState } from 'react';
import fixture from '@/data/labs/sql-fixture.json';
import { checkSqlResult, sqlExercises, type SqlResult } from '@/lib/labs/sql';

export function SqlLab({ initialExercise = 'paid-revenue' }: { initialExercise?: string }) {
  const t = useUIText();
  const az = useLocale() === 'az';
  const initial = sqlExercises.find((item) => item.id === initialExercise) ?? sqlExercises[0];
  const [exerciseId, setExerciseId] = useState(initial.id);
  const exercise = sqlExercises.find((item) => item.id === exerciseId)!;
  const [query, setQuery] = useState(initial.starter);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);

  function stop() {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    if (timeout.current) clearTimeout(timeout.current);
  }

  useEffect(
    () => () => {
      generation.current++;
      worker.current?.terminate();
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  function run() {
    stop();
    const current = generation.current;
    setResult(null);
    setError('');
    setFeedback(null);
    setBusy(true);
    function fail(message: string) {
      if (generation.current !== current) return;
      stop();
      setBusy(false);
      setError(message);
    }
    try {
      const instance = new Worker(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/labs/sql-worker.js`);
      worker.current = instance;
      timeout.current = setTimeout(
        () => fail('SQLite could not load in time. Try running again.'),
        15000,
      );
      instance.onmessage = ({ data }) => {
        if (generation.current !== current) return;
        if (data.type === 'executing') {
          if (timeout.current) clearTimeout(timeout.current);
          timeout.current = setTimeout(
            () => fail('Query stopped after 3 seconds. Try a bounded query.'),
            3000,
          );
          return;
        }
        stop();
        setBusy(false);
        if (data.ok)
          setResult({ columns: data.columns, rows: data.rows, truncated: data.truncated });
        else setError(data.error || 'Query failed.');
      };
      instance.onerror = () => fail('SQLite could not run. Reload the lesson and try again.');
      instance.postMessage({ sql: query, fixture });
    } catch {
      fail('This browser could not start the SQL worker.');
    }
  }

  function reset(id = exerciseId) {
    stop();
    setBusy(false);
    setError('');
    setResult(null);
    setFeedback(null);
    setExerciseId(id);
    setQuery(sqlExercises.find((item) => item.id === id)!.starter);
  }

  return (
    <section className="card lesson-lab stack" aria-labelledby="sql-lab-title">
      <div>
        <h2 id="sql-lab-title">{t('SQL lab')}</h2>
        <p className="small muted">
          {t(
            'SQLite runs in your browser on synthetic data. Each run starts with the same read-only dataset. PostgreSQL syntax and plans can differ.',
          )}
        </p>
      </div>
      <label className="field-label" htmlFor="sql-exercise">
        {t('SQL exercise')}
      </label>
      <select
        id="sql-exercise"
        className="input"
        value={exerciseId}
        disabled={busy}
        onChange={(event) => reset(event.target.value)}
      >
        {sqlExercises.map((item) => (
          <option key={item.id} value={item.id}>
            {t(item.title)}
          </option>
        ))}
      </select>
      <p id="sql-task">{t(exercise.task)}</p>
      <details className="lab-dataset">
        <summary>{t('View tables and sample data')}</summary>
        {fixture.tables.map((table) => (
          <div key={table.name} className="stack">
            <h3>{table.name}</h3>
            <p className="small muted">
              {table.columns.map((column) => `${column.name}: ${column.type}`).join(' · ')}
            </p>
            <div
              className="lab-table-scroll"
              tabIndex={0}
              role="region"
              aria-label={az ? `${table.name}: nümunə sətirlər` : `${table.name} fixture rows`}
            >
              <table>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column.name} scope="col">
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, col) => (
                        <td key={col}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </details>
      <label className="field-label" htmlFor="sql-editor">
        {t('SQL query')}
      </label>
      <textarea
        id="sql-editor"
        className="input lab-editor"
        spellCheck={false}
        wrap="off"
        maxLength={8000}
        rows={8}
        value={query}
        disabled={busy}
        aria-describedby="sql-task"
        onChange={(event) => {
          setQuery(event.target.value);
          setResult(null);
          setFeedback(null);
          setError('');
        }}
      />
      <div className="button-row">
        <button
          className="button button-primary"
          type="button"
          onClick={run}
          disabled={busy || !query.trim()}
        >
          {busy ? t('Running SQL…') : t('Run SQL')}
        </button>
        {busy && (
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              stop();
              setBusy(false);
              setError('Query cancelled.');
            }}
          >
            {t('Cancel query')}
          </button>
        )}
        <button className="button button-secondary" type="button" onClick={() => reset()}>
          {t('Reset query')}
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={busy || !result}
          onClick={() => result && setFeedback(checkSqlResult(result, exercise))}
        >
          {t('Check SQL result')}
        </button>
      </div>
      <details>
        <summary>{t('Show SQL hint')}</summary>
        <p>{t(exercise.hint)}</p>
      </details>
      {busy && <p role="status">{t('Running in an isolated SQL worker…')}</p>}
      {error && (
        <p role="alert" className="notice">
          {t(error)}
        </p>
      )}
      {result && (
        <div className="stack" aria-live="polite">
          <p role="status">
            {result.rows.length} {az ? 'sətir' : 'row(s)'}
            {result.truncated ? (az ? ' · nəticə kəsilib' : ' · result truncated') : ''}
          </p>
          <div
            className="lab-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t('SQL results')}
          >
            <table>
              <caption className="sr-only">{t('Query result')}</caption>
              <thead>
                <tr>
                  {result.columns.map((name, index) => (
                    <th key={index} scope="col">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, col) => (
                      <td key={col}>
                        {cell === null ? <span className="muted">NULL</span> : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {feedback && (
        <p role="status" className={feedback.correct ? 'notice lab-correct' : 'notice'}>
          {t(feedback.message)}
        </p>
      )}
    </section>
  );
}
