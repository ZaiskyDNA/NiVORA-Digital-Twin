/**
 * Warna token per tema untuk kode yang tidak bisa membaca CSS (three.js, test kontras).
 * Nilainya DI-PARSE dari blok `[data-theme]` di tokens.css — tidak ada hex di TypeScript, jadi
 * tokens.css tetap satu-satunya sumber kebenaran.
 */
import css from './tokens.css?raw';

export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export type Palette = Readonly<Record<string, string>>;

/** kebab-case → camelCase (surface-0 → surface0, scene-grid-cell → sceneGridCell). */
const camel = (name: string): string => name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Ambil semua `--nv-<nama>: #hex;` dari blok `[data-theme='<tema>']`. */
export function parseTheme(source: string, theme: Theme): Palette {
  const start = source.indexOf(`[data-theme='${theme}'] {`);
  if (start < 0) throw new Error(`Blok tema "${theme}" tidak ditemukan di tokens.css`);
  const block = source.slice(start, source.indexOf('\n}', start));
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--nv-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    out[camel(m[1] ?? '')] = (m[2] ?? '').toLowerCase();
  }
  return out;
}

export const PALETTE: Readonly<Record<Theme, Palette>> = {
  dark: parseTheme(css, 'dark'),
  light: parseTheme(css, 'light'),
};

/** Warna token; melempar bila nama salah ketik agar tidak diam-diam menjadi hitam di scene. */
export function color(theme: Theme, key: string): string {
  const value = PALETTE[theme][key];
  if (!value) throw new Error(`Token warna "${key}" tidak ada di tema ${theme}`);
  return value;
}
