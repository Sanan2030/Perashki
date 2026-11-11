'use client';
import { Download, FileJson, ShieldCheck, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useProgress } from './providers';
import { emptyProgress, exportProgress, importProgress, STORAGE_KEY } from '@/lib/storage';
import type { Locale, UserProgress } from '@/lib/types';
export function SettingsView({ locale }: { locale: Locale }) {
  const { progress, replace, ready, error } = useProgress();
  const az = locale === 'az';
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<UserProgress | null>(null);
  const [message, setMessage] = useState('');
  function download() {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `level-up-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function downloadRecovery() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error('Unavailable');
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'level-up-recovery.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage(az ? 'Əvvəlki yaddaş oxunmur.' : 'The previous storage cannot be read.');
    }
  }
  async function confirmImport() {
    if (!pending) return;
    try {
      await replace(pending);
      setPending(null);
      setMessage(az ? 'İrəliləyiş idxal edildi.' : 'Progress imported.');
    } catch {
      setMessage(
        az
          ? 'Brauzer yaddaşa yazmağa icazə vermir.'
          : 'The browser did not allow saving. Your previous data was preserved.',
      );
    }
  }
  async function readFile(selected?: File) {
    if (!selected) return;
    try {
      if (selected.size > 5_000_000) throw new Error('too large');
      const parsed = importProgress(await selected.text());
      setPending(parsed);
      setMessage('');
    } catch {
      setMessage(
        az
          ? 'Fayl etibarlı Level Up irəliləyiş faylı deyil və ya 5 MB-dan böyükdür.'
          : 'This is not a valid Level Up progress file, or it exceeds 5 MB.',
      );
    } finally {
      if (file.current) file.current.value = '';
    }
  }
  return (
    <div className="stack-lg">
      <div>
        <h1 className="page-title">{az ? 'Tənzimləmələr' : 'Settings'}</h1>
      </div>
      <div className="grid-2">
        <section className="card padded stack">
          <FileJson size={25} className="accent" />
          <h2>{az ? 'İrəliləyişin ehtiyat nüsxəsi' : 'Progress backup'}</h2>
          <p className="muted">
            {az
              ? 'Dərslər, qeydlər, əlfəcinlər və imtahan nəticələri yalnız bu brauzerdə saxlanır. JSON faylını başqa brauzerdə idxal edə bilərsən.'
              : 'Lessons, notes, bookmarks, and quiz results are saved in this browser. Export a JSON file to transfer them to another browser.'}
          </p>
          <div className="button-row">
            <button className="button button-primary" onClick={download} disabled={!ready}>
              <Download size={16} />
              {az ? 'JSON ixrac et' : 'Export JSON'}
            </button>
            <button
              className="button button-secondary"
              onClick={() => file.current?.click()}
              disabled={!ready}
            >
              <Upload size={16} />
              {az ? 'JSON idxal et' : 'Import JSON'}
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label={az ? 'İrəliləyiş faylı' : 'Progress file'}
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </div>
          {error && (
            <div className="notice stack">
              <p>
                {az
                  ? 'Əvvəlki məlumatlar qorunur. Bərpa üçün xam faylı yüklə və ya yeni irəliləyiş başlat.'
                  : 'Your previous data is preserved. Download a recovery file or explicitly start fresh.'}
              </p>
              <div className="button-row">
                <button className="button button-secondary" onClick={downloadRecovery}>
                  {az ? 'Bərpa faylını yüklə' : 'Download recovery file'}
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => setPending(emptyProgress())}
                >
                  {az ? 'Sıfırdan başlat' : 'Start fresh'}
                </button>
              </div>
            </div>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          {pending && (
            <div className="notice stack">
              <strong>
                {az ? 'Məlumatların əvəzlənməsini təsdiqlə' : 'Confirm progress replacement'}
              </strong>
              <p>
                {Object.keys(pending.completedLessons).length}{' '}
                {az ? 'tamamlanmış dərs' : 'completed lessons'}, {pending.attempts.length}{' '}
                {az ? 'məşq cəhdi' : 'quiz attempts'}.{' '}
                {az
                  ? 'Cari məlumatların əvəzlənəcək. Əvvəl ehtiyat nüsxə ixrac et.'
                  : 'This replaces your current progress. Export a backup first.'}
              </p>
              <div className="button-row">
                <button className="button button-primary" onClick={() => void confirmImport()}>
                  {az ? 'Əvəzlə və idxal et' : 'Replace and import'}
                </button>
                <button className="button button-secondary" onClick={() => setPending(null)}>
                  {az ? 'Ləğv et' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="card padded stack">
          <ShieldCheck size={24} className="sage-text" />
          <h2>{az ? 'Məxfilik' : 'Privacy'}</h2>
          <p className="muted">
            {az
              ? 'Hesab və izləmə tələb olunmur. Brauzer məlumatlarını silmək irəliləyişini də silir. Həssas məlumatları şəxsi qeydlərə yazma.'
              : 'No account or tracking required. Clearing browser data also clears your progress. Keep sensitive information out of personal notes.'}
          </p>
        </section>
      </div>
    </div>
  );
}
