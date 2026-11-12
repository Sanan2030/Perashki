import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator, ChevronRight, CircleHelp, History, Layers3, Plus, Trash2, X } from 'lucide-react';
import '@fontsource-variable/inter';
import { duration, pointFormula, storyPoints } from '../lib/points.js';
import { copyText, newWork, normalizeWork, sources } from '../lib/work.js';
import EstimateForm from './EstimateForm.jsx';
import EstimateResult from './EstimateResult.jsx';
import { readHistory, saveHistory } from './history.js';
import './styles.css';
import '../../../public/workspace-theme.css';

const navigation = {
  estimate: { label: 'Qiymətləndirici', icon: Calculator, title: 'İş qiymətləndiricisi', description: 'Tapşırığı təsvir edin və Azure DevOps üçün qiymətləndirmə hazırlayın.' },
  history: { label: 'Tarixçə', icon: History, title: 'Qiymətləndirmə tarixçəsi', description: 'Bu brauzerdə saxlanan son 20 qiymətləndirmə.' },
  help: { label: 'Necə işləyir?', icon: CircleHelp, title: 'Necə işləyir?', description: 'Müddət və Story Point hesablamasının qaydaları.' },
};

function HistoryPage({ entries, open, clear }) {
  const format = new Intl.DateTimeFormat('az-AZ', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <section className="card history-card" aria-label="Saxlanmış qiymətləndirmələr">
      <div className="history-head"><h2>Saxlanmış qiymətləndirmələr</h2><button className="button secondary" disabled={!entries.length} onClick={clear}><Trash2 size={16} /> Tarixçəni təmizlə</button></div>
      {entries.length ? <ul className="history-list">{entries.map(entry => (
        <li key={entry.id}>
          <button className="history-entry" onClick={() => open(entry)}>
            <div><strong>{entry.result.title}</strong><time dateTime={entry.createdAt}>{format.format(new Date(entry.createdAt))}</time></div>
            <span>{entry.result.hours} saat · {duration(entry.result.hours)}</span>
            <span>{storyPoints(entry.result.hours)} SP</span><span className="source">{sources[entry.result.source]}</span><ChevronRight size={18} />
          </button>
        </li>
      ))}</ul> : <p className="history-empty">Qiymətləndirmə tarixçəsi boşdur.</p>}
    </section>
  );
}

function HelpPage() {
  return (
    <div className="help-grid">
      <section className="card help-card">
        <h2>Hesablama qaydası</h2>
        <p>Bir iş günü 8 saatdır. Müddət tam saatla təxmin edilir, Story Point ən çox iki onluq rəqəmə yuvarlaqlaşdırılır.</p>
        <ul><li>8 saatdan az işlərdə saatı 0.1-ə vurun.</li><li>8 saat və daha uzun işlərdə saatı 8-ə bölün.</li></ul>
        <table><thead><tr><th scope="col">Saat</th><th scope="col">Hesablama</th><th scope="col">Point</th></tr></thead><tbody>
          {[1, 2, 6, 7, 8, 10, 12, 16, 24].map(hours => <tr key={hours}><td>{hours}</td><td>{pointFormula(hours)}</td><td>{storyPoints(hours)}</td></tr>)}
        </tbody></table>
      </section>
      <section className="card help-card">
        <h2>Daha dəqiq təxmin</h2>
        <p>Başlıqda əməliyyatı və təsirlənən komponenti yazın. Məsələn, «Sifarişlər siyahısına status filtri əlavə et».</p>
        <p>Kontekstdə biznes qaydalarını, hazır komponentləri və asılılıqları qeyd edin. Qiymətləndirmədəki fərziyyələri komanda ilə dəqiqləşdirin.</p>
        <h2>Yerli və AI rejimləri</h2>
        <p>Yerli rejim başlıqda və kontekstdə müəyyən açar sözləri axtarır. Mətnin bütün mənasını və istisnaları təhlil etmir. Açar sözlər kifayət etmədikdə daha geniş interval və dəqiqləşdirmə sualları göstərilir.</p>
        <p>Serverdə AI aktivdirsə, qiymətləndirmə üçün başlıq və kontekst OpenAI-a göndərilir. Hər iki rejimdə Story Point eyni qayda ilə hesablanır.</p>
        <h2>Tarixçə</h2>
        <p>Son 20 nəticə və forma məlumatı yalnız bu brauzerin yaddaşında saxlanır. Tarixçə bölməsindən istənilən qeydi aça və ya tarixçəni təmizləyə bilərsiniz.</p>
      </section>
    </div>
  );
}

function CopyDialog({ value, close }) {
  const dialog = useRef(null);
  const area = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    area.current.focus();
    area.current.select();
  }, []);
  return (
    <dialog ref={dialog} onClose={close} aria-labelledby="copy-heading">
      <div className="dialog-title"><h2 id="copy-heading">Mətni əl ilə kopyalayın</h2><button className="button secondary icon-button" aria-label="Bağla" onClick={() => dialog.current.close()}><X size={18} /></button></div>
      <p>Seçilmiş mətni Ctrl+C və ya Cmd+C ilə kopyalayın.</p>
      <textarea ref={area} aria-label="Kopyalanacaq mətn" rows={8} value={value} readOnly />
      <button className="button secondary" onClick={() => dialog.current.close()}>Bağla</button>
    </dialog>
  );
}

function App() {
  const [page, setPage] = useState('estimate');
  const [form, setForm] = useState(newWork);
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState(readHistory);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const request = useRef(null);
  const copyTrigger = useRef(null);
  const result = entry?.result;
  const stale = Boolean(entry && JSON.stringify(form) !== JSON.stringify(entry.form));
  const section = navigation[page];

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function persist(next, message) {
    setEntries(next);
    setNotice(saveHistory(next) ? message : 'Brauzer yaddaşı əlçatan deyil. Dəyişiklik bu sessiyada görünəcək.');
  }

  function cancelRequest() {
    request.current?.abort();
    request.current = null;
    setPending(false);
  }

  function reset() {
    cancelRequest();
    setForm(newWork);
    setEntry(null);
    setError('');
    setPage('estimate');
    requestAnimationFrame(() => document.getElementById('title')?.focus());
  }

  function open(saved) {
    cancelRequest();
    setEntry(saved);
    setForm(saved.form);
    setError('');
    setPage('estimate');
    requestAnimationFrame(() => document.getElementById('page-title')?.focus());
  }

  function change(next) {
    setForm(next);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    let payload;
    try {
      payload = normalizeWork(form);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Qiymətləndirmə alınmadı. Yenidən cəhd edin.');
        return;
      }
      if (request.current !== controller) return;
      const saved = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), form: payload, result: body };
      setForm(payload);
      setEntry(saved);
      persist([saved, ...entries].slice(0, 20), 'Qiymətləndirmə hazırdır.');
    } catch {
      if (!controller.signal.aborted) setError('Serverlə əlaqə qurulmadı. Yenidən cəhd edin.');
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
  }

  function edit(fields) {
    const updated = { ...entry, result: { ...result, ...fields } };
    setEntry(updated);
    const next = entries.map(saved => saved.id === entry.id ? updated : saved);
    setEntries(next);
    if (next.some(saved => saved.id === entry.id) && !saveHistory(next)) {
      setNotice('Redaktə brauzer yaddaşında saxlanmadı.');
    }
  }

  function clear() {
    if (window.confirm('Bütün qiymətləndirmə tarixçəsi silinsin?')) {
      cancelRequest();
      persist([], 'Tarixçə təmizləndi.');
    }
  }

  async function copy(part) {
    copyTrigger.current = document.activeElement;
    const value = copyText({ ...result, criteria: result.criteria.map(text => text.trim()).filter(Boolean) }, part);
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Kopyalandı.');
    } catch {
      setManualCopy(value);
    }
  }

  function closeCopy() {
    setManualCopy('');
    copyTrigger.current?.focus();
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('estimate')}><span className="brand-mark"><Layers3 size={22} /></span>SprintPointer</button>
        <nav aria-label="Əsas menyu">{Object.entries(navigation).map(([key, { label, icon: Icon }]) => (
          <button key={key} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} onClick={() => setPage(key)}><Icon size={19} />{label}</button>
        ))}</nav>
        <div className="sidebar-footer"><span />Azure DevOps üçün</div>
      </aside>
      <main className="main">
        <header className="page-head">
          <div><h1 id="page-title" tabIndex={-1}>{section.title}</h1><p>{section.description}</p></div>
          <button className="button secondary new-work" onClick={reset}><Plus size={18} /> Yeni iş</button>
        </header>
        {page === 'estimate' && <div className="estimate-grid">
          <EstimateForm form={form} change={change} submit={submit} pending={pending} error={error} />
          <EstimateResult result={result} stale={stale} pending={pending} edit={edit} copy={copy} />
        </div>}
        {page === 'history' && <HistoryPage entries={entries} open={open} clear={clear} />}
        {page === 'help' && <HelpPage />}
      </main>
      <div className={notice ? 'toast' : 'sr-only'} role="status">{notice}</div>
      {manualCopy && <CopyDialog value={manualCopy} close={closeCopy} />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
