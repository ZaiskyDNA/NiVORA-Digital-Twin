/**
 * Tema tampilan (gelap/terang). Default gelap; pilihan pengguna disimpan di localStorage.
 * `prefers-color-scheme` hanya dihormati selama belum ada pilihan tersimpan. Atribut
 * `data-theme` di <html> menggerakkan semua token CSS; scene 3D membaca store ini.
 */
import { create } from 'zustand';
import type { Theme } from '../styles/tokens';

export const THEME_KEY = 'nivora-theme';
/** Durasi transisi tema (ms) — selaras dengan --duration-base. */
const TRANSITION_MS = 220;

const isTheme = (v: unknown): v is Theme => v === 'dark' || v === 'light';

/** Pilihan tersimpan; null bila belum ada atau penyimpanan tidak tersedia (mode privat, iframe). */
export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

/** Tersimpan > preferensi sistem > gelap. */
export function resolveInitialTheme(stored: Theme | null, prefersLight: boolean): Theme {
  return stored ?? (prefersLight ? 'light' : 'dark');
}

const prefersLight = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: light)').matches;

function apply(theme: Theme, animate: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduced) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), TRANSITION_MS);
  }
  root.dataset.theme = theme;
  const canvas = getComputedStyle(root).getPropertyValue('--nv-canvas').trim();
  if (canvas) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas);
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeStore>()((set, get) => ({
  theme: resolveInitialTheme(readStoredTheme(), prefersLight()),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Penyimpanan ditolak: tema tetap berganti untuk sesi ini.
    }
    apply(theme, true);
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

if (typeof window !== 'undefined') {
  apply(useTheme.getState().theme, false);
  // Ikuti perubahan tema sistem hanya selama pengguna belum memilih sendiri.
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', (e) => {
    if (readStoredTheme() !== null) return;
    const theme: Theme = e.matches ? 'light' : 'dark';
    apply(theme, true);
    useTheme.setState({ theme });
  });
}
