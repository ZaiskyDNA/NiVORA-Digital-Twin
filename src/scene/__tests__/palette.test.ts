import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../styles/tokens';
import { SCENE_PALETTE } from '../palette';
import { buildRouteLabels, buildSceneLabels } from '../sceneLabels';
import { createInitialState } from '../../sim/engine';

describe('palet scene per tema', () => {
  it('Bloom hanya di tema gelap; tema terang tanpa pengali HDR', () => {
    expect(SCENE_PALETTE.dark.bloom).toMatchObject({ enabled: true });
    expect(SCENE_PALETTE.dark.bloom.beacon).toBeGreaterThan(1);
    expect(SCENE_PALETTE.light.bloom).toEqual({ enabled: false, beacon: 1, safeRoute: 1, truckLight: 1 });
  });

  it('semua warna palet berasal dari token tema yang sama', () => {
    for (const theme of ['dark', 'light'] as const) {
      const tokens = new Set(Object.values(PALETTE[theme]));
      const walk = (v: unknown): void => {
        if (typeof v === 'string' && v.startsWith('#')) expect(tokens.has(v), `${theme}: ${v}`).toBe(true);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      };
      walk(SCENE_PALETTE[theme]);
    }
  });

  it('kedua tema berbeda untuk lantai, bangunan, cahaya, dan bayangan', () => {
    const { dark, light } = SCENE_PALETTE;
    expect(light.floor).not.toBe(dark.floor);
    expect(light.facility.smelter.body).not.toBe(dark.facility.smelter.body);
    expect(light.light.ambient).toBeGreaterThan(dark.light.ambient);
    expect(light.shadow.opacity).toBeLessThan(dark.shadow.opacity);
    expect(light.dustAdditive).toBe(false);
  });

  it('label scene memakai warna tema yang diminta', () => {
    const s = createInitialState();
    const light = SCENE_PALETTE.light;
    const labels = buildSceneLabels(s.nodes, { destination: 'reprocessing', palette: light });
    expect(labels.find((l) => l.id === 'facility-reprocessing')?.color).toBe(light.facility.reprocessing.edge);
    expect(labels.find((l) => l.id === 'zone-wz-high')?.color).toBe(light.criticalText);
    expect(buildRouteLabels(s, light)[0]?.color).toBe(light.safe);
  });
});
