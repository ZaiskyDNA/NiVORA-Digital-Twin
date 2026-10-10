import { describe, expect, it } from 'vitest';
import css from '../tokens.css?raw';
import { color, PALETTE, parseTheme, THEMES } from '../tokens';

describe('token warna per tema', () => {
  it('kedua tema mendefinisikan himpunan token yang sama persis', () => {
    expect(Object.keys(PALETTE.light).sort()).toEqual(Object.keys(PALETTE.dark).sort());
    expect(Object.keys(PALETTE.dark).length).toBeGreaterThan(60);
  });

  it('setiap token @theme menunjuk ke nilai per tema yang ada', () => {
    const refs = [...css.matchAll(/--color-[a-z0-9-]+:\s*var\(--nv-([a-z0-9-]+)\)/g)].map((m) => m[1]!);
    expect(refs.length).toBeGreaterThan(60);
    for (const theme of THEMES) {
      const defined = new Set([...css.slice(css.indexOf(`[data-theme='${theme}']`)).matchAll(/--nv-([a-z0-9-]+):/g)].map((m) => m[1]));
      for (const name of refs) expect(defined.has(name), `${theme}: --nv-${name}`).toBe(true);
    }
  });

  it('tidak ada hex warna di @theme — nilai hanya di blok [data-theme]', () => {
    const theme = css.slice(css.indexOf('@theme {'), css.indexOf("[data-theme='dark']"));
    expect(theme.match(/#[0-9a-fA-F]{6}\b/g)).toBeNull();
  });

  it('parser membaca nilai & melempar untuk token/tema yang tidak ada', () => {
    expect(parseTheme("[data-theme='dark'] {\n  --nv-surface-0: #0B1424;\n}", 'dark')).toEqual({ surface0: '#0b1424' });
    expect(() => parseTheme('', 'light')).toThrow();
    expect(() => color('dark', 'tidakAda')).toThrow();
    expect(color('light', 'surface0')).toBe('#ffffff');
  });
});
