export const STORAGE_KEY = 'perashki:todos:v1';
export const priorities = { high: 'Yüksək', normal: 'Normal', low: 'Aşağı' };

export function parseTodos(raw) {
  if (raw === null) return [];
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Array.isArray(value.tasks) || value.tasks.length > 10000) throw new Error('Tapşırıq yaddaşı oxunmur.');
  const ids = new Set();
  for (const task of value.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 200 || typeof task.completed !== 'boolean' || !Object.hasOwn(priorities, task.priority) || typeof task.due !== 'string' || (task.due !== '' && !isValidDate(task.due)) || typeof task.createdAt !== 'string' || !Number.isFinite(Date.parse(task.createdAt))) throw new Error('Tapşırıq yaddaşının formatı yanlışdır.');
    ids.add(task.id);
  }
  return value.tasks;
}

export function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function todayInBaku(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function filterTodos(tasks, filter, query = '', today = todayInBaku()) {
  const needle = query.trim().toLocaleLowerCase('az');
  return tasks.filter(task => (!needle || task.title.toLocaleLowerCase('az').includes(needle)) &&
    (filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'completed' && task.completed) || (filter === 'today' && task.due === today && !task.completed)));
}
