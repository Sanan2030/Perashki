import { ChartNoAxesColumnIncreasing, CircleHelp, Copy, FileText, Timer } from 'lucide-react';
import { duration, pointFormula, storyPoints } from '../lib/points.js';
import { levels, sources } from '../lib/work.js';

export const exampleHours = [1, 6, 8, 12];

function DetailList({ title, items, empty }) {
  return (
    <div className="detail-list">
      <h3>{title}</h3>
      {items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>{empty}</p>}
    </div>
  );
}

export default function EstimateResult({ result, stale, pending, edit, copy }) {
  return (
    <section className="card result-card" aria-labelledby="result-heading" aria-busy={pending}>
      <div className="card-head">
        <span className="icon-tile"><ChartNoAxesColumnIncreasing size={20} /></span>
        <div><h2 id="result-heading">Qiymətləndirmə nəticəsi</h2><p>Müddət, Story Point və qəbul meyarları.</p></div>
      </div>
      {stale && <p className="alert warning stale" role="status">Forma dəyişib. Aşağıdakı nəticə əvvəlki məlumatlara aiddir. Yenidən qiymətləndirin.</p>}
      {pending ? <div className="empty" role="status"><Timer size={32} /><h3>İş qiymətləndirilir…</h3><p>Nəticə hazır olduqda burada görünəcək.</p></div>
        : result ? (
          <div className="result-content">
            <div className="result-heading"><h3>{result.title}</h3><span className="source">{sources[result.source]}</span></div>
            <div className="metrics">
              <div className="metric"><span>Təxmini müddət</span><strong>{result.hours} <small>saat</small></strong><span>{duration(result.hours)} · {result.minHours}–{result.maxHours} saat interval</span></div>
              <div className="metric point"><span>Story Point</span><strong>{storyPoints(result.hours)}</strong><span>{pointFormula(result.hours)}</span></div>
            </div>
            <dl className="level-row"><div><dt>Çətinlik</dt><dd>{levels[result.difficulty]}</dd></div><div><dt>Təxminə əminlik</dt><dd>{levels[result.confidence]}</dd></div></dl>
            <div className="field"><label htmlFor="description">İşin izahı</label><textarea id="description" rows={4} value={result.description} onChange={event => edit({ description: event.target.value })} /></div>
            <div className="field"><label htmlFor="criteria">Qəbul meyarları <span className="muted">(hər sətirdə bir meyar)</span></label><textarea id="criteria" rows={5} value={result.criteria.join('\n')} onChange={event => edit({ criteria: event.target.value.split('\n') })} /></div>
            <div className="details">
              <DetailList title="Qiymətləndirmənin səbəbləri" items={result.reasons} />
              <DetailList title="Fərziyyələr" items={result.assumptions} empty="Əlavə fərziyyə göstərilməyib." />
              <DetailList title="Dəqiqləşdirmə sualları" items={result.questions} empty="Əlavə sual göstərilməyib." />
            </div>
            <div className="copy-actions">
              <button className="button secondary" onClick={() => copy('point')}><Copy size={16} /> Story Point-i kopyala</button>
              <button className="button secondary" onClick={() => copy('details')}><FileText size={16} /> İzahı və meyarları kopyala</button>
              <button className="button primary" onClick={() => copy('full')}><Copy size={16} /> Bütün nəticəni kopyala</button>
            </div>
          </div>
        ) : (
          <div className="empty">
            <div className="illustration" aria-hidden="true">
              <span className="illustration-bars"><i /><i /><i /><i /></span>
              <span className="illustration-clock"><Timer size={23} /></span>
            </div>
            <h3>İlk qiymətləndirmənizi hazırlayın</h3>
            <p>Tapşırığın başlığını daxil edib qiymətləndirin. İşin izahı, meyarları və Story Point burada görünəcək.</p>
          </div>
        )}
      <div className="rule">
        <div className="rule-heading"><CircleHelp size={17} /><h3>Saatdan Story Point-ə</h3></div>
        <p>8 saatdan aşağı × 0.1 · 8 saat və yuxarı ÷ 8</p>
        <div className="rule-examples">{exampleHours.map(hours => <span key={hours}>{hours} saat <b>→</b> <strong>{storyPoints(hours)}</strong></span>)}</div>
      </div>
    </section>
  );
}
