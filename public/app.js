import { STORAGE_KEY, priorities, parseTodos, filterTodos, todayInBaku } from './todos.js';
import { installBackupUI } from './backup-ui.js';
import { mountStories } from './story-view.js';

const paths = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z"/>',
  flow: '<rect x="8" y="2" width="8" height="5" rx="1"/><rect x="2" y="17" width="7" height="5" rx="1"/><rect x="15" y="17" width="7" height="5" rx="1"/><path d="M12 7v5M5.5 17v-5h13v5"/>',
  cards: '<rect x="7" y="4" width="13" height="17" rx="2"/><path d="M5 18H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h11"/><path d="m11 11 2-2v7m-2 0h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  learn: '<path d="m2 9 10-6 10 6-10 6L2 9Z"/><path d="M6 12v6c4 3 8 3 12 0v-6M22 9v8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7 12 3 3 7-7"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.home}</svg>`;
const tools = [
  { id: 'sloth-ai', name: 'Sloth AI', icon: 'spark', description: 'Azərbaycan dilində mətnlərini düzəlt, fikirlərini daha aydın ifadə et.', category: 'Mətn və yazı', accent: '#7d729f', tint: '#f0edf8' },
  { id: 'visio-generator', name: 'Visio Generator', icon: 'flow', description: 'İş axınlarını diaqrama çevir, proseslərini vizual şəkildə qur.', category: 'Proses və diaqram', accent: '#638cb4', tint: '#eaf2fa' },
  { id: 'sprint-pointer', name: 'StoryPointer', icon: 'cards', description: 'Başlıqdan Azure DevOps üçün iş təsviri və story point təklifi hazırla.', category: 'İşlərin hazırlanması', accent: '#bd8b53', tint: '#faf1e3' },
  { id: 'overtimer', name: 'Overtimer', icon: 'clock', description: 'Əlavə iş saatlarını qeyd et, vaxtını və qazancını izlə.', category: 'Vaxtın uçotu', accent: '#5d9584', tint: '#eaf4ee' },
  { id: 'level-up', name: 'Level Up', icon: 'learn', description: 'BA və PO bacarıqlarını inkişaf etdir, öz yol xəritənlə öyrən.', category: 'Öyrənmə və inkişaf', accent: '#a27f97', tint: '#f6edf2' },
  { id: 'calendar', name: 'Təqvim', icon: 'calendar', description: 'Azərbaycanın bayram və xüsusi günlərinə bir yerdən bax.', category: '2026–2027', accent: '#aa8e52', tint: '#f8f4e6' },
  { id: 'todo', name: 'To-do list', icon: 'check', description: 'Tapşırıqlarını sırala, prioritetləri seç və gününü rahat planla.', category: 'Gündəlik planlama', accent: '#71895a', tint: '#eff4e7' },
];

const main = document.querySelector('main');
const panels = new Map();
let tasks = [];
let storageNotice = '';
let blockedStorage = false;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  try { tasks = parseTodos(raw); }
  catch { blockedStorage = true; storageNotice = 'Əvvəlki tapşırıq yaddaşı oxunmur. Məlumatı qorumaq üçün yeni yazma dayandırılıb. Ehtiyat nüsxəsini yükləyib yaddaşı yoxla.'; }
} catch { storageNotice = 'Brauzer yaddaşı əlçatan deyil. Tapşırıqlar yalnız bu açıq səhifədə qalacaq. Ehtiyat nüsxəsini yüklə.'; }

const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
function dateLabel(value, short = false) {
  const [year, month, day] = value.split('-');
  const name = months[Number(month) - 1];
  return `${Number(day)} ${short ? name.slice(0, 3) : name} ${year}`;
}
document.querySelector('#today').textContent = dateLabel(todayInBaku());
document.querySelector('#navigation').innerHTML = `<a class="nav-link" href="/">${icon('home')}<span>İcmal</span></a><div class="nav-separator"></div>${tools.map(tool => `<a class="nav-link" href="/${tool.id}">${icon(tool.icon)}<span>${tool.name}</span></a>`).join('')}`;

function toolSymbol(tool) { return `<span class="tool-symbol" style="--tint:${tool.tint};--accent:${tool.accent}">${icon(tool.icon)}</span>`; }
function renderHome(panel) {
  panel.innerHTML = `<div class="eyebrow">SƏNİN ŞƏXSİ MƏKANIN</div><h1>Hər şey öz yerində.</h1><p class="intro">Yaz, planla, öyrən. Gününü asanlaşdıran alətlərin bir arada.</p>
  <div class="hero"><div class="hero-copy"><div class="hero-kicker">KİÇİK ADDIMLAR. BÖYÜK İRƏLİLƏYİŞ.</div><h2>Bu gün nəyə<br>fokuslanacaqsan?</h2><p>Fikrindəki işləri siyahıya al. Günün qalanını daha rahat planla.</p><a class="hero-link" href="/todo">Tapşırıqlarıma keç ${icon('arrow')}</a></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="art-dot"></div><div class="art-card"><span class="art-line short"></span><span class="art-line"></span><span class="art-line"></span><span class="art-line short"></span><span class="art-check">✓</span></div></div></div>
  <div class="section-heading"><h2>Sənin alətlərin</h2><span>${tools.length} bölmə</span></div><div class="tools-grid">${tools.map(tool => `<a class="tool-card" href="/${tool.id}" style="--accent:${tool.accent}"><div class="card-top">${toolSymbol(tool)}<span class="card-arrow">${icon('arrow')}</span></div><h3>${tool.name}</h3><p>${tool.description}</p><span class="card-category">${tool.category}</span></a>`).join('')}</div><p class="bottom-note">Bir məkan. Öz ritmin. Daha aydın bir gün.</p>`;
}

function renderFrame(panel, tool) {
  let src = tool.id === 'calendar' ? '/calendar.html' : `/tools/${tool.id}`;
  try {
    const saved = JSON.parse(localStorage.getItem('perashki:workspace:v1') || 'null');
    const candidate = saved?.frames?.[tool.id];
    if (typeof candidate === 'string') {
      const parsed = new URL(candidate, location.origin);
      if (parsed.origin === location.origin && (parsed.pathname === `/tools/${tool.id}` || parsed.pathname.startsWith(`/tools/${tool.id}/`))) src = parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {}
  panel.innerHTML = `<div class="frame-heading"><div><h1>${tool.name}</h1><p class="intro">${tool.description}</p></div><a class="plain-link" href="${src}" target="_blank" rel="noopener noreferrer">Ayrıca aç ${icon('external')}</a></div>`;
  const iframe = document.createElement('iframe');
  iframe.className = 'app-frame';
  iframe.title = tool.name;
  iframe.dataset.app = tool.id;
  iframe.src = src;
  iframe.allow = 'clipboard-write; fullscreen';
  panel.append(iframe);
}

function saveTasks(next) {
  if (blockedStorage) return false;
  tasks = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks })); storageNotice = ''; }
  catch { storageNotice = 'Dəyişiklik yaddaşa yazılmadı. Bu səhifədə qalır; bağlamazdan əvvəl ehtiyat nüsxəsini yüklə.'; }
  return true;
}

function setupTodos(panel) {
  panel.innerHTML = `<div class="page-heading"><div><div class="eyebrow">GÜNÜNÜ PLANLA</div><h1>Bir-bir, tamamla.</h1><p class="intro">Fikrindəkiləri yaz. Vacib olanlara yer ayır.</p></div></div>
  <div class="notice" role="status" id="storage-notice"></div><div class="todo-statbar"><div class="todo-stat"><strong id="active-count">0</strong>Gözləyən</div><div class="todo-stat"><strong id="complete-count">0</strong>Tamamlanan</div><div class="todo-stat"><strong id="today-count">0</strong>Bu gün üçün</div></div>
  <form class="todo-form" id="todo-form"><div class="field title-field"><label for="task-title">Tapşırıq</label><input id="task-title" name="title" maxlength="200" placeholder="Nə etmək istəyirsən?" required autocomplete="off"></div><div class="field"><label for="task-due">Son tarix</label><input id="task-due" name="due" type="date"></div><div class="field"><label for="task-priority">Prioritet</label><select id="task-priority" name="priority"><option value="normal">Normal</option><option value="high">Yüksək</option><option value="low">Aşağı</option></select></div><button class="btn" type="submit" id="save-task">${icon('plus')} Əlavə et</button><button class="btn secondary hidden" type="button" id="cancel-edit">Ləğv et</button></form>
  <div class="todo-toolbar"><div class="tabs" aria-label="Tapşırıq filtri"><button class="tab" data-filter="all" aria-pressed="true">Hamısı</button><button class="tab" data-filter="active" aria-pressed="false">Gözləyən</button><button class="tab" data-filter="today" aria-pressed="false">Bu gün</button><button class="tab" data-filter="completed" aria-pressed="false">Tamamlanan</button></div><input class="search" type="search" id="task-search" placeholder="Tapşırıq axtar…" aria-label="Tapşırıq axtar"></div>
  <div class="task-list" id="task-list" aria-live="polite"></div><p class="todo-footnote">Tapşırıqlar bu brauzerdə saxlanır. Digər cihazlarla sinxronlaşdırılmır.</p>`;
  let filter = 'all';
  let editingId = null;
  const form = panel.querySelector('form');
  const title = form.elements.title;
  const due = form.elements.due;
  const priority = form.elements.priority;
  const save = panel.querySelector('#save-task');
  const cancel = panel.querySelector('#cancel-edit');
  const search = panel.querySelector('#task-search');
  const list = panel.querySelector('#task-list');
  const notice = panel.querySelector('#storage-notice');

  function finishEdit() {
    editingId = null; form.reset(); cancel.classList.add('hidden');
    save.innerHTML = `${icon('plus')} Əlavə et`;
    title.setCustomValidity('');
  }
  function refresh() {
    const today = todayInBaku();
    notice.textContent = storageNotice;
    for (const control of form.elements) control.disabled = blockedStorage;
    panel.querySelector('#active-count').textContent = tasks.filter(task => !task.completed).length;
    panel.querySelector('#complete-count').textContent = tasks.filter(task => task.completed).length;
    panel.querySelector('#today-count').textContent = tasks.filter(task => task.due === today && !task.completed).length;
    list.replaceChildren();
    const visible = filterTodos(tasks, filter, search.value, today);
    if (!visible.length) {
      const empty = document.createElement('div'); empty.className = 'empty';
      empty.innerHTML = `${icon('check')}<h2>${tasks.length ? 'Bu görünüşdə tapşırıq yoxdur.' : 'Yeni gün, təmiz siyahı.'}</h2><p>${tasks.length ? 'Filtri və ya axtarışı dəyişərək digər tapşırıqlara bax.' : 'İlk tapşırığını əlavə et və başla.'}</p>`;
      list.append(empty);
    }
    for (const task of visible) {
      const row = document.createElement('div'); row.className = `task${task.completed ? ' completed' : ''}`; row.dataset.id = task.id;
      row.innerHTML = `<input type="checkbox" aria-label="Tapşırığı tamamla"><div class="task-content"><div class="task-title"></div><div class="task-meta"><span class="priority"></span><span class="due"></span></div></div><button class="icon-button" data-action="edit" aria-label="Tapşırığı redaktə et">${icon('edit')}</button><button class="icon-button" data-action="delete" aria-label="Tapşırığı sil">${icon('trash')}</button>`;
      row.querySelector('.task-title').textContent = task.title;
      row.querySelector('input').checked = task.completed;
      row.querySelector('input').setAttribute('aria-label', `${task.title}: ${task.completed ? 'yenidən aç' : 'tamamla'}`);
      row.querySelector('.priority').textContent = priorities[task.priority];
      row.querySelector('.priority').classList.add(task.priority);
      if (task.due) {
        const date = row.querySelector('.due'); date.textContent = dateLabel(task.due, true);
        if (task.due < today && !task.completed) { date.classList.add('overdue'); date.textContent += ' · Gecikir'; }
      }
      for (const control of row.querySelectorAll('input,button')) control.disabled = blockedStorage;
      list.append(row);
    }
  }
  title.addEventListener('input', () => title.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = title.value.trim();
    if (!text) { title.setCustomValidity('Tapşırığın adını yaz.'); title.reportValidity(); return; }
    const next = editingId
      ? tasks.map(task => task.id === editingId ? { ...task, title: text, due: due.value, priority: priority.value } : task)
      : [{ id: crypto.randomUUID(), title: text, due: due.value, priority: priority.value, completed: false, createdAt: new Date().toISOString() }, ...tasks];
    if (saveTasks(next)) { finishEdit(); refresh(); title.focus(); }
  });
  cancel.addEventListener('click', () => { finishEdit(); title.focus(); });
  panel.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    panel.querySelectorAll('[data-filter]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    refresh();
  }));
  search.addEventListener('input', refresh);
  list.addEventListener('change', event => {
    if (event.target.type !== 'checkbox') return;
    const id = event.target.closest('.task').dataset.id;
    saveTasks(tasks.map(task => task.id === id ? { ...task, completed: event.target.checked } : task)); refresh();
  });
  list.addEventListener('click', event => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const id = action.closest('.task').dataset.id;
    const task = tasks.find(task => task.id === id);
    if (action.dataset.action === 'edit') {
      editingId = id; title.value = task.title; due.value = task.due; priority.value = task.priority;
      save.innerHTML = `${icon('check')} Yadda saxla`; cancel.classList.remove('hidden'); title.focus();
      form.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      if (!confirm(`“${task.title}” tapşırığı silinsin?`)) return;
      saveTasks(tasks.filter(task => task.id !== id));
      if (editingId === id) finishEdit();
      refresh();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { tasks = parseTodos(localStorage.getItem(STORAGE_KEY)); blockedStorage = false; storageNotice = ''; }
    catch { blockedStorage = true; storageNotice = 'Digər tabdan gələn yaddaş oxunmur; yeni yazma dayandırıldı.'; }
    refresh();
  });
  panel.refresh = refresh;
  refresh();
}

function showRoute() {
  const route = location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
  const tool = tools.find(tool => tool.id === route);
  if (route !== 'home' && !tool) return;
  for (const panel of panels.values()) panel.hidden = true;
  let panel = panels.get(route);
  if (!panel) {
    panel = document.createElement('section'); panels.set(route, panel); main.append(panel);
    if (route === 'home') renderHome(panel);
    else if (route === 'todo') setupTodos(panel);
    else if (route === 'sprint-pointer') mountStories(panel);
    else renderFrame(panel, tool);
  }
  panel.hidden = false;
  panel.refresh?.();
  document.querySelector('#breadcrumb').textContent = tool?.name || 'İcmal';
  document.title = `${tool?.name || 'İş məkanın'} · Perashki`;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.pathname === location.pathname || (route === 'home' && link.pathname === '/')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.origin !== location.origin) return;
  if (link.pathname !== '/' && !tools.some(tool => link.pathname === `/${tool.id}`)) return;
  event.preventDefault();
  if (link.pathname !== location.pathname) history.pushState({}, '', link.pathname);
  showRoute(); window.scrollTo(0, 0); main.focus({ preventScroll: true });
});
window.addEventListener('popstate', showRoute);
window.addEventListener('perashki:before-backup', () => {
  const frames = {};
  for (const iframe of document.querySelectorAll('.app-frame[data-app]')) {
    if (iframe.dataset.app === 'calendar') continue;
    try {
      const url = new URL(iframe.contentWindow.location.href);
      const base = `/tools/${iframe.dataset.app}`;
      if (url.origin === location.origin && (url.pathname === base || url.pathname.startsWith(`${base}/`))) frames[iframe.dataset.app] = url.pathname + url.search + url.hash;
    } catch {}
  }
  try { localStorage.setItem('perashki:workspace:v1', JSON.stringify({ version: 1, route: location.pathname.replace(/\/$/, '') || '/', frames })); } catch {}
});
window.addEventListener('perashki:before-restore', () => document.querySelectorAll('.app-frame').forEach(iframe => iframe.remove()));
installBackupUI();
showRoute();
