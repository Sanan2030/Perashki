import { pageMetadata } from '@/lib/page-metadata';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { lessons } from '@/lib/catalog';
import { getQuestions } from '@/lib/assessments';
import { scrumCompetencies } from '@/lib/study-guide';
import { getLocale } from '@/lib/i18n';
import { uiText } from '@/lib/ui-text';
import studyGuideAz from '@/data/i18n/study-guide-az.json';
export const generateMetadata = pageMetadata(
  'PSPO study guide and competency map',
  'PSPO öyrənmə bələdçisi və competency xəritəsi',
);
export default async function StudyGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const az = locale === 'az';
  const t = (text: string) => uiText(text, locale);
  const description = (id: string, en: string) =>
    az ? ((studyGuideAz as Record<string, string>)[id] ?? en) : en;
  const questions = getQuestions();
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <h1 className="page-title">{t('PSPO study guide')}</h1>
        <p className="muted">
          {t(
            'Follow the five Professional Scrum Competencies and their 28 focus areas. Use the lessons as starting points, practice a decision, then explain why each alternative helps or harms the product.',
          )}
        </p>
      </header>
      <div className="notice">
        <BookOpen size={22} />
        <p>
          {t(
            'This is an editorial study map based on the official competency text supplied by the user. It is a professional development framework, not a verified exam blueprint or a guarantee of passing.',
          )}
        </p>
      </div>
      <section className="grid-3" aria-label={t('Suggested study sequence')}>
        {[
          [
            '01',
            'Build the foundation',
            'Start with empiricism, accountabilities, events, artifacts and Done. Separate Scrum requirements from optional techniques.',
            `/${locale}/lessons/pspo1-empiricism`,
          ],
          [
            '02',
            'Apply product judgment',
            'Compare value, risk and evidence in strategy, discovery, stakeholder and flow scenarios.',
            `/${locale}/lessons/pspo2-discovery`,
          ],
          [
            '03',
            'Review the reasoning',
            'Practice, read every option explanation, revisit mistakes and return to the cited source section.',
            `/${locale}/practice?track=pspo2`,
          ],
        ].map(([n, title, text, href]) => (
          <article className="card stack" key={n}>
            <span className="eyebrow">
              {az ? 'ADDIM' : 'STEP'} {n}
            </span>
            <h2 className="section-title">{t(title)}</h2>
            <p className="muted">{t(text)}</p>
            <Link className="text-link" href={href}>
              {t('Continue')}
              <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </section>
      <section className="card stack">
        <h2 className="section-title">{t('Choose a practice session')}</h2>
        <p className="muted">
          {t(
            'Choose 5–100 questions, a difficulty and a response format. Use unseen-question filtering for new practice, or mistake review to revisit previous attempts. Timed practice remains available when a full official-format mock cannot be verified.',
          )}
        </p>
        <div className="button-row">
          {(['pspo1', 'pspo2', 'pspo3'] as const).map((track, index) => (
            <Link
              key={track}
              className="button button-secondary"
              href={`/${locale}/practice?track=${track}`}
            >
              PSPO {['I', 'II', 'III'][index]} ·{' '}
              {questions.filter((q) => q.trackId === track).length} {az ? 'sual' : 'questions'}
            </Link>
          ))}
        </div>
      </section>
      <nav className="study-navigation" aria-label={t('Competency groups')}>
        {scrumCompetencies.map((g, index) => (
          <a className="button button-outline" key={g.id} href={`#${g.id}`}>
            {index + 1}. {g.title}
          </a>
        ))}
      </nav>
      {scrumCompetencies.map((group, index) => (
        <section className="card stack study-group" id={group.id} key={group.id}>
          <header>
            <div className="study-group-header">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2 className="section-title">{group.title}</h2>
            </div>
            <p className="muted">{description(group.id, group.description)}</p>
          </header>
          {group.areas.map((area) => (
            <article className="study-focus" key={area.id}>
              <h3>{area.title}</h3>
              <p className="muted">{description(area.id, area.description)}</p>
              <div>
                {area.lessonIds.map((id) => {
                  const lesson = lessons.find((l) => l.id === id && l.status === 'published');
                  return lesson ? (
                    <Link className="text-link" key={id} href={`/${locale}/lessons/${id}`}>
                      <CheckCircle2 size={14} />
                      {lesson.title[locale]}
                    </Link>
                  ) : null;
                })}
              </div>
            </article>
          ))}
        </section>
      ))}
      <div className="card stack">
        <h2 className="section-title">{t('Scenario review checklist')}</h2>
        <ul>
          <li>
            {t('Identify the purpose and accountability involved before choosing an action.')}
          </li>
          <li>
            {t('State which evidence would change your decision in an ambiguous product scenario.')}
          </li>
          <li>
            {t('Keep the Definition of Done, self-management and transparent trade-offs visible.')}
          </li>
          <li>{t('Use the citations to inspect a rule; use original practice to apply it.')}</li>
        </ul>
        <div className="button-row">
          <Link className="text-link" href={`/${locale}/sources#scrum-competencies-2026`}>
            {t('Competency source and reading notes')}
            <ArrowRight size={15} />
          </Link>
          <a
            className="text-link"
            href="https://www.scrum.org/open-assessments/product-owner-open"
            target="_blank"
            rel="noreferrer"
          >
            Official Product Owner Open ↗
          </a>
        </div>
      </div>
    </div>
  );
}
