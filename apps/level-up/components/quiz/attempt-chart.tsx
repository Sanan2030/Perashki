'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Locale, QuizAttempt } from '@/lib/types';

export function AttemptChart({ attempts, locale }: { attempts: QuizAttempt[]; locale: Locale }) {
  const points = attempts
    .filter((attempt) => attempt.total > 0)
    .slice(-20)
    .map((attempt, index) => ({
      attempt: index + 1,
      score: Math.round((attempt.score / attempt.total) * 100),
      date: new Date(attempt.completedAt).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB'),
    }));

  if (!points.length) return null;

  return (
    <figure style={{ margin: '0 0 1.5rem', minWidth: 0 }}>
      <figcaption className="muted" style={{ fontSize: '.85rem', marginBottom: '.75rem' }}>
        {locale === 'az'
          ? 'Son məşqlərdə düzgün cavab faizi'
          : 'Correct-answer trend across recent sessions'}
      </figcaption>
      <div style={{ height: 210, width: '100%', minWidth: 0 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line, #e7e3de)" strokeDasharray="3 3" />
            <XAxis
              dataKey="attempt"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted, #6a6965)', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted, #6a6965)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--line, #e7e3de)',
                borderRadius: 12,
                color: 'var(--ink, #292a27)',
              }}
              formatter={(value) => [
                `${value}%`,
                locale === 'az' ? 'Düzgün cavab' : 'Correct answers',
              ]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent, #c6664a)"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--accent, #c6664a)' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="muted" style={{ fontSize: '.8rem' }}>
        {locale === 'az'
          ? 'Məşq bölməsində hər sessiyanın dəqiq nəticəsinə baxa bilərsən.'
          : 'See the Practice section for exact results for each session.'}
      </p>
    </figure>
  );
}
