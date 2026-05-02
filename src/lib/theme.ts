export type ThemeMode = 'light' | 'dark';

const validThemes = new Set<ThemeMode>(['light', 'dark']);

export const themeStorageKey = 'ico-gen-theme';

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function readInitialTheme(storageKey = themeStorageKey): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const urlTheme = new URL(window.location.href).searchParams.get('theme');
  if (isThemeMode(urlTheme)) {
    return urlTheme;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (isThemeMode(stored)) {
    return stored;
  }

  const fluxFilesTheme = window.localStorage.getItem('fluxfiles-theme-mode');
  if (isThemeMode(fluxFilesTheme)) {
    return fluxFilesTheme;
  }

  return 'light';
}

export function applyTheme(theme: ThemeMode, storageKey = themeStorageKey) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.colorScheme = theme;
  window.localStorage.setItem(storageKey, theme);
}

export function cleanupThemeQueryParam() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const theme = url.searchParams.get('theme');
  if (!validThemes.has(theme as ThemeMode)) {
    return;
  }

  url.searchParams.delete('theme');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

