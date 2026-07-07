export type Theme = 'light' | 'dark' | 'oled' | 'sepia'

const STORAGE_KEY = 'schloss-theme'
const THEMES: Theme[] = ['light', 'dark', 'oled', 'sepia']

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored && THEMES.includes(stored)) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export { THEMES }
