'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@/lib/types';
export function Diagram({
  chart,
  locale = 'az',
  title,
}: {
  chart: string;
  locale?: Locale;
  title?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'neutral',
          flowchart: { htmlLabels: false },
          fontFamily: 'sans-serif',
        });
        const { svg } = await mermaid.render(`diagram${id}`, chart);
        if (active && host.current) host.current.innerHTML = svg;
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [chart, id]);
  return (
    <figure className="diagram-block">
      <figcaption>◇ {title ?? (locale === 'az' ? 'Anlayış xəritəsi' : 'Concept map')}</figcaption>
      {failed ? (
        <pre>
          <code>{chart}</code>
        </pre>
      ) : (
        <div
          ref={host}
          className="diagram-canvas"
          role="img"
          aria-label={
            title ??
            (locale === 'az' ? 'Öyrənmə anlayışlarının diaqramı' : 'Learning concept diagram')
          }
        >
          <p className="muted">{locale === 'az' ? 'Diaqram yüklənir…' : 'Loading diagram…'}</p>
        </div>
      )}
    </figure>
  );
}
