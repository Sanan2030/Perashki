// Self-contained so the exact same initializer can run before React hydration
// and as the portal's blocking head script. No React dependency is shared.
export function installWorkspaceTheme(win) {
  if (win.PerashkiTheme) return win.PerashkiTheme;
  const key = 'perashki:theme:v1';
  const legacyKeys = ['artisaat:theme', 'level-up.theme', 'lazyai-theme'];
  const media = win.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark';
  const read = () => {
    try {
      for (const name of [key, ...legacyKeys]) {
        const value = win.localStorage.getItem(name);
        if (valid(value)) return value;
      }
    } catch { /* Theme still works when storage is unavailable. */ }
    return null;
  };
  let explicit = read();
  let current;
  const apply = value => {
    current = value;
    const root = win.document.documentElement;
    root.dataset.theme = value;
    root.classList.toggle('dark', value === 'dark');
    root.style.colorScheme = value;
    win.dispatchEvent(new win.CustomEvent('perashki:themechange', { detail: value }));
  };
  const notify = (target, value) => {
    try { if (target !== win && target.location.origin === win.location.origin) target.PerashkiTheme?.receive(value); } catch {}
  };
  const notifyFrames = value => {
    for (let index = 0; index < win.frames.length; index++) notify(win.frames[index], value);
  };
  const api = {
    get: () => current,
    set: value => {
      if (!valid(value)) return;
      explicit = value;
      try {
        win.localStorage.setItem(key, value);
        // Older per-app backups and standalone versions retain the same choice.
        for (const name of legacyKeys) win.localStorage.setItem(name, value);
      } catch { /* Apply locally even if persistence is blocked. */ }
      apply(value);
      // Storage events cover other documents. Direct delivery also covers an
      // embedded workspace when the browser has disabled localStorage writes.
      notify(win.parent, value);
      notifyFrames(value);
    },
    receive: value => {
      if (valid(value) && value !== current) { explicit = value; apply(value); notifyFrames(value); }
    },
    subscribe: callback => {
      const listener = event => callback(event.detail);
      win.addEventListener('perashki:themechange', listener);
      callback(current);
      return () => win.removeEventListener('perashki:themechange', listener);
    },
  };
  win.PerashkiTheme = api;
  try {
    if (win.parent !== win && win.parent.location.origin === win.location.origin) explicit = win.parent.PerashkiTheme?.get() || explicit;
  } catch {}
  apply(explicit || (media.matches ? 'dark' : 'light'));
  win.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    explicit = read();
    apply(explicit || (media.matches ? 'dark' : 'light'));
  });
  media.addEventListener('change', () => {
    if (!explicit) apply(media.matches ? 'dark' : 'light');
  });
  return api;
}

export const themeScript = `(${installWorkspaceTheme.toString()})(window);`;
export const getWorkspaceTheme = () => installWorkspaceTheme(window).get();
export const setWorkspaceTheme = value => installWorkspaceTheme(window).set(value);
export const subscribeWorkspaceTheme = callback => installWorkspaceTheme(window).subscribe(callback);
