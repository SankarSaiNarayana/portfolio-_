/** Cobalt-only site — sync browser chrome color. */
const META_THEME_COLOR = '#000000';

export function syncMetaThemeColor() {
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', META_THEME_COLOR);
}

export function initTheme() {
  try {
    localStorage.removeItem('portfolio-theme');
    localStorage.removeItem('portfolio-appearance');
  } catch {
    /* ignore */
  }
  syncMetaThemeColor();
}
