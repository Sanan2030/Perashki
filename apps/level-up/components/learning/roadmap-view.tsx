'use client';

import Link from 'next/link';
import { ArrowRight, Check, CheckCircle2, Circle, Clock3, Layers3, Settings2 } from 'lucide-react';
import { useProgress } from '@/components/providers';
import { modules, lessons, competencies } from '@/lib/catalog';
import { generateRoadmap } from '@/lib/roadmap';
import { copy, localize } from '@/lib/i18n';
import { getTrack } from '@/lib/tracks';
import type { Locale } from '@/lib/types';

export function RoadmapView({ locale }: { locale: Locale }) {
  const { progress, ready, update } = useProgress();
  const t = copy[locale];
  const az = locale === 'az';
  if (!ready) return <p role="status">{t.loading}</p>;
  const profile = progress.profiles[progress.activeTrack];
  if (!profile)
    return (
      <div className="card empty-state">
        <Layers3 size={40} />
        <h1 className="page-title">{az ? 'Yol xəritəsini qur' : 'Set up your roadmap'}</h1>
        <p className="muted">
          {az
            ? 'Səviyyəni və hədəfini seç, fərdi öyrənmə planını gör.'
            : 'Choose your starting point and destination to see your personal learning path.'}
        </p>
        <Link className="button button-primary" href={`/${locale}/onboarding`}>
          {t.start}
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  const roadmap = generateRoadmap(profile, modules, lessons, progress.completedLessons);
  const track = getTrack(profile.trackId);
  const targetCompetency = competencies.find(
    (competency) =>
      competency.trackId === profile.trackId && competency.level === profile.targetLevel,
  );
  return (
    <div className="stack">
      <div className="page-heading heading-with-action">
        <div>
          <h1 className="page-title">{t.roadmap}</h1>
          <p className="muted">
            {localize(track.name, locale)} · {t[profile.currentLevel]} →{' '}
            {track.category === 'career' ? t[profile.targetLevel] : localize(track.name, locale)}
          </p>
        </div>
        <Link href={`/${locale}/onboarding`} className="button button-secondary">
          <Settings2 size={16} />
          {az ? 'Planı dəyiş' : 'Edit my plan'}
        </Link>
      </div>
      <div className="grid-3">
        <div className="card stat-card">
          <Layers3 size={20} />
          <span className="muted">{az ? 'Öyrənmə modulu' : 'Learning modules'}</span>
          <strong>{roadmap.modules.length}</strong>
          <small>
            {roadmap.lessons.length} {az ? 'dərs və kontur' : 'lessons & outlines'}
          </small>
        </div>
        <div className="card stat-card">
          <Clock3 size={20} />
          <span className="muted">{az ? 'Qalan təxmini vaxt' : 'Estimated time remaining'}</span>
          <strong>
            {Math.ceil(roadmap.remainingMinutes / 60)} {az ? 'saat' : 'hours'}
          </strong>
          <small>
            ~{roadmap.estimatedDays} {az ? 'gün' : 'days'} · {profile.dailyMinutes} {t.minutes}/
            {az ? 'gün' : 'day'}
          </small>
        </div>
        <div className="card stat-card">
          <CheckCircle2 size={20} />
          <span className="muted">{t.progress}</span>
          <strong>{roadmap.completionPercent}%</strong>
          <small>
            {roadmap.completedCount} / {roadmap.lessons.length} {az ? 'tamamlanıb' : 'completed'}
          </small>
        </div>
      </div>
      <p className="notice small">
        {az
          ? `${roadmap.publishedCount} tam dərs indi oxumaq üçün hazırdır. Digər mövzular məzmun planıdır və tamamlanmış dərs sayılmır. Vaxt hesabına bütün plan daxildir.`
          : `${roadmap.publishedCount} complete lessons are available now. Other topics are curriculum outlines, not finished lessons. Time estimates cover the full plan.`}
      </p>
      {roadmap.nextLesson && (
        <div className="card next-lesson-banner">
          <div>
            <p className="eyebrow">{az ? 'Növbəti dərs' : 'Next lesson'}</p>
            <h2 className="section-title">{localize(roadmap.nextLesson.title, locale)}</h2>
            <p className="muted">
              {roadmap.nextLesson.minutes} {t.minutes} ·{' '}
              {localize(roadmap.nextLesson.summary, locale)}
            </p>
          </div>
          <Link
            className="button button-primary"
            href={`/${locale}/lessons/${roadmap.nextLesson.id}`}
          >
            {t.continue}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="roadmap-columns">
        <div className="roadmap-timeline">
          {roadmap.modules.map((module, index) => {
            const entries = module.lessonIds
              .map((id) => lessons.find((lesson) => lesson.id === id))
              .filter((lesson) => !!lesson);
            const complete =
              entries.length > 0 &&
              entries.every((lesson) => !!progress.completedLessons[lesson.id]);
            return (
              <section className="roadmap-module" key={module.id}>
                <div
                  className={`roadmap-marker ${complete ? 'is-complete' : ''}`}
                  aria-label={complete ? t.completed : `${az ? 'Modul' : 'Module'} ${index + 1}`}
                >
                  {complete ? <Check size={18} /> : String(index + 1).padStart(2, '0')}
                </div>
                <div className="card stack">
                  <div>
                    <p className="eyebrow">
                      {track.category === 'career' ? `${t[module.level]} · ` : ''}
                      {entries.length} {az ? 'mövzu' : 'topics'}
                    </p>
                    <h2 className="section-title">{localize(module.title, locale)}</h2>
                    <p className="muted">{localize(module.description, locale)}</p>
                  </div>
                  <div className="lesson-rows">
                    {entries.map((lesson) => (
                      <Link
                        href={`/${locale}/lessons/${lesson.id}`}
                        key={lesson.id}
                        className="lesson-row"
                      >
                        {progress.completedLessons[lesson.id] ? (
                          <CheckCircle2 className="success" size={20} />
                        ) : (
                          <Circle size={20} className="muted" />
                        )}
                        <span>
                          <strong>{localize(lesson.title, locale)}</strong>
                          <small className="muted">
                            {lesson.minutes} {t.minutes}
                            {lesson.status === 'planned'
                              ? ` · ${az ? 'Məzmun planı' : 'Curriculum outline'}`
                              : ''}
                          </small>
                        </span>
                        {lesson.status === 'planned' ? (
                          <span className="badge">{t.planned}</span>
                        ) : (
                          <ArrowRight size={17} />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        {targetCompetency ? (
          <aside className="stack">
            <section className="card stack">
              <div>
                <p className="eyebrow">{az ? 'HƏDƏF SƏVİYYƏ' : 'AT YOUR TARGET LEVEL'}</p>
                <h2 className="section-title">
                  {az ? 'Nəyi bacarmalısan?' : 'What should you be able to do?'}
                </h2>
              </div>
              <ul className="checklist">
                {targetCompetency.checklist.map((item) => (
                  <li key={item.id}>
                    <label className="roadmap-skill">
                      <input
                        type="checkbox"
                        checked={progress.assessedSkills.includes(item.id)}
                        onChange={(event) =>
                          update((p) => ({
                            ...p,
                            assessedSkills: event.target.checked
                              ? [...new Set([...p.assessedSkills, item.id])]
                              : p.assessedSkills.filter((id) => id !== item.id),
                          }))
                        }
                      />
                      <span>{localize(item.text, locale)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <Link className="text-link" href={`/${locale}/competencies`}>
                {az ? 'Özünü qiymətləndir' : 'Assess your skills'}
                <ArrowRight size={16} />
              </Link>
            </section>
            <section className="card roadmap-changes">
              <h2 className="section-title">{az ? 'Nə dəyişir?' : 'What changes?'}</h2>
              <p>{targetCompetency.changes[locale]}</p>
            </section>
            <section className="card stack">
              <h2 className="section-title">{az ? 'Müsahibə məşqi' : 'Interview practice'}</h2>
              {targetCompetency.interviews.map((item) => (
                <details key={item.question.en}>
                  <summary>{item.question[locale]}</summary>
                  <p className="muted">{item.answer[locale]}</p>
                </details>
              ))}
            </section>
          </aside>
        ) : (
          <aside className="card stack">
            <h2 className="section-title">{track.name[locale]}</h2>
            <p className="muted">
              {az
                ? 'Dərsləri oxu, mənbələri yoxla və izahlı məşq et. Nəticələrin paneldə saxlanılır.'
                : 'Read lessons, check the sources, and practice with explanations. Your results are saved on the dashboard.'}
            </p>
            <Link
              className="button button-primary"
              href={`/${locale}/practice?track=${profile.trackId}`}
            >
              {az ? 'Biliklərini yoxla' : 'Practice this track'}
            </Link>
            <Link className="text-link" href={`/${locale}/sources`}>
              {az ? 'Mənbələrə bax' : 'Read source notes'}
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
