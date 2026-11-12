import { duration, pointFormula, storyPoints } from './points.js';

export const types = {
  feature: 'Yeni funksionallıq',
  bug: 'Xəta düzəlişi',
  improvement: 'Təkmilləşdirmə',
  research: 'Araşdırma',
};

export const scopes = { frontend: 'Frontend', backend: 'Backend', fullstack: 'Frontend + Backend' };

export const factors = {
  integration: 'Xarici servis inteqrasiyası',
  database: 'Verilənlər bazası dəyişikliyi',
  permissions: 'İcazələr',
  tests: 'Geniş test əhatəsi',
};

export const levels = { low: 'Aşağı', medium: 'Orta', high: 'Yüksək' };
export const sources = { local: 'Yerli təxmin', ai: 'AI təxmini' };
export const newWork = { title: '', context: '', type: 'feature', scope: 'fullstack', factors: [] };

export function normalizeWork(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Tapşırıq məlumatlarını daxil edin.');
  }
  const { title, context = '', type = newWork.type, scope = newWork.scope, factors: selected = [] } = value;
  if (typeof title !== 'string' || title.trim().length < 8 || title.trim().length > 180) {
    throw new TypeError('Başlıq 8–180 simvol olmalıdır.');
  }
  if (typeof context !== 'string' || context.length > 6000) {
    throw new TypeError('Əlavə kontekst maksimum 6000 simvol ola bilər.');
  }
  if (typeof type !== 'string' || !Object.hasOwn(types, type) ||
      typeof scope !== 'string' || !Object.hasOwn(scopes, scope)) {
    throw new TypeError('İş növü və əhatəsini seçin.');
  }
  if (!Array.isArray(selected) || selected.length > 4 ||
      selected.some(item => typeof item !== 'string' || !Object.hasOwn(factors, item)) ||
      new Set(selected).size !== selected.length) {
    throw new TypeError('Əlavə amillərdən etibarlı seçim edin.');
  }
  return { title: title.trim(), context: context.trim(), type, scope, factors: selected };
}

const listText = items => items.map(item => `• ${item}`).join('\n');

export function copyText(result, part) {
  if (part === 'point') return String(storyPoints(result.hours));
  const content = `İşin izahı\n${result.description}\n\nQəbul meyarları\n${listText(result.criteria)}`;
  if (part === 'details') return content;
  return [
    result.title,
    content,
    `Təxmini müddət — ${result.hours} saat (${duration(result.hours)})\n` +
    `Story Point — ${storyPoints(result.hours)}\n${pointFormula(result.hours)}\n` +
    `Çətinlik — ${levels[result.difficulty]}\nƏminlik — ${levels[result.confidence]}\n` +
    `Mümkün interval — ${result.minHours}–${result.maxHours} saat\nMənbə — ${sources[result.source]}`,
    `Qiymətləndirmənin səbəbləri\n${listText(result.reasons)}`,
    result.assumptions.length && `Fərziyyələr\n${listText(result.assumptions)}`,
    result.questions.length && `Dəqiqləşdirmə sualları\n${listText(result.questions)}`,
  ].filter(Boolean).join('\n\n');
}
