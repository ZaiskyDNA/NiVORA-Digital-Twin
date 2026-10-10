/**
 * Kontras WCAG 2.1 AA di KEDUA tema: teks ≥ 4.5:1, elemen grafis & batas kontrol ≥ 3:1.
 * Dihitung dari tokens.css, jadi mengubah warna yang melanggar langsung menggagalkan test.
 */
import { describe, expect, it } from 'vitest';
import { PALETTE, THEMES, type Theme } from '../tokens';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** Warna `fg` dengan alpha di atas `bg` (tint status = 16%). */
const over = (fg: string, bg: string, alpha: number) => {
  const f = rgb(fg);
  const b = rgb(bg);
  return `#${f.map((v, i) => Math.round(v * alpha + b[i]! * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`;
};

const SURFACES = ['surface0', 'surface1', 'surface2'];
const STATUSES = ['normal', 'warning', 'critical', 'high'];

describe.each(THEMES)('kontras tema %s', (theme: Theme) => {
  const p = PALETTE[theme];
  const t = (k: string) => p[k]!;

  it.each(['fg', 'fg2', 'normalFg', 'warningFg', 'criticalFg', 'highFg', 'accent', 'safe'])(
    'teks %s ≥ 4.5:1 di semua surface',
    (key) => {
      for (const s of SURFACES) expect(contrast(t(key), t(s)), `${key} di ${s}`).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('teks muted fg3 ≥ 4.5:1 di surface polos (0 & 1)', () => {
    for (const s of ['surface0', 'surface1']) expect(contrast(t('fg3'), t(s))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(STATUSES)('teks %s-fg & fg2 ≥ 4.5:1 di atas tint statusnya', (status) => {
    for (const s of SURFACES) {
      const tint = over(t(status), t(s), 0.16);
      expect(contrast(t(`${status}Fg`), tint), `${status}Fg di tint/${s}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t('fg2'), tint), `fg2 di tint/${s}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(STATUSES)('teks on-status ≥ 4.5:1 di atas fill %s', (status) => {
    expect(contrast(t('onStatus'), t(status))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([...STATUSES, 'safe', 'accent', 'worker', 'lineControl'])('grafis %s ≥ 3:1 di surface & lantai scene', (key) => {
    for (const s of [...SURFACES, 'floor']) expect(contrast(t(key), t(s)), `${key} di ${s}`).toBeGreaterThanOrEqual(3);
  });

  it('label fasilitas di scene (teks berwarna tepi) ≥ 4.5:1 di surface-0', () => {
    for (const k of ['Smelter', 'Crusher', 'Reprocessing', 'Recovery', 'Treatment', 'Disposal', 'Stockpile']) {
      expect(contrast(t(`scene${k}Edge`), t('surface0')), k).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.runIf(theme === 'light')('outline beacon & safe route ≥ 3:1 terhadap lantai (pengganti Bloom)', () => {
    expect(contrast(t('sceneOutline'), t('floor'))).toBeGreaterThanOrEqual(3);
  });
});
