'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { Locale } from '@/lib/types';
export default function ProgressChart({
  data,
  locale,
}: {
  data: { day: string; minutes: number }[];
  locale: Locale;
}) {
  return (
    <div
      className="progress-chart"
      role="img"
      aria-label={
        locale === 'az'
          ? 'Son yeddi günün öyrənmə dəqiqələri'
          : 'Study minutes over the last seven days'
      }
    >
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97757" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#d97757" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            dy={8}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              color: 'var(--ink)',
            }}
            formatter={(value) => [
              `${value} ${locale === 'az' ? 'dəq' : 'min'}`,
              locale === 'az' ? 'Öyrənmə' : 'Learning',
            ]}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="#d97757"
            strokeWidth={2.5}
            fill="url(#studyGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
