'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Compass, GraduationCap, Route } from 'lucide-react';
import { useProgress } from '@/components/providers';
import { tracks, getTrack } from '@/lib/tracks';
import { copy, localize } from '@/lib/i18n';
import { levelOrder } from '@/lib/roadmap';
import type { LearningProfile, LevelId, Locale, TrackId } from '@/lib/types';

export function OnboardingView({ locale }: { locale: Locale }) {
  const { progress, ready } = useProgress();
  if (!ready) return <p role="status">{copy[locale].loading}</p>;
  return <OnboardingForm locale={locale} initial={progress.profiles[progress.activeTrack]} />;
}

function OnboardingForm({ locale, initial }: { locale: Locale; initial?: LearningProfile }) {
  const { update } = useProgress();
  const router = useRouter();
  const t = copy[locale];
  const az = locale === 'az';
  const [step, setStep] = useState(0);
  const [trackId, setTrackId] = useState<TrackId>(initial?.trackId ?? 'ba');
  const [currentLevel, setCurrentLevel] = useState<LevelId>(initial?.currentLevel ?? 'zero');
  const [targetLevel, setTargetLevel] = useState<LevelId>(initial?.targetLevel ?? 'junior');
  const [dailyMinutes, setDailyMinutes] = useState(initial?.dailyMinutes ?? 30);
  const career = trackId === 'ba' || trackId === 'po';
  const targets = levelOrder.filter(
    (level) => levelOrder.indexOf(level) > levelOrder.indexOf(currentLevel),
  );
  const validTarget = !career || targets.includes(targetLevel);
  const labels = az
    ? ['İstiqamətini seç', 'Hazırkı səviyyən', 'Hədəfini müəyyən et']
    : ['Choose your direction', 'Your starting point', 'Set your destination'];

  function save() {
    if (!validTarget) return;
    update((p) => ({
      ...p,
      activeTrack: trackId,
      profiles: {
        ...p.profiles,
        [trackId]: {
          trackId,
          currentLevel,
          targetLevel: career ? targetLevel : 'lead',
          dailyMinutes,
        },
      },
    }));
    router.push(`/${locale}/roadmap`);
  }

  return (
    <div className="stack onboarding-wrap">
      <div className="page-heading">
        <h1 className="page-title">{az ? 'Yol xəritəsini qur' : 'Set up your roadmap'}</h1>
      </div>
      <ol className="onboarding-steps" aria-label={az ? 'Plan qurma addımları' : 'Setup steps'}>
        {labels.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? 'step' : undefined}
            className={step >= index ? 'active' : ''}
          >
            <span>{step > index ? <Check size={16} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="card onboarding-card">
        {step === 0 && (
          <fieldset className="stack">
            <legend className="section-title">{labels[0]}</legend>
            <p className="muted">
              {az
                ? 'İstənilən vaxt başqa istiqamətə keçə bilərsən.'
                : 'You can switch tracks at any time.'}
            </p>
            <div className="grid-2">
              {tracks.map((track) => (
                <label
                  className={`choice-card ${trackId === track.id ? 'selected' : ''}`}
                  key={track.id}
                >
                  <input
                    type="radio"
                    name="track"
                    value={track.id}
                    checked={trackId === track.id}
                    onChange={() => setTrackId(track.id)}
                  />
                  <span className="choice-icon">
                    {track.category === 'career' ? (
                      <Compass size={22} />
                    ) : (
                      <GraduationCap size={22} />
                    )}
                  </span>
                  <strong>{localize(track.name, locale)}</strong>
                  <span className="muted">{localize(track.description, locale)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <fieldset className="stack">
            <legend className="section-title">{labels[1]}</legend>
            <p className="muted">
              {az
                ? 'Bilik və təcrübənə ən yaxın səviyyəni seç. Bu, imtahan uyğunluğu qiymətləndirməsi deyil.'
                : 'Choose the closest match to your experience. This is not a certification eligibility assessment.'}
            </p>
            <div className="grid-2">
              {levelOrder.map((level) => (
                <label
                  key={level}
                  className={`choice-card ${currentLevel === level ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="current"
                    value={level}
                    checked={currentLevel === level}
                    onChange={() => {
                      setCurrentLevel(level);
                      const next = levelOrder[levelOrder.indexOf(level) + 1];
                      if (next) setTargetLevel(next);
                    }}
                  />
                  <strong>{t[level]}</strong>
                  <span className="muted">
                    {level === 'zero'
                      ? az
                        ? 'Təməl anlayışlardan başlamaq istəyirəm.'
                        : 'I want to start with the fundamentals.'
                      : level === 'junior'
                        ? az
                          ? 'Dəstək ilə əsas tapşırıqları yerinə yetirirəm.'
                          : 'I deliver foundational work with guidance.'
                        : level === 'mid'
                          ? az
                            ? 'Müstəqil işləyir və mürəkkəb problemləri həll edirəm.'
                            : 'I work independently on complex problems.'
                          : az
                            ? 'Komandalara və strateji qərarlara rəhbərlik edirəm.'
                            : 'I guide teams and strategic decisions.'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {step === 2 && (
          <div className="stack">
            <fieldset className="stack">
              <legend className="section-title">{labels[2]}</legend>
              {career ? (
                <>
                  {targets.length ? (
                    <div className="grid-3">
                      {targets.map((level) => (
                        <label
                          className={`choice-card ${targetLevel === level ? 'selected' : ''}`}
                          key={level}
                        >
                          <input
                            name="target"
                            type="radio"
                            value={level}
                            checked={targetLevel === level}
                            onChange={() => setTargetLevel(level)}
                          />
                          <Route size={22} />
                          <strong>{t[level]}</strong>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p role="status" className="notice">
                      {az
                        ? 'Bu istiqamətdə ən yüksək səviyyədəsən. Sertifikasiya istiqamətini və ya başqa başlanğıc səviyyəsini seç.'
                        : 'You’re already at the highest level in this track. Choose a certification track or a different starting level.'}
                    </p>
                  )}
                </>
              ) : (
                <div className="notice">
                  <GraduationCap size={22} />
                  <strong>{localize(getTrack(trackId).name, locale)}</strong>
                  <p>
                    {az
                      ? 'Sertifikasiya üçün ayrıca mövzu planı və orijinal məşq bankı hazırlanacaq.'
                      : 'Your certification has its own topic roadmap and original practice bank.'}
                  </p>
                </div>
              )}
            </fieldset>
            <label className="field-label" htmlFor="daily-minutes">
              {az ? 'Gündəlik öyrənmə vaxtı' : 'Daily study time'}
            </label>
            <select
              className="input"
              id="daily-minutes"
              value={dailyMinutes}
              onChange={(event) => setDailyMinutes(Number(event.target.value))}
            >
              {[15, 30, 45, 60, 90].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} {t.minutes}
                </option>
              ))}
            </select>
            <p className="muted small">
              {az
                ? 'Təxmini müddətə planlaşdırılan dərslər də daxildir. Bu, fərdi öyrənmə sürətindən asılıdır.'
                : 'Estimates include planned lessons and vary with your learning pace.'}
            </p>
          </div>
        )}
        <div className="onboarding-actions">
          {step > 0 ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              {t.back}
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setStep(step + 1)}
            >
              {t.next}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary"
              onClick={save}
              disabled={!validTarget}
            >
              {az ? 'Yolumu yarat' : 'Build my roadmap'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
