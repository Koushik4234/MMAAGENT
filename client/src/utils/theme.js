const KEY = 'va_theme';

/** Saved choice ('light' | 'dark'), defaulting to light. */
export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage blocked: fall back to light */
  }
  return 'light';
}

/** Switches the whole app by setting <html data-theme="...">, and remembers the choice. */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}