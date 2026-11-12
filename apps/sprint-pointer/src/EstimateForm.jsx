import { ClipboardList, LoaderCircle, Sparkles } from 'lucide-react';
import { factors, newWork, scopes, types } from '../lib/work.js';

const examples = [
  { label: 'Form validasiyası', title: 'Qeydiyyat formasına validasiya əlavə et', scope: 'frontend', context: 'E-poçt və şifrə məcburi sahələrdir.' },
  { label: 'Axtarış filtri', title: 'Müştərilər siyahısına axtarış filtri əlavə et', context: 'Ad və status üzrə filtr eyni vaxtda tətbiq olunur.' },
  { label: 'SMS bildirişi', title: 'Sifariş təsdiqində SMS bildirişi göndər', scope: 'backend', factors: ['integration'], context: 'Mövcud SMS provayderindən istifadə olunur.' },
];

export default function EstimateForm({ form, change, submit, pending, error }) {
  const update = (key, value) => change({ ...form, [key]: value });

  function toggle(key) {
    const selected = form.factors.includes(key)
      ? form.factors.filter(item => item !== key)
      : [...form.factors, key];
    update('factors', selected);
  }

  return (
    <section className="card" aria-labelledby="form-heading">
      <div className="card-head">
        <span className="icon-tile"><ClipboardList size={20} /></span>
        <div><h2 id="form-heading">Tapşırıq məlumatları</h2><p>Qiymətləndirmək istədiyiniz işi təsvir edin.</p></div>
      </div>
      <form className="form-content" onSubmit={submit}>
        <fieldset className="form-fields" disabled={pending}>
          <div className="field">
            <div className="label-line"><label htmlFor="title">Tapşırığın başlığı <span className="required">*</span></label><span className="counter">{form.title.length}/180</span></div>
            <input id="title" required minLength={8} maxLength={180} placeholder="Məsələn, sifarişlərə status filtri əlavə et" value={form.title} onChange={event => update('title', event.target.value)} />
          </div>
          <div className="field">
            <div className="label-line"><label htmlFor="context">Əlavə kontekst</label><span className="counter">{form.context.length}/6000</span></div>
            <textarea id="context" rows={4} maxLength={6000} placeholder="Əhatə, biznes qaydaları və ya texniki asılılıqlar…" value={form.context} onChange={event => update('context', event.target.value)} />
          </div>
          <div className="field-pair">
            <div className="field"><label htmlFor="type">İş növü</label><select id="type" value={form.type} onChange={event => update('type', event.target.value)}>{Object.entries(types).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
            <div className="field"><label htmlFor="scope">İşin əhatəsi</label><select id="scope" value={form.scope} onChange={event => update('scope', event.target.value)}>{Object.entries(scopes).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
          </div>
          <fieldset className="factors">
            <legend>Əlavə amillər</legend>
            <div className="factor-grid">{Object.entries(factors).map(([key, value]) => (
              <label className="factor" key={key}>
                <input type="checkbox" checked={form.factors.includes(key)} onChange={() => toggle(key)} />
                {value}
              </label>
            ))}</div>
          </fieldset>
        </fieldset>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button className="button primary estimate" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
          {pending ? 'Qiymətləndirilir…' : 'İşi qiymətləndir'}
        </button>
        <div className="examples"><span>Nümunə seçin</span>{examples.map(({ label, ...example }) => (
          <button type="button" className="chip" disabled={pending} key={label} onClick={() => change({ ...newWork, ...example })}>{label}</button>
        ))}</div>
      </form>
    </section>
  );
}
