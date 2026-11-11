import { Play } from 'lucide-react';
import { practiceSets, type PracticeSet } from '@/lib/practice-sets';
import type { Locale, TrackId } from '@/lib/types';

export function PracticeSets({
  locale,
  trackId,
  onStart,
}: {
  locale: Locale;
  trackId: TrackId;
  onStart: (set: PracticeSet, feedback: 'immediate' | 'after-submit') => void;
}) {
  const sets = practiceSets.filter((set) => set.trackId === trackId);
  const az = locale === 'az';
  if (!sets.length) return null;
  return (
    <section className="stack native-practice-sets" aria-labelledby="native-practice-sets-title">
      <div>
        <h2 id="native-practice-sets-title">
          {az ? 'Proqram daxilində sınaqlar' : 'Tests in this app'}
        </h2>
        <p className="muted">
          {az
            ? 'Hər mənbənin testini burada cavablandır, nəticəni və mənbədəki izahları gör. Bu suallar öz sual bankımızdan ayrı saxlanılır.'
            : 'Answer each provider’s test here, save your score and review the source explanations. These questions are kept separate from our own bank.'}
        </p>
      </div>
      <div className="grid-2">
        {sets.map((set) => (
          <article className="card stack" style={{ padding: '1.25rem' }} key={set.id}>
            <span className="badge badge-peach">
              {az ? 'Mənbədən əlavə edilmiş test' : 'Imported provider test'}
            </span>
            <h3>{set.title[locale]}</h3>
            <p>{set.description[locale]}</p>
            <p className="small muted">
              {az ? 'Bank' : 'Bank'}: {set.questionIds.length} · {az ? 'Sınaq' : 'Test'}:{' '}
              {set.testQuestionCount} {az ? 'sual' : 'questions'} · {set.durationMinutes}{' '}
              {az ? 'dəqiqə' : 'minutes'}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => onStart(set, 'after-submit')}
              >
                <Play size={16} aria-hidden="true" />
                {az ? 'Sınağa başla' : 'Start test'}
                <span className="sr-only">: {set.title[locale]}</span>
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onStart(set, 'immediate')}
              >
                {az ? 'İzahlarla öyrən' : 'Study with explanations'}
                <span className="sr-only">: {set.title[locale]}</span>
              </button>
            </div>
            <a href={set.sourceUrl} className="text-link small" target="_blank" rel="noreferrer">
              {az ? 'Orijinal mənbə' : 'Original source'} ↗
            </a>
          </article>
        ))}
      </div>
      <p className="small muted">
        {az
          ? 'Sınaq rejimində izahlar sonda, öyrənmə rejimində hər cavabdan sonra açılır. Öyrənmə rejimi bütün bankı açır. Vaxt və təsadüfi seçim bu proqramın məşq ayarlarıdır; rəsmi imtahan nəticəsi hesablanmır.'
          : 'Test mode reveals explanations after submission; study mode opens the whole bank with feedback after each answer. Timing and random selection are this app’s practice settings; scores are not official exam results.'}
      </p>
    </section>
  );
}
