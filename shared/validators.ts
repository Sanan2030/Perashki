import { validateData } from '../apps/overtimer/src/lib/model';
import { parseProgress } from '../apps/level-up/lib/storage';
import { parseProject } from '../apps/visio-generator/lib/storage';
import { parseDiagram } from '../apps/visio-generator/lib/diagram-clipboard';
import { readPersonalLexicon } from '../apps/sloth-ai/lib/editor/personal-lexicon';
import { readTransformLog } from '../apps/sloth-ai/lib/editor/transform-log';
import { readExpectedResults } from '../apps/sloth-ai/lib/editor/expected-results';
import { parseReviewCorpus } from '../apps/sloth-ai/lib/editor/review-corpus';
import { parseEditorDraft } from '../apps/sloth-ai/lib/editor/workspace-storage';
import { parseTodos } from '../public/todos.js';
import { validateStoryStore } from '../public/stories.js';

const exactKeys = [
  'overtime-noter:v1', 'artisaat:theme', 'level-up.progress.v1', 'level-up.theme',
  'lazyai-theme', 'slothai-personal-lexicon-v1', 'slothai-transform-log-v1', 'slothai-expected-results-v1', 'slothai-reviewed-tests-v1', 'slothai-workspace-v1',
  'visioflow:diagram-clipboard:v1', 'visioflow:sidebar-width',
  'perashki:todos:v1', 'perashki:stories:v1', 'perashki:calendar:v1', 'perashki:workspace:v1', 'perashki:theme:v1',
];
export function ownedKey(key: string) { return exactKeys.includes(key) || /^visioflow:v1:[a-zA-Z0-9_-]{1,128}$/.test(key); }
export function validateRecord(key: string, raw: string) {
  if (!ownedKey(key) || typeof raw !== 'string') throw new Error('Naməlum məlumat açarı.');
  if (['artisaat:theme', 'level-up.theme', 'lazyai-theme', 'perashki:theme:v1'].includes(key)) {
    if (!['light', 'dark'].includes(raw)) throw new Error('Tema uyğun deyil.');
    return;
  }
  if (key === 'visioflow:sidebar-width') {
    if (!Number.isFinite(Number(raw)) || Number(raw) < 280 || Number(raw) > 640) throw new Error('Panel ölçüsü uyğun deyil.');
    return;
  }
  const value = JSON.parse(raw);
  if (key === 'overtime-noter:v1') validateData(value);
  else if (key === 'level-up.progress.v1') parseProgress(value);
  else if (key.startsWith('visioflow:v1:')) {
    const project = parseProject(raw);
    if (key !== `visioflow:v1:${project.id}`) throw new Error('Diaqram identifikatoru uyğun deyil.');
  }
  else if (key === 'visioflow:diagram-clipboard:v1') parseDiagram(raw);
  else if (key === 'perashki:todos:v1') parseTodos(raw);
  else if (key === 'perashki:stories:v1') validateStoryStore(value);
  else if (key === 'slothai-reviewed-tests-v1') parseReviewCorpus(raw);
  else if (key === 'slothai-workspace-v1') parseEditorDraft(raw);
  else if (key === 'slothai-personal-lexicon-v1') {
    const parsed = readPersonalLexicon({ getItem: () => raw });
    if (!value || !Array.isArray(value.pending) || !Array.isArray(value.confirmed) || parsed.pending.length !== value.pending.length || parsed.confirmed.length !== value.confirmed.length) throw new Error('Şəxsi lüğət uyğun deyil.');
  }
  else if (key === 'slothai-transform-log-v1' || key === 'slothai-expected-results-v1') {
    const parsed = (key === 'slothai-transform-log-v1' ? readTransformLog : readExpectedResults)({ getItem: () => raw });
    if (!Array.isArray(value) || parsed.length !== value.length) throw new Error('Sloth AI qeydləri uyğun deyil.');
  }
  else if (key === 'perashki:calendar:v1') {
    if (!value || value.version !== 1 || ![2026, 2027].includes(value.year)) throw new Error('Təqvim məlumatı uyğun deyil.');
    if (value.month !== undefined && (!Number.isInteger(value.month) || value.month < 0 || value.month > 11)) throw new Error('Təqvim ayı uyğun deyil.');
  }
  else if (key === 'perashki:workspace:v1') {
    if (!value || value.version !== 1 || typeof value.route !== 'string' || !/^\/(?:sloth-ai|visio-generator|sprint-pointer|overtimer|level-up|calendar|todo)?$/.test(value.route) || !value.frames || typeof value.frames !== 'object' || Array.isArray(value.frames)) throw new Error('İş məkanı uyğun deyil.');
    for (const [app, url] of Object.entries(value.frames)) {
      if (!['sloth-ai', 'visio-generator', 'overtimer', 'level-up'].includes(app) || typeof url !== 'string' || url.length > 2000 || /[\\\x00-\x1f]/.test(url) || !url.startsWith(`/tools/${app}`)) throw new Error('Bölmə ünvanı uyğun deyil.');
      const parsed = new URL(url, 'https://perashki.invalid');
      if (parsed.origin !== 'https://perashki.invalid' || !(parsed.pathname === `/tools/${app}` || parsed.pathname.startsWith(`/tools/${app}/`))) throw new Error('Bölmə ünvanı uyğun deyil.');
    }
  }
}
