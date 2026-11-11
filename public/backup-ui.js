import { BACKUP_LIMIT, backupLocale, createBackup, parseBackup, restoreBackup } from './backup.js';
import { todayInBaku } from './todos.js';

export function installBackupUI() {
  const exportButton = document.querySelector('#export-workspace');
  const importButton = document.querySelector('#import-workspace');
  const input = document.querySelector('#workspace-file');
  const status = document.querySelector('#backup-status');
  let busy = false;
  function message(text, failed = false) { status.textContent = text; status.classList.toggle('failed', failed); }
  function flush() {
    window.dispatchEvent(new Event('perashki:before-backup'));
    for (const iframe of document.querySelectorAll('.app-frame')) {
      try { iframe.contentWindow.dispatchEvent(new Event('perashki:before-backup')); } catch {}
    }
  }
  try { const previous = sessionStorage.getItem('perashki:restore-message'); if (previous) { message(previous); sessionStorage.removeItem('perashki:restore-message'); } } catch {}
  async function download() {
    if (busy) return;
    busy = true; exportButton.disabled = true;
    try {
      flush();
      const locale = backupLocale(localStorage, document.cookie);
      const backup = createBackup(localStorage, locale);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `perashki-${todayInBaku()}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      message('Bütün bölmələrin ehtiyat nüsxəsi hazırdır.');
    } catch (error) { message(`Fayl hazırlanmadı: ${error.message}`, true); }
    finally { busy = false; exportButton.disabled = false; }
  }
  async function load() {
    const file = input.files?.[0];
    if (!file || busy) return;
    busy = true; importButton.disabled = true;
    let stopped = false;
    try {
      if (file.size > BACKUP_LIMIT) throw new Error('Fayl 32 MB-dan böyükdür.');
      const backup = parseBackup(await file.text());
      flush();
      // Stop mounted applications before replacing their storage, so delayed
      // saves cannot overwrite restored records with the previous session.
      window.dispatchEvent(new Event('perashki:before-restore'));
      stopped = true;
      const route = restoreBackup(localStorage, backup);
      document.cookie = `level-up.locale=${backup.preferences.locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      try { sessionStorage.setItem('perashki:restore-message', 'Bütün bölmələr fayldakı məlumatlarla bərpa edildi.'); } catch {}
      location.assign(route);
    } catch (error) {
      message(`İdxal tamamlanmadı: ${error.message}`, true);
      if (stopped) {
        try { sessionStorage.setItem('perashki:restore-message', `İdxal tamamlanmadı: ${error.message}`); } catch {}
        location.reload();
      }
    } finally { busy = false; importButton.disabled = false; input.value = ''; }
  }
  exportButton.addEventListener('click', download);
  importButton.addEventListener('click', () => input.click());
  input.addEventListener('change', load);
  window.addEventListener('perashki:export', download);
}
