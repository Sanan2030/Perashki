'use client';
import { useUIText } from '@/components/use-ui-text';

import { useEffect, useRef, useState } from 'react';
import {
  apiExercises,
  checkApiResult,
  initialSandboxState,
  sandboxRequestSchema,
  sandboxStateSchema,
  type SandboxRequest,
  type SandboxResult,
} from '@/lib/labs/http';

export function ApiLab({ initialExercise = 'read' }: { initialExercise?: string }) {
  const t = useUIText();
  const initial = apiExercises.find((item) => item.id === initialExercise) ?? apiExercises[0];
  const [exerciseId, setExerciseId] = useState(initial.id);
  const exercise = apiExercises.find((item) => item.id === exerciseId)!;
  const [method, setMethod] = useState<SandboxRequest['method']>(initial.starter.method);
  const [path, setPath] = useState(initial.starter.path);
  const [headers, setHeaders] = useState(JSON.stringify(initial.starter.headers, null, 2));
  const [body, setBody] = useState(initial.starter.body);
  const [state, setState] = useState(initialSandboxState);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [sent, setSent] = useState<SandboxRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);

  useEffect(
    () => () => {
      generation.current++;
      pending.current?.abort();
    },
    [],
  );
  function edit() {
    setResult(null);
    setSent(null);
    setError('');
    setFeedback(null);
  }
  function reset(id = exerciseId) {
    generation.current++;
    pending.current?.abort();
    setBusy(false);
    const item = apiExercises.find((entry) => entry.id === id)!;
    setExerciseId(id);
    setMethod(item.starter.method);
    setPath(item.starter.path);
    setHeaders(JSON.stringify(item.starter.headers, null, 2));
    setBody(item.starter.body);
    setState(initialSandboxState());
    edit();
  }

  async function send() {
    let request: SandboxRequest;
    try {
      const parsed = sandboxRequestSchema.safeParse({
        method,
        path,
        headers: JSON.parse(headers),
        body,
      });
      if (!parsed.success) throw new Error('invalid');
      request = parsed.data;
    } catch {
      setError(
        'Use a relative path and a JSON object of string header values. Keep the request within the editor limits.',
      );
      return;
    }
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const current = ++generation.current;
    setBusy(true);
    setError('');
    setFeedback(null);
    setResult(null);
    setSent(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/labs/http`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, state }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
      });
      if (!response.ok) throw new Error('transport');
      const payload = (await response.json()) as SandboxResult;
      const parsedState = sandboxStateSchema.safeParse(payload.state);
      if (!parsedState.success || !payload.response || !Number.isInteger(payload.response.status))
        throw new Error('invalid response');
      if (generation.current !== current) return;
      const next = { ...payload, state: parsedState.data };
      setResult(next);
      setSent(request);
      setState(next.state);
    } catch {
      if (generation.current === current)
        setError(
          'The sandbox request could not complete. Your current fixtures are unchanged; try again or reset.',
        );
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }

  return (
    <section className="card lesson-lab stack" aria-labelledby="api-lab-title">
      <div>
        <h2 id="api-lab-title">{t('API lab')}</h2>
        <p className="small muted">
          {t(
            'Send requests to a simulated orders service through this site. Only synthetic fixtures are used; no external API is contacted. Each tab has separate fixture state, which resets on reload.',
          )}
        </p>
      </div>
      <label className="field-label" htmlFor="api-exercise">
        {t('API exercise')}
      </label>
      <select
        id="api-exercise"
        className="input"
        value={exerciseId}
        disabled={busy}
        onChange={(event) => reset(event.target.value)}
      >
        {apiExercises.map((item) => (
          <option key={item.id} value={item.id}>
            {t(item.title)}
          </option>
        ))}
      </select>
      <p id="api-task">{t(exercise.task)}</p>
      <details>
        <summary>{t('API contract and demo identities')}</summary>
        <p>
          {t(
            'GET /orders or /orders/order-100. POST /orders creates an order. PATCH and DELETE address an order and require If-Match. POST requires an Idempotency-Key. JSON bodies accept only the fields described by the exercise.',
          )}
        </p>
        <p>
          {t('Demo tokens:')} <code>Bearer demo-alice</code>, <code>Bearer demo-bob</code>,{' '}
          <code>Bearer demo-reader</code>
          {t(
            '. Alice owns order-100; Bob owns order-200. The reader token can only read Alice’s orders. Use these fixture tokens, not real credentials.',
          )}
        </p>
        <p>
          {t(
            'The status below is the simulated service response. It is carried by a separate same-origin lab request. This model does not provide real account security, durable storage or network concurrency guarantees.',
          )}
        </p>
      </details>
      <div className="lab-grid">
        <div className="stack">
          <label className="field-label" htmlFor="api-method">
            {t('Request method')}
          </label>
          <select
            id="api-method"
            className="input"
            value={method}
            disabled={busy}
            onChange={(event) => {
              setMethod(event.target.value as SandboxRequest['method']);
              edit();
            }}
          >
            {(['GET', 'POST', 'PATCH', 'DELETE'] as const).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label className="field-label" htmlFor="api-path">
            {t('Request path')}
          </label>
          <input
            id="api-path"
            className="input lab-mono"
            value={path}
            maxLength={200}
            disabled={busy}
            onChange={(event) => {
              setPath(event.target.value);
              edit();
            }}
          />
          <label className="field-label" htmlFor="api-headers">
            {t('Request headers (JSON)')}
          </label>
          <textarea
            id="api-headers"
            className="input lab-editor"
            rows={5}
            maxLength={5000}
            spellCheck={false}
            value={headers}
            disabled={busy}
            onChange={(event) => {
              setHeaders(event.target.value);
              edit();
            }}
          />
          <label className="field-label" htmlFor="api-body">
            {t('Request body (JSON)')}
          </label>
          <textarea
            id="api-body"
            className="input lab-editor"
            rows={5}
            maxLength={6000}
            spellCheck={false}
            value={body}
            disabled={busy}
            aria-describedby="api-task"
            onChange={(event) => {
              setBody(event.target.value);
              edit();
            }}
          />
        </div>
        <div className="stack lab-response">
          <h3>{t('Sandbox response')}</h3>
          {result ? (
            <>
              <p role="status" className="lab-http-status">
                {result.response.status} {result.response.statusText}
              </p>
              <h4>{t('Response headers')}</h4>
              <pre tabIndex={0} aria-label={t('Response headers')}>
                {JSON.stringify(result.response.headers, null, 2)}
              </pre>
              <h4>{t('Response body')}</h4>
              <pre tabIndex={0} aria-label={t('Response body')}>
                {result.response.status === 204
                  ? t('(no content)')
                  : JSON.stringify(result.response.body, null, 2)}
              </pre>
            </>
          ) : (
            <p className="muted">{t('Send a request to inspect its status, headers and body.')}</p>
          )}
          <p className="small muted">
            {t('Demo orders:')} {state.orders.length} {t('· recorded create operations:')}{' '}
            {state.operations.length}
          </p>
          <details>
            <summary>{t('Inspect synthetic order state')}</summary>
            <pre tabIndex={0}>{JSON.stringify(state.orders, null, 2)}</pre>
          </details>
        </div>
      </div>
      <div className="button-row">
        <button className="button button-primary" type="button" disabled={busy} onClick={send}>
          {busy ? t('Sending…') : t('Send request')}
        </button>
        <button className="button button-secondary" type="button" onClick={() => reset()}>
          {t('Reset sandbox')}
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={busy || !result || !sent}
          onClick={() => result && sent && setFeedback(checkApiResult(exercise, sent, result))}
        >
          {t('Check API result')}
        </button>
      </div>
      <details>
        <summary>{t('Show API hint')}</summary>
        <p>{t(exercise.hint)}</p>
      </details>
      {error && (
        <p role="alert" className="notice">
          {t(error)}
        </p>
      )}
      {feedback && (
        <p role="status" className={feedback.correct ? 'notice lab-correct' : 'notice'}>
          {t(feedback.message)}
        </p>
      )}
    </section>
  );
}
