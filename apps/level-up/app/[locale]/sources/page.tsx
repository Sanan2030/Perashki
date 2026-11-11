import { pageMetadata } from '@/lib/page-metadata';
import Link from 'next/link';
import { ExternalLink, BookOpen } from 'lucide-react';
import { sources } from '@/lib/sources';
import { getLocale } from '@/lib/i18n';
export const generateMetadata = pageMetadata('Sources', 'Mənbələr');
export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = getLocale(raw);
  const az = locale === 'az';
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <h1 className="page-title">
          {az ? 'Mənbələr və rəsmi məşq' : 'Sources and official practice'}
        </h1>
        <p className="muted">
          {az
            ? 'Dərslər göndərilən kitablara, rəsmi bələdçilərə, texniki standartlara və əlavə product resurslarına istinad edir. Reyestrdə oxunmuş nəşrlər və bölmələr göstərilir. Sualların izahında əsaslandırıcı mənbələrə istinad edilir.'
            : 'Lessons cite supplied books, official guides, technical standards and supplementary product resources. The register identifies editions and sections reviewed. Question explanations cite supporting sources.'}
        </p>
      </header>
      <div className="notice">
        <BookOpen size={22} />
        <p>
          {az
            ? 'Buradakı suallar orijinal öyrənmə məşqidir. Rəsmi Product Owner Open üçün Scrum.org keçidindən istifadə et. Öyrənmə mövzularının bölgüsü rəsmi imtahan planı kimi təqdim edilmir.'
            : 'Questions here are original learning practice. Use the Scrum.org link for the official Product Owner Open. Learning topic groups are not presented as an official exam blueprint.'}
        </p>
      </div>
      <section className="source-list" aria-label={az ? 'Mənbə reyestri' : 'Source register'}>
        {sources.map((s) => (
          <article id={s.id} key={s.id} className="card source-entry">
            <div className="button-row">
              <span className={`badge ${s.status === 'read' ? 'success' : ''}`}>
                {s.status === 'read'
                  ? az
                    ? 'Oxunub'
                    : 'Read'
                  : az
                    ? 'Mətnə giriş yoxdur'
                    : 'Text unavailable'}
              </span>
              <span className="small muted">{s.checkedAt}</span>
            </div>
            <h2>{s.title}</h2>
            <p className="muted">{s.notes[locale]}</p>
            <a className="text-link" href={s.url} target="_blank" rel="noreferrer">
              {az ? 'Mənbəni aç' : 'Open source'} <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </section>
      <p className="small muted">
        {az
          ? 'Scrum Guide, Kanban Guide və EBM Guide əsasında uyğunlaşdırılmış izahlar CC BY-SA 4.0 ilə paylaşılır; müəlliflər və nəşrlər yuxarıda göstərilib. Kitabın PDF-i saytda yayımlanmır.'
          : 'Adapted Scrum Guide, Kanban Guide and EBM Guide explanations are shared under CC BY-SA 4.0; authors and editions are credited above. The book PDF is not distributed on this site.'}{' '}
        <a className="text-link" href="https://creativecommons.org/licenses/by-sa/4.0/">
          CC BY-SA 4.0
        </a>
      </p>
      <Link href={`/${locale}/lessons?track=pspo1`} className="button button-primary">
        {az ? 'PSPO dərslərinə keç' : 'Explore PSPO lessons'}
      </Link>
    </div>
  );
}
