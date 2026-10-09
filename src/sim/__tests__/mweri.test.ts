import { describe, expect, it } from 'vitest';
import { ESSAY_SNAPSHOT, NODE_SEEDS } from '../../config/plant';
import { DEFAULT_MWERI_WEIGHTS, NORMALIZATION } from '../../config/weights';
import {
  classifyMweri,
  computeMweri,
  mweriParamsOf,
  normalizeWeights,
  rankByMweri,
  rebalanceWeights,
  toScore,
} from '../mweri';
import type { MweriParams, NodeState } from '../types';
import { expectNear, TOL } from './helpers';

// Lampiran 4 esai.
const APPENDIX_4: Record<string, { params: MweriParams; mweri: number }> = {
  A: { params: { H: 8, P: 9, W: 9, T: 5 }, mweri: 8.4 },
  B: { params: { H: 7, P: 6, W: 3, T: 4 }, mweri: 5.1 },
  C: { params: { H: 6, P: 3, W: 0, T: 2 }, mweri: 2.6 },
};

/** Node pada potret Lampiran 4: data statis plant.ts + nilai sensor ESSAY_SNAPSHOT. */
const essayNode = (seed: (typeof NODE_SEEDS)[number]): NodeState => {
  const snap = ESSAY_SNAPSHOT[seed.id];
  if (!snap) throw new Error(`Node ${seed.id} tidak ada di ESSAY_SNAPSHOT`);
  return {
    ...seed,
    ...snap,
    status: 'normal',
    statusReasons: [],
    mweri: 0,
    ttc: null,
    levelSlope: null,
    history: [],
    exposureWindow: [],
  };
};

describe('MWERI (§5.1)', () => {
  it('bobot default berjumlah 1', () => {
    const { wH, wP, wW, wT } = DEFAULT_MWERI_WEIGHTS;
    expectNear(wH + wP + wW + wT, 1);
  });

  it.each(Object.entries(APPENDIX_4))('node %s cocok dengan Lampiran 4', (_id, { params, mweri }) => {
    expectNear(computeMweri(params, DEFAULT_MWERI_WEIGHTS), mweri);
  });

  it('ESSAY_SNAPSHOT + plant.ts menghasilkan parameter & MWERI Lampiran 4 lewat normalisasi sensor', () => {
    for (const seed of NODE_SEEDS) {
      const expected = APPENDIX_4[seed.id];
      if (!expected) throw new Error(`Node ${seed.id} tidak ada di Lampiran 4`);
      const params = mweriParamsOf(essayNode(seed), NORMALIZATION.exposureLimitMin);
      expectNear(params.H, expected.params.H);
      expectNear(params.P, expected.params.P);
      expectNear(params.W, expected.params.W);
      expectNear(params.T, expected.params.T);
      expectNear(computeMweri(params, DEFAULT_MWERI_WEIGHTS), expected.mweri);
    }
  });

  it('klasifikasi kelas di batas 3 / 6 / 8', () => {
    expect(classifyMweri(2.6)).toBe('rendah');
    expect(classifyMweri(2.999)).toBe('rendah');
    expect(classifyMweri(3)).toBe('sedang');
    expect(classifyMweri(5.1)).toBe('sedang');
    expect(classifyMweri(6)).toBe('tinggi');
    expect(classifyMweri(8)).toBe('kritis');
    expect(classifyMweri(8.4)).toBe('kritis');
  });

  it('normalisasi skor sensor di-clamp ke 0–10', () => {
    expect(toScore(75, 150)).toBe(5);
    expect(toScore(300, 150)).toBe(10);
    expect(toScore(-5, 150)).toBe(0);
    expect(toScore(5, 0)).toBe(0);
  });

  it('normalizeWeights menghasilkan Σ = 1 dan mempertahankan proporsi', () => {
    const w = normalizeWeights({ wH: 1, wP: 2, wW: 1, wT: 0 });
    expectNear(w.wH + w.wP + w.wW + w.wT, 1);
    expectNear(w.wP, 0.5);
    const zero = normalizeWeights({ a: 0, b: 0 });
    expect(zero).toEqual({ a: 0.5, b: 0.5 });
    expect(Math.abs(normalizeWeights({ a: -1, b: 3 }).b - 1)).toBeLessThanOrEqual(TOL);
  });

  it('ranking: A > B > C — Node C residu tinggi tetapi prioritas terendah', () => {
    const nodes = Object.entries(APPENDIX_4).map(([id, v]) => ({ id, mweri: v.mweri }));
    expect(rankByMweri(nodes)).toEqual(['A', 'B', 'C']);
  });
});

describe('rebalanceWeights (slider Σ = 1)', () => {
  const base = { wH: 0.2, wP: 0.4, wW: 0.3, wT: 0.1 };
  const sum = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0);

  it('Σ tetap 1 dan bobot yang digeser bernilai persis', () => {
    const w = rebalanceWeights(base, 'wW', 0.6);
    expectNear(sum(w), 1);
    expectNear(w.wW, 0.6);
  });

  it('bobot lain mempertahankan proporsi relatifnya', () => {
    const w = rebalanceWeights(base, 'wW', 0.6);
    // H : P : T = 2 : 4 : 1 berbagi sisa 0.4
    expectNear(w.wH, (0.2 / 0.7) * 0.4);
    expectNear(w.wP / w.wH, 2);
    expectNear(w.wT / w.wH, 0.5);
  });

  it('nilai 1 → bobot lain 0; nilai di luar 0–1 dijepit', () => {
    expect(rebalanceWeights(base, 'wP', 1)).toEqual({ wH: 0, wP: 1, wW: 0, wT: 0 });
    expectNear(rebalanceWeights(base, 'wP', 7).wP, 1);
    expectNear(rebalanceWeights(base, 'wP', -1).wP, 0);
  });

  it('dari kondisi bobot lain semuanya 0 → sisa dibagi rata', () => {
    const w = rebalanceWeights({ a: 1, b: 0, c: 0 }, 'a', 0.4);
    expectNear(w.b, 0.3);
    expectNear(w.c, 0.3);
  });
});
