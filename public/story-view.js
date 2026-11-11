import { generateStory, STORY_KEY, POINTS, validateStoryStore, storyMarkdown, storyHTML } from './stories.js';

export function mountStories(panel) {
  let store = { version: 1, draft: null, stories: [], inputs: { title: '', context: '', role: 'istifadəçi', type: 'User Story' } };
  let blocked = false;
  let initialError = '';
  try { const raw = localStorage.getItem(STORY_KEY); if (raw) store = validateStoryStore(JSON.parse(raw)); }
  catch { blocked = true; initialError = 'Əvvəlki StoryPointer məlumatı oxunmadı. Mövcud yaddaş qorunur.'; }
  panel.innerHTML = `<div class="page-heading"><div><div class="eyebrow">BAŞLIQDAN HAZIR İŞ QEYDİNƏ</div><h1>StoryPointer</h1><p class="intro">Azure DevOps üçün description, qəbul meyarları və ilkin story point təklifi.</p></div><span class="local-assistant">Yerli köməkçi</span></div>
  <div class="notice" role="status" id="story-status"></div><div class="story-layout"><div><form id="story-form" class="story-card"><h2>İşin nədən ibarətdir?</h2><div class="field"><label for="story-title">Tapşırığın başlığı</label><input id="story-title" maxlength="300" minlength="5" required placeholder="Müştəri məlumatlarının Excel-ə ixracı"></div><div class="story-pair"><div class="field"><label for="story-type">İş növü</label><select id="story-type"><option>User Story</option><option>Task</option><option>Bug</option></select></div><div class="field"><label for="story-role">İstifadəçi rolu</label><input id="story-role" maxlength="150" value="istifadəçi"></div></div><div class="field"><label for="story-context">Əlavə kontekst · istəyə bağlı</label><textarea id="story-context" maxlength="5000" rows="5" placeholder="Kim istifadə edəcək, hansı qaydalar və məhdudiyyətlər var?"></textarea></div><p class="story-help">Başlıqdan mövzuya uyğun yerli şablon hazırlanır. Məzmunu yoxla, layihənə uyğun redaktə et. Xarici AI xidmətinə məlumat göndərilmir.</p><button class="btn" type="submit">✦ İlkin mətn hazırla</button></form><div class="story-card history-card"><h2>Saxlanmış işlər <span id="story-count">0</span></h2><div id="story-history"></div></div></div><div class="story-card story-result"><div id="story-empty" class="empty"><h2>İdeyanı bir addım irəli apar.</h2><p>Başlığı yaz, ilkin iş qeydini hazırla və Azure DevOps-a köçür.</p></div><div id="story-output" hidden><div class="story-result-head"><div><span class="eyebrow" id="story-category"></span><h2 id="story-output-title"></h2></div><div class="field points-field"><label for="story-points">Story Points</label><select id="story-points">${POINTS.map(points => `<option>${points}</option>`).join('')}</select></div></div><p class="story-help" id="story-estimate"></p>${[['description', 'Description'], ['acceptance', 'Acceptance Criteria'], ['technical', 'Technical Notes'], ['assumptions', 'Open Questions']].map(([key, label]) => `<div class="field story-output-field"><label for="output-${key}">${label}</label><textarea id="output-${key}" rows="${key === 'description' ? 8 : 5}" maxlength="20000"></textarea></div>`).join('')}<div class="story-actions"><button class="btn" id="save-story">Yadda saxla</button><button class="btn secondary" id="copy-story">Azure DevOps üçün kopyala</button></div><p class="story-help">Kopyalanmış mətni Azure DevOps iş qeydinə yapışdır. Story Points komandanın nisbi qiymətləndirməsidir.</p></div></div></div>`;
  const status = panel.querySelector('#story-status');
  const form = panel.querySelector('#story-form');
  const inputs = Object.fromEntries(['title', 'context', 'role', 'type'].map(key => [key, panel.querySelector(`#story-${key}`)]));
  const fields = Object.fromEntries(['description', 'acceptance', 'technical', 'assumptions'].map(key => [key, panel.querySelector(`#output-${key}`)]));
  const points = panel.querySelector('#story-points');
  function notice(text) { status.textContent = text; }
  function persist() {
    if (blocked) return;
    try { localStorage.setItem(STORY_KEY, JSON.stringify(validateStoryStore(store))); }
    catch { notice('Dəyişiklik yaddaşa yazılmadı. Hazırladığın mətni kopyalayaraq saxla.'); }
  }
  function syncInputs() { store.inputs = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])); persist(); }
  function refreshHistory() {
    const history = panel.querySelector('#story-history'); history.replaceChildren();
    panel.querySelector('#story-count').textContent = store.stories.length;
    if (!store.stories.length) { const empty = document.createElement('p'); empty.className = 'story-help'; empty.textContent = 'Saxladığın iş qeydləri burada görünəcək.'; history.append(empty); }
    for (const story of store.stories) {
      const row = document.createElement('div'); row.className = 'story-history-row';
      const open = document.createElement('button'); open.className = 'story-history-open'; open.textContent = story.title;
      const badge = document.createElement('span'); badge.textContent = `${story.points} SP`;
      const remove = document.createElement('button'); remove.className = 'icon-button'; remove.textContent = '×'; remove.setAttribute('aria-label', `${story.title} işini sil`);
      open.addEventListener('click', () => { store.draft = structuredClone(story); store.inputs = { title: story.title, context: story.context, role: story.role, type: story.type }; render(); persist(); });
      remove.addEventListener('click', () => {
        if (!confirm(`“${story.title}” işi silinsin?`)) return;
        store.stories = store.stories.filter(item => item.id !== story.id); persist(); refreshHistory();
      });
      row.append(open, badge, remove); history.append(row);
    }
  }
  function render() {
    for (const [key, input] of Object.entries(inputs)) input.value = store.inputs?.[key] ?? store.draft?.[key] ?? (key === 'type' ? 'User Story' : key === 'role' ? 'istifadəçi' : '');
    const draft = store.draft;
    panel.querySelector('#story-empty').hidden = Boolean(draft);
    panel.querySelector('#story-output').hidden = !draft;
    if (draft) {
      panel.querySelector('#story-output-title').textContent = draft.title;
      panel.querySelector('#story-category').textContent = draft.category;
      panel.querySelector('#story-estimate').textContent = draft.estimateNote;
      for (const [key, input] of Object.entries(fields)) input.value = draft[key];
      points.value = String(draft.points);
    }
    refreshHistory();
    if (blocked) for (const control of panel.querySelectorAll('input,select,textarea,button')) control.disabled = true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    try { syncInputs(); store.draft = generateStory(store.inputs); notice('İlkin mətn hazırdır. Tələblərinə uyğun redaktə edib saxla.'); render(); persist(); }
    catch (error) { notice(error.message); }
  });
  for (const input of Object.values(inputs)) input.addEventListener('input', syncInputs);
  for (const [key, input] of Object.entries(fields)) input.addEventListener('input', () => { if (store.draft) store.draft[key] = input.value; persist(); });
  points.addEventListener('change', () => { if (store.draft) store.draft.points = Number(points.value); persist(); });
  panel.querySelector('#save-story').addEventListener('click', () => {
    if (!store.draft) return;
    const others = store.stories.filter(story => story.id !== store.draft.id);
    if (others.length >= 200) { notice('200 iş qeydi saxlanıb. Yeni qeyd üçün əvvəlkilərdən birini sil.'); return; }
    store.stories = [structuredClone(store.draft), ...others]; persist(); refreshHistory(); notice('İş qeydi saxlanıldı. Ümumi ehtiyat nüsxəsinə də daxil ediləcək.');
  });
  panel.querySelector('#copy-story').addEventListener('click', async () => {
    if (!store.draft) return;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([storyMarkdown(store.draft)], { type: 'text/plain' }), 'text/html': new Blob([storyHTML(store.draft)], { type: 'text/html' }) })]);
      } else await navigator.clipboard.writeText(storyMarkdown(store.draft));
      notice('Azure DevOps üçün mətn kopyalandı.');
    } catch { notice('Brauzer kopyalamağa icazə vermədi. Sahələrdəki mətni seçib əl ilə kopyala.'); }
  });
  window.addEventListener('perashki:before-backup', persist);
  notice(initialError); render();
}
