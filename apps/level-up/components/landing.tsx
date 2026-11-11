'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, CircleCheck } from 'lucide-react';
import { lessons, modules } from '@/lib/catalog';
import { tracks } from '@/lib/tracks';
import { generateRoadmap, levelOrder } from '@/lib/roadmap';
import { copy } from '@/lib/i18n';
import type { LevelId, Locale, TrackId } from '@/lib/types';
import { useProgress } from './providers';

export function Landing({ locale }: { locale: Locale }) {
  const az = locale === 'az';
  const t = copy[locale];
  const router = useRouter();
  const { ready, update } = useProgress();
  const [category, setCategory] = useState<'ba' | 'po' | 'iiba' | 'scrum'>('ba');
  const [current, setCurrent] = useState<LevelId>('zero');
  const [target, setTarget] = useState<LevelId>('mid');
  const [cert, setCert] = useState<TrackId>('ecba');
  const career = category === 'ba' || category === 'po';
  const trackId = career ? category : cert;
  const targetOptions = levelOrder.filter(
    (l) => levelOrder.indexOf(l) > levelOrder.indexOf(current),
  );
  const validTarget = career
    ? targetOptions.includes(target)
      ? target
      : (targetOptions[0] ?? 'lead')
    : 'lead';
  const roadmap = generateRoadmap(
    { trackId, currentLevel: current, targetLevel: validTarget, dailyMinutes: 30 },
    modules,
    lessons,
  );
  const groups = [...new Set(roadmap.modules.map((m) => m.level))];
  function choose(value: typeof category) {
    setCategory(value);
    if (value === 'iiba') setCert('ecba');
    if (value === 'scrum') setCert('pspo1');
  }
  function save() {
    update((p) => ({
      ...p,
      activeTrack: trackId,
      profiles: {
        ...p.profiles,
        [trackId]: {
          trackId,
          currentLevel: current,
          targetLevel: validTarget,
          dailyMinutes: p.profiles[trackId]?.dailyMinutes ?? 30,
        },
      },
    }));
    router.push(`/${locale}/roadmap`);
  }
  return (
    <div className="merhele-landing">
      <section className="landing-hero">
        <div className="landing-intro">
          <h1>{az ? 'Öyrənmə yol xəritəsini qur' : 'Build your learning roadmap'}</h1>
          <p>
            {az
              ? 'Karyera və ya sertifikat istiqamətini, hazırkı səviyyəni və hədəfi seç.'
              : 'Choose a career or certification track, then set your current level and target.'}
          </p>
        </div>
        <section
          className="card path-builder"
          aria-label={az ? 'Fərdi yol xəritəsi qur' : 'Build your personal roadmap'}
        >
          <fieldset>
            <legend>1 · {az ? 'İSTİQAMƏT' : 'DIRECTION'}</legend>
            <div className="pill-options">
              {(
                [
                  ['ba', 'IT Business Analyst'],
                  ['po', 'Product Owner'],
                  ['iiba', az ? 'IIBA sertifikatları' : 'IIBA certifications'],
                  ['scrum', 'Scrum.org PSPO'],
                ] as const
              ).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  className={category === id ? 'selected' : ''}
                  aria-pressed={category === id}
                  onClick={() => choose(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>2 · {az ? 'HAZIRKI SƏVİYYƏN' : 'YOUR CURRENT LEVEL'}</legend>
            <div className="pill-options">
              {(['zero', 'junior', 'mid'] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  className={current === level ? 'selected' : ''}
                  aria-pressed={current === level}
                  onClick={() => setCurrent(level)}
                >
                  {t[level]}
                  {level !== 'zero' && career ? ` ${category.toUpperCase()}` : ''}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>3 · {az ? 'HƏDƏFİN' : 'YOUR DESTINATION'}</legend>
            <div className="pill-options">
              {career
                ? targetOptions.map((level) => (
                    <button
                      type="button"
                      key={level}
                      className={validTarget === level ? 'selected' : ''}
                      aria-pressed={validTarget === level}
                      onClick={() => setTarget(level)}
                    >
                      {t[level]} {category.toUpperCase()}
                    </button>
                  ))
                : tracks
                    .filter((tr) =>
                      category === 'iiba'
                        ? ['ecba', 'ccba', 'cbap'].includes(tr.id)
                        : tr.id.startsWith('pspo'),
                    )
                    .map((tr) => (
                      <button
                        type="button"
                        key={tr.id}
                        className={cert === tr.id ? 'selected' : ''}
                        aria-pressed={cert === tr.id}
                        onClick={() => setCert(tr.id)}
                      >
                        {tr.name[locale]}
                      </button>
                    ))}
            </div>
          </fieldset>
          <div className="roadmap-preview">
            <div className="preview-heading">
              <h2>{az ? 'Yol xəritəsi önizləməsi' : 'Your roadmap preview'}</h2>
              <span>
                {roadmap.modules.length} {az ? 'modul' : 'modules'} ·{' '}
                {Math.ceil(roadmap.totalMinutes / 60)} {az ? 'saat' : 'hours'}
              </span>
            </div>
            {groups.slice(0, 3).map((level, index) => (
              <div className="preview-stage" key={level}>
                <span>{index + 1}</span>
                <div>
                  <strong>
                    {career
                      ? `${t[level]} ${category.toUpperCase()}`
                      : tracks.find((tr) => tr.id === trackId)?.name[locale]}
                  </strong>
                  <div>
                    {roadmap.modules
                      .filter((m) => m.level === level)
                      .slice(0, 3)
                      .map((m) => (
                        <span key={m.id}>{m.title[locale]}</span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button-primary builder-submit"
            onClick={save}
            disabled={!ready}
          >
            {az ? 'Yol xəritəmi yarat' : 'Build my roadmap'}
            <ArrowRight size={18} />
          </button>
        </section>
      </section>
      <section id="how" className="landing-section landing-white">
        <div className="landing-section-inner">
          <h2>{az ? 'Necə işləyir' : 'How it works'}</h2>
          <div className="landing-steps">
            {(az
              ? [
                  [
                    'Səviyyəni seç',
                    'Hazırkı nöqtəni və hədəfi müəyyən et. Sənə uyğun bacarıq fərqini gör.',
                  ],
                  [
                    'Mövzu-mövzu öyrən',
                    'Hər dərsdə nəzəriyyə, layihə nümunəsi, diaqram və praktik tapşırıq bir yerdədir.',
                  ],
                  [
                    'Quiz ilə yoxla',
                    'Məşqlər və mövzu drilləri ilə zəif sahələrini tap, aralıqlı təkrarla biliklərini möhkəmləndir.',
                  ],
                ]
              : [
                  [
                    'Choose your level',
                    'Select a track, current level and target to generate an ordered study plan.',
                  ],
                  [
                    'Learn topic by topic',
                    'Open lessons with explanations, project examples, diagrams and exercises.',
                  ],
                  [
                    'Review quiz results',
                    'Use domain drills, answer explanations and spaced review to revisit mistakes.',
                  ],
                ]
            ).map(([title, body], i) => {
              const Icon = [ChartNoAxesColumnIncreasing, BookOpen, CircleCheck][i];
              return (
                <article key={title}>
                  <div>
                    <span>
                      <Icon size={21} />
                    </span>
                    <strong>0{i + 1}</strong>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="landing-section">
        <div className="landing-section-inner lesson-structure">
          <div>
            <h2>{az ? 'Dərsin quruluşu' : 'Lesson structure'}</h2>
            <Link className="button button-outline" href={`/${locale}/lessons/stakeholder-mapping`}>
              {az ? 'Nümunə dərsə bax' : 'Explore a sample lesson'}
            </Link>
          </div>
          <ol className="card">
            {(az
              ? [
                  'Öyrənmə məqsədləri',
                  'Niyə vacibdir: real kontekst',
                  'Sadə dildə nəzəriyyə',
                  'Layihə nümunəsi',
                  'Diaqram və interaktiv izah',
                  'Tipik səhvlər və yaxşı təcrübələr',
                  'Praktik tapşırıq və nümunə həll',
                  'Mini-quiz və bir səhifəlik xülasə',
                ]
              : [
                  'Learning objectives',
                  'Context',
                  'Theory',
                  'Project example',
                  'Diagram and interactive explanation',
                  'Common mistakes and better practices',
                  'Practice exercise and worked solution',
                  'Mini-quiz and one-page summary',
                ]
            ).map((text, i) => (
              <li key={text}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="certifications" className="landing-section certification-section">
        <div className="landing-section-inner">
          <h2>{az ? 'Sertifikat hazırlığı' : 'Certification preparation'}</h2>
          <p className="section-intro">
            {az
              ? 'Hər sertifikat üçün öyrənmə istiqaməti, mövzu məşqləri və şəffaf mənbə qeydləri. Rəsmi formatlı sınaqlar yoxlanmış qaydalar və kifayət qədər sual tələb edir.'
              : 'A learning path, topic practice, and transparent source notes for each certification. Full-format mocks require verified rules and enough unique questions.'}
          </p>
          <div className="certification-grid">
            {tracks
              .filter((tr) => tr.category === 'certification')
              .map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => {
                    update((p) => ({ ...p, activeTrack: tr.id }));
                    router.push(`/${locale}/lessons?track=${tr.id}`);
                  }}
                >
                  <span>
                    <strong>{tr.name[locale]}</strong>
                    <small className={tr.id.startsWith('pspo') ? 'scrum' : 'iiba'}>
                      {tr.id.startsWith('pspo') ? 'Scrum.org' : 'IIBA'}
                    </small>
                  </span>
                  <p>
                    {az
                      ? 'Dərslər · orijinal suallar · vaxtlı məşq'
                      : 'Lessons · original questions · timed practice'}
                  </p>
                </button>
              ))}
          </div>
          <p className="certification-disclaimer">
            {az
              ? 'Suallar orijinal və təcrübə üçündür. Onlar real imtahan sualları deyil.'
              : 'All questions are original educational practice. They are not real exam questions.'}{' '}
            <Link href={`/${locale}/sources`}>
              {az ? 'Mənbə qeydlərinə bax' : 'Read the source notes'}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
