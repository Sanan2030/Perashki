import { ownedKey, validateRecord } from './generated/validators.js';
export const BACKUP_LIMIT = 32 * 1024 * 1024;

export function backupLocale(storage, cookies = '') {
  const cookie = cookies.match(/(?:^|;)\s*level-up\.locale=(az|en)(?:;|$)/);
  if (cookie) return cookie[1];
  try {
    const workspace = JSON.parse(storage.getItem('perashki:workspace:v1') || 'null');
    const url = workspace?.frames?.['level-up'];
    const locale = typeof url === 'string' ? new URL(url, 'https://perashki.invalid').pathname.split('/')[3] : null;
    if (['az', 'en'].includes(locale)) return locale;
  } catch {}
  return 'en';
}

export function snapshotStorage(storage) {
  const records = Object.create(null);
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && ownedKey(key)) {
      const value = storage.getItem(key);
      if (value !== null) records[key] = value;
    }
  }
  return records;
}

export function validateBackup(value) {
  if (!value || value.kind !== 'perashki-backup' || value.version !== 1 || !Number.isFinite(Date.parse(value.exportedAt)) || !value.storage || typeof value.storage !== 'object' || Array.isArray(value.storage) || Object.keys(value.storage).length > 1200 || !value.preferences || !['az', 'en'].includes(value.preferences.locale)) throw new Error('Bu fayl Perashki-nin ümumi ehtiyat nüsxəsi deyil.');
  for (const [key, raw] of Object.entries(value.storage)) {
    try { validateRecord(key, raw); }
    catch (error) { throw new Error(`${key}: ${error.message}`); }
  }
  return value;
}

export function createBackup(storage, locale = 'az') {
  return validateBackup({ kind: 'perashki-backup', version: 1, exportedAt: new Date().toISOString(), preferences: { locale }, storage: snapshotStorage(storage) });
}

export function parseBackup(text) {
  if (new TextEncoder().encode(text).byteLength > BACKUP_LIMIT) throw new Error('Ehtiyat nüsxəsi 32 MB həddini keçir.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('JSON faylı oxunmur. Əvvəlki məlumatlar dəyişdirilmədi.'); }
  return validateBackup(value);
}

export function restoreBackup(storage, backup) {
  validateBackup(backup);
  const previous = snapshotStorage(storage);
  const clear = () => Object.keys(snapshotStorage(storage)).forEach(key => storage.removeItem(key));
  try {
    clear();
    for (const [key, value] of Object.entries(backup.storage)) storage.setItem(key, value);
  } catch (error) {
    try { clear(); for (const [key, value] of Object.entries(previous)) storage.setItem(key, value); }
    catch { throw new Error('Bərpa və geri qaytarma tamamlanmadı. Əvvəlki ehtiyat nüsxəni saxla və brauzer yaddaşını yoxla.'); }
    throw new Error('Brauzer yaddaşı faylı qəbul etmədi. Əvvəlki məlumatlar geri qaytarıldı.');
  }
  return backup.storage['perashki:workspace:v1'] ? JSON.parse(backup.storage['perashki:workspace:v1']).route : '/';
}
