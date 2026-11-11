'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  BriefcaseBusiness,
  Lightbulb,
  MessageCircle,
  PackageCheck,
  Wrench,
} from 'lucide-react';
import { useProgress } from '@/components/providers';
import { competencies } from '@/lib/catalog';
import { copy, localize } from '@/lib/i18n';
import { getTrack } from '@/lib/tracks';
import type { Locale } from '@/lib/types';

export function CompetencyView({ locale }: { locale: Locale }) {
  const { progress, ready, update } = useProgress();
  const [selectedTrack, setTrackId] = useState<'ba' | 'po' | null>(null);
  const [selectedLevel, setLevel] = useState<'junior' | 'mid' | 'lead' | null>(null);
  const trackId = selectedTrack ?? (progress.activeTrack === 'po' ? 'po' : 'ba');
  const target = progress.profiles[trackId]?.targetLevel;
  const level = selectedLevel ?? (target && target !== 'zero' ? target : 'junior');
  const t = copy[locale];
  const az = locale === 'az';
  const competency = competencies.find(
    (entry) => entry.trackId === trackId && entry.level === level,
  );
  if (!ready) return <p role="status">{t.loading}</p>;
  if (!competency)
    return (
      <p role="status">
        {az ? 'Bu səviyyə üçün məlumat hazırlanır.' : 'This competency profile is being prepared.'}
      </p>
    );
  const checked = competency.checklist.filter((item) =>
    progress.assessedSkills.includes(item.id),
  ).length;
  const readiness = competency.checklist.length
    ? Math.round((checked / competency.checklist.length) * 100)
    : 0;
  const sections = [
    {
      title: az ? 'Məsuliyyətlər və gözləntilər' : 'Responsibilities & expectations',
      items: competency.responsibilities,
      icon: BriefcaseBusiness,
    },
    {
      title: az ? 'Texniki bacarıqlar' : 'Hard skills',
      items: competency.hardSkills,
      icon: Lightbulb,
    },
    {
      title: az ? 'Ünsiyyət və şəxsi bacarıqlar' : 'Soft skills',
      items: competency.softSkills,
      icon: MessageCircle,
    },
    { title: az ? 'Alətlər' : 'Tools', items: competency.tools, icon: Wrench },
    {
      title: az ? 'İş nəticələri' : 'Deliverables',
      items: competency.deliverables,
      icon: PackageCheck,
    },
  ];
  return (
    <div className="stack">
      <div className="page-heading">
        <h1 className="page-title">{t.competencies}</h1>
      </div>
      <div className="filter-bar">
        <label className="field-label">
          {az ? 'İstiqamət' : 'Track'}
          <select
            className="input"
            value={trackId}
            onChange={(event) => setTrackId(event.target.value as 'ba' | 'po')}
          >
            {(['ba', 'po'] as const).map((id) => (
              <option key={id} value={id}>
                {localize(getTrack(id).name, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          {az ? 'Səviyyə' : 'Level'}
          <select
            className="input"
            value={level}
            onChange={(event) => setLevel(event.target.value as typeof level)}
          >
            {(['junior', 'mid', 'lead'] as const).map((id) => (
              <option key={id} value={id}>
                {t[id]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="card competency-intro">
        <div>
          <p className="eyebrow">{localize(getTrack(trackId).name, locale)}</p>
          <h2 className="section-title">{localize(competency.title, locale)}</h2>
          <p className="muted">{localize(competency.changes, locale)}</p>
        </div>
        <div className="readiness-number">
          <strong>{readiness}%</strong>
          <span>{az ? 'özünüqiymətləndirmə' : 'self-assessed readiness'}</span>
        </div>
      </section>
      <div className="grid-2">
        {sections.map(({ title, items, icon: Icon }) => (
          <section className="card stack" key={title}>
            <h2 className="section-title icon-title">
              <Icon size={20} />
              {title}
            </h2>
            <ul className="content-list">
              {items.map((item, index) => (
                <li key={index}>{localize(item, locale)}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="card stack">
        <div>
          <h2 className="section-title">{az ? 'Özünü qiymətləndir' : 'Assess yourself'}</h2>
          <p className="muted">
            {az
              ? 'Bu bacarığı real və ya nümunə layihədə nümayiş etdirə bilirsənsə, işarələ. Bu nəticə sertifikasiya uyğunluğunu və ya imtahan nəticəsini təsdiqləmir.'
              : 'Check a skill when you can demonstrate it in a real or sample project. This result does not establish certification eligibility or predict an exam result.'}
          </p>
        </div>
        <div className="skill-checks">
          {competency.checklist.map((item) => (
            <label className="skill-check" key={item.id}>
              <input
                type="checkbox"
                checked={progress.assessedSkills.includes(item.id)}
                onChange={(event) => {
                  const selected = event.target.checked;
                  update((p) => ({
                    ...p,
                    assessedSkills: selected
                      ? Array.from(new Set([...p.assessedSkills, item.id]))
                      : p.assessedSkills.filter((id) => id !== item.id),
                  }));
                }}
              />
              <span>{localize(item.text, locale)}</span>
            </label>
          ))}
        </div>
        <div>
          <div className="progress-label">
            <span>
              {checked} / {competency.checklist.length} {az ? 'bacarıq' : 'skills'}
            </span>
            <strong>{readiness}%</strong>
          </div>
          <progress
            className="progress-bar"
            value={readiness}
            max={100}
            aria-label={az ? 'Özünüqiymətləndirmə nəticəsi' : 'Self-assessment result'}
          />
        </div>
      </section>
      <section className="card stack">
        <h2 className="section-title icon-title">
          <CheckCircle2 size={20} />
          {az ? 'Müsahibəyə hazırlaş' : 'Prepare for interviews'}
        </h2>
        <p className="muted">
          {az
            ? 'Əvvəl öz cavabını formalaşdır, sonra nümunəni aç. Bunlar öyrənmə nümunələridir.'
            : 'Form your own answer first, then open the example. These are educational examples.'}
        </p>
        <div className="interview-list">
          {competency.interviews.map((interview, index) => (
            <details key={index}>
              <summary>{localize(interview.question, locale)}</summary>
              <p>{localize(interview.answer, locale)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
