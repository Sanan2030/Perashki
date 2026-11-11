'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BookOpen, Check, Compass, Flame, GraduationCap } from 'lucide-react';
import {
  learningLessons as lessons,
  learningModules as modules,
  competencies,
} from '@/lib/catalog';
import { getTrack } from '@/lib/tracks';
import type { Locale, TrackId } from '@/lib/types';
import { activityDate, streakDays } from '@/lib/storage';
import { generateRoadmap } from '@/lib/roadmap';
import { dueReviews } from '@/lib/spaced-repetition';
import { useProgress } from './providers';
const AttemptChart = dynamic(() => import('./quiz/attempt-chart').then((m) => m.AttemptChart), {
  ssr: false,
});
const ProgressChart = dynamic(() => import('./progress-chart'), { ssr: false });

export function Dashboard({
  locale,
  independentQuestionIds = [],
}: {
  locale: Locale;
  independentQuestionIds?: string[];
}) {
  const az = locale === 'az';
  const { progress, ready } = useProgress();
  const independentQuestions = new Set(independentQuestionIds);
  const learningAttempts = progress.attempts.filter(
    (attempt) => !attempt.questionIds.some((id) => independentQuestions.has(id)),
  );
  const track = getTrack(progress.activeTrack);
  const profile = progress.profiles[track.id];
  const roadmap = profile
    ? generateRoadmap(profile, modules, lessons, progress.completedLessons)
    : null;
  const available = lessons.filter((l) => l.trackId === track.id && l.status === 'published');
  const next = roadmap
    ? roadmap.nextLesson
    : available.find((l) => !progress.completedLessons[l.id]);
  const selectedModules = roadmap?.modules ?? modules.filter((m) => m.trackId === track.id);
  const completeModules = selectedModules.filter((m) =>
    m.lessonIds.every((id) => progress.completedLessons[id]),
  ).length;
  const streak = streakDays(progress.activity);
  const due = dueReviews(progress.reviews).filter(
    (review) => !independentQuestions.has(review.questionId),
  ).length;
  const attempts = learningAttempts.filter((a) => a.trackId === track.id);
  const scored = attempts.filter((a) => a.total > 0);
  const last = scored.at(-1);
  const relevantTracks = [
    ...new Set([
      progress.activeTrack,
      ...Object.keys(progress.profiles),
      ...learningAttempts.map((a) => a.trackId),
    ]),
  ] as TrackId[];
  const recent = [
    ...Object.entries(progress.completedLessons).flatMap(([id, date]) => {
      const l = lessons.find((item) => item.id === id);
      return l
        ? [
            {
              id: `lesson-${id}`,
              date,
              label: l.title[locale],
              detail: az ? 'Dərs tamamlandı' : 'Lesson completed',
              href: `/${locale}/lessons/${id}`,
            },
          ]
        : [];
    }),
    ...learningAttempts.map((a) => ({
      id: a.id,
      date: a.completedAt,
      label: `${az ? 'Məşq' : 'Practice'}: ${getTrack(a.trackId).name[locale]}`,
      detail: a.total
        ? `${a.score}/${a.total} ${az ? 'düzgün cavab' : 'correct answers'}`
        : az
          ? 'Yazılı refleksiya'
          : 'Written reflection',
      href: `/${locale}/practice#attempt-history`,
    })),
  ]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 5);
  const today = activityDate();
  const todayMinutes = lessons
    .filter(
      (l) =>
        progress.completedLessons[l.id] &&
        activityDate(new Date(progress.completedLessons[l.id])) === today,
    )
    .reduce((sum, l) => sum + l.minutes, 0);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString(az ? 'az-AZ' : 'en-GB', { weekday: 'short' }),
      minutes: lessons
        .filter(
          (l) =>
            progress.completedLessons[l.id] &&
            activityDate(new Date(progress.completedLessons[l.id])) === activityDate(d),
        )
        .reduce((sum, l) => sum + l.minutes, 0),
    };
  });
  const badges = [
    {
      icon: Compass,
      label: az ? 'Yol xəritəsi quruldu' : 'Roadmap created',
      earned: Object.keys(progress.profiles).length > 0,
    },
    {
      icon: BookOpen,
      label: az ? 'İlk modul' : 'First module',
      earned: modules.some((m) => m.lessonIds.every((id) => progress.completedLessons[id])),
    },
    { icon: Flame, label: az ? '7 günlük seriya' : '7-day streak', earned: streak >= 7 },
    {
      icon: GraduationCap,
      label: az ? 'İlk məşq' : 'First practice',
      earned: learningAttempts.length > 0,
    },
  ];
  if (!ready)
    return (
      <div
        className="page-skeleton"
        aria-busy="true"
        aria-label={az ? 'İrəliləyiş yüklənir' : 'Loading progress'}
      >
        <div />
        <div />
        <div />
      </div>
    );
  return (
    <div className="merhele-dashboard stack-lg">
      <header className="page-heading">
        <h1 className="page-title">{az ? 'Panel' : 'Dashboard'}</h1>
      </header>
      <div className="dashboard-top">
        <section className="recommended-card">
          <span className="eyebrow">{az ? 'Tövsiyə olunan dərs' : 'Recommended lesson'}</span>
          <h2>{next?.title[locale] ?? (az ? 'Hədəf seç' : 'Choose a learning goal')}</h2>
          <p>
            {next
              ? `${getTrack(next.trackId).name[locale]} · ${next.minutes} ${az ? 'dəqiqə' : 'minutes'}. ${next.summary[locale]}`
              : az
                ? 'Planı dəyiş və ya başqa istiqamət seç.'
                : 'Edit your plan or choose another track.'}
          </p>
          <div className="button-row">
            <Link
              href={next ? `/${locale}/lessons/${next.id}` : `/${locale}/onboarding`}
              className="button button-gold"
            >
              {next
                ? az
                  ? 'Dərsə davam et'
                  : 'Continue lesson'
                : az
                  ? 'Hədəf seç'
                  : 'Choose a goal'}
            </Link>
            <Link href={`/${locale}/roadmap`} className="button button-outline">
              {az ? 'Yol xəritəsinə bax' : 'View roadmap'}
            </Link>
          </div>
        </section>
        <div className="dashboard-small-grid">
          <section className="card dashboard-small-stat">
            <span>{az ? 'Seriya' : 'Learning streak'}</span>
            <strong>
              {streak} {az ? 'gün' : 'days'}
            </strong>
          </section>
          <section className="card dashboard-small-stat">
            <span>{az ? 'Tamamlanan modul' : 'Completed modules'}</span>
            <strong>
              {completeModules} / {selectedModules.length}
            </strong>
            <p>{track.name[locale]}</p>
          </section>
          <aside className="review-callout">
            <h3>
              {az ? `Təkrar növbəsində ${due} sual var` : `${due} questions are ready for review`}
            </h3>
            <p>
              {az
                ? 'Əvvəl səhv etdiyin suallar aralıqlı təkrarla qayıdır.'
                : 'Missed questions return on a spaced review schedule.'}
            </p>
            <Link href={`/${locale}/practice?mode=review&track=${track.id}`} className="button">
              {az ? 'Təkrara başla' : 'Start reviewing'}
            </Link>
          </aside>
        </div>
      </div>
      <section
        className="card padded"
        aria-label={az ? 'Hazırlıq göstəriciləri' : 'Learning at a glance'}
      >
        <h2>{az ? 'Hazırlıq səviyyəsi' : 'Your learning readiness'}</h2>
        <div className="readiness-grid">
          {relevantTracks.slice(0, 3).map((id) => {
            const tr = getTrack(id);
            const target = progress.profiles[id]?.targetLevel ?? 'junior';
            const skills = competencies
              .filter((c) => c.trackId === id && c.level === target)
              .flatMap((c) => c.checklist);
            const latest = learningAttempts.filter((a) => a.trackId === id && a.total > 0).at(-1);
            const percent =
              tr.category === 'career'
                ? skills.length
                  ? Math.round(
                      (skills.filter((s) => progress.assessedSkills.includes(s.id)).length /
                        skills.length) *
                        100,
                    )
                  : 0
                : latest
                  ? Math.round((latest.score / latest.total) * 100)
                  : 0;
            const written = id === 'pspo3';
            return (
              <div key={id} className="readiness-item">
                <div>
                  <span>{tr.name[locale]}</span>
                  <strong>{written ? '—' : `${percent}%`}</strong>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${percent}%` }} />
                </div>
                <p>
                  {written
                    ? az
                      ? 'Rubrik ilə özünüqiymətləndirmə'
                      : 'Rubric-based reflection'
                    : tr.category === 'career'
                      ? az
                        ? 'Bacarıq siyahısındakı özünüqiymətləndirmən'
                        : 'Your competency self-assessment'
                      : az
                        ? 'Son qiymətləndirilmiş məşqin nəticəsi'
                        : 'Latest scored practice result'}
                </p>
              </div>
            );
          })}
        </div>
        <div className="dashboard-extra-stats" style={{ marginTop: 22 }}>
          <span>
            {lessons.filter((lesson) => progress.completedLessons[lesson.id]).length}{' '}
            {az ? 'tamamlanmış dərs' : 'completed lessons'}
          </span>
          <span>
            {az ? 'Bu gün' : 'Today'}: {todayMinutes} / {profile?.dailyMinutes ?? 30}{' '}
            {az ? 'dəq · dərs vaxtı təxmini' : 'min · estimated lesson time'}
          </span>
          <Link href={`/${locale}/onboarding`} className="text-link">
            {az ? 'Hədəfləri dəyiş' : 'Edit your goals'}
          </Link>
        </div>
      </section>
      <div className="dashboard-pair">
        <section className="card">
          <h2>
            {track.name[locale]} · {az ? 'məşq nəticələri' : 'practice results'}
          </h2>
          {scored.length ? (
            <>
              <AttemptChart attempts={scored.slice(-6)} locale={locale} />
              <Link href={`/${locale}/practice#attempt-history`} className="text-link">
                {az ? 'Bütün cəhdlərə bax' : 'View every attempt'}
              </Link>
            </>
          ) : (
            <div className="empty-state">
              <GraduationCap size={34} />
              <p className="muted">
                {az
                  ? 'İlk məşqindən sonra nəticələrin və inkişafın burada görünəcək.'
                  : 'Your results and progress will appear here after your first practice session.'}
              </p>
              <Link href={`/${locale}/practice`} className="button button-outline">
                {az ? 'Məşqə başla' : 'Start practicing'}
              </Link>
            </div>
          )}
        </section>
        <section className="card">
          <h2>{az ? 'Domen üzrə nəticə' : 'Results by domain'}</h2>
          {last ? (
            <div className="domain-breakdown">
              {Object.entries(last.domainScores).map(([domain, result]) => {
                const percent = Math.round((result.correct / result.total) * 100);
                return (
                  <div key={domain}>
                    <div>
                      <span>{domain.replaceAll('-', ' ')}</span>
                      <span>
                        {percent < 70 && (
                          <span className="badge">{az ? 'Təkrar et' : 'Review'}</span>
                        )}{' '}
                        {percent}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={percent < 70 ? 'weak' : ''}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">
              {az
                ? 'Məşq tamamlandıqdan sonra güclü və zəif sahələrin burada görünəcək.'
                : 'Complete a practice session to see your strengths and areas to revisit.'}
            </p>
          )}
          <Link className="button button-outline" href={`/${locale}/practice#attempt-history`}>
            {az ? 'Zəif sahələr üçün dərslərə bax' : 'Explore lessons for weak areas'}
          </Link>
        </section>
      </div>
      <div className="dashboard-pair">
        <section className="card recent-activity">
          <h2>{az ? 'Son fəaliyyət' : 'Recent activity'}</h2>
          {recent.length ? (
            <ul>
              {recent.map((item) => (
                <li key={item.id}>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </Link>
                  <time dateTime={item.date}>
                    {new Date(item.date).toLocaleDateString(az ? 'az-AZ' : 'en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              {az
                ? 'İlk dərsini tamamla və ya məşqə başla. Atacağın hər addım burada görünəcək.'
                : 'Complete a lesson or try a practice session. Your next small win will appear here.'}
            </p>
          )}
        </section>
        <section className="card">
          <h2>{az ? 'Nişanlar' : 'Milestones'}</h2>
          <div className="dashboard-milestones">
            {badges.map(({ icon: Icon, label, earned }) => (
              <div key={label} className={earned ? 'earned' : ''}>
                <span>{earned ? <Check size={24} /> : <Icon size={24} />}</span>
                <strong>{label}</strong>
                <p>
                  {earned
                    ? az
                      ? 'Tamamlandı'
                      : 'Completed'
                    : az
                      ? 'Tamamlanmayıb'
                      : 'Not completed'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <details className="card padded">
        <summary>{az ? 'Öyrənmə vaxtı · son 7 gün' : 'Study time · last 7 days'}</summary>
        <p className="muted" style={{ marginTop: 15 }}>
          {az
            ? 'Dəqiqələr tamamladığın dərslərin təxmini müddətidir.'
            : 'Minutes are estimates based on the lessons you completed.'}
        </p>
        <ProgressChart data={week} locale={locale} />
      </details>
    </div>
  );
}
