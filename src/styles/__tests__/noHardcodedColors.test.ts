/** Tidak boleh ada warna hardcoded di luar tokens.css — komponen, scene, maupun palette.ts. */
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('/src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const COLOR_LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\b(?:rgba?|hsla?|oklch)\(/g;

describe('warna hardcoded', () => {
  const files = Object.entries(sources).filter(([p]) => !p.includes('__tests__') && !p.endsWith('/styles/tokens.css'));

  it('memeriksa seluruh sumber', () => {
    expect(files.length).toBeGreaterThan(60);
  });

  it.each(files)('%s', (_path, text) => {
    // Komentar boleh menyebut warna; yang dilarang adalah nilai di kode.
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code.match(COLOR_LITERAL) ?? []).toEqual([]);
  });
});
