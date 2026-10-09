import { describe, expect, it } from 'vitest';
import { linearRegression, predict, project, timeToCritical } from '../digitalTwin';
import type { HistorySample } from '../types';
import { expectNear } from './helpers';

/** History sintetis linear: mweri = m0 + ms·t, level = l0 + ls·t. */
const linear = (n: number, m0: number, ms: number, l0: number, ls: number, t0 = 0): HistorySample[] =>
  Array.from({ length: n }, (_, i) => ({ t: t0 + i, mweri: m0 + ms * i, level: l0 + ls * i }));

describe('Regresi linear', () => {
  it('memulihkan slope & intercept data linear sempurna', () => {
    const fit = linearRegression([0, 1, 2, 3, 4].map((x) => ({ x, y: 3 + 2 * x })));
    expectNear(fit?.slope, 2);
    expectNear(fit?.intercept, 3);
  });

  it('least squares pada data berderau simetris', () => {
    // y = 1 + x dengan noise ±1 bergantian yang saling meniadakan.
    const pts = [0, 1, 2, 3].map((x, i) => ({ x, y: 1 + x + (i % 2 === 0 ? 1 : -1) }));
    const fit = linearRegression(pts);
    expectNear(fit?.slope, 0.6);
  });

  it('null bila < 2 titik atau x konstan', () => {
    expect(linearRegression([{ x: 1, y: 1 }])).toBeNull();
    expect(linearRegression([{ x: 1, y: 1 }, { x: 1, y: 5 }])).toBeNull();
  });
});

describe('Time-to-critical (§5.3)', () => {
  it('memprediksi ttc dengan benar pada data sintetis linear', () => {
    // MWERI 5.0 naik 0.1/menit selama 20 menit → sekarang 6.9; ambang 8 → (8 − 6.9) / 0.1 = 11 menit.
    const h = linear(20, 5, 0.1, 40, 0.5);
    expectNear(timeToCritical(h, 'mweri', 8), 11);
    // Level 40 naik 0.5/menit → sekarang 49.5; ambang 85 → 71 menit.
    expectNear(timeToCritical(h, 'level', 85), 71);
  });

  it('hanya memakai 20 sampel terakhir', () => {
    // 30 sampel datar lalu 20 sampel naik 0.2/menit: regresi atas jendela 20 harus melihat slope 0.2.
    const flat = linear(30, 4, 0, 50, 0);
    const rising = linear(20, 4, 0.2, 50, 0, 30);
    const h = [...flat, ...rising];
    const current = 4 + 0.2 * 19;
    expectNear(timeToCritical(h, 'mweri', 8), (8 - current) / 0.2);
  });

  it('null bila tren datar atau turun', () => {
    expect(timeToCritical(linear(20, 5, 0, 50, 0), 'mweri', 8)).toBeNull();
    expect(timeToCritical(linear(20, 7, -0.1, 50, 0), 'mweri', 8)).toBeNull();
  });

  it('0 bila sudah di/atas ambang; null bila history kosong', () => {
    expect(timeToCritical(linear(5, 8.4, 0.1, 0, 0), 'mweri', 8)).toBe(0);
    expect(timeToCritical([], 'mweri', 8)).toBeNull();
  });

  it('predict mengambil yang tercepat dari MWERI & level, plus slope level', () => {
    const p = predict(linear(20, 5, 0.1, 40, 0.5));
    expectNear(p.ttcMweri, 11);
    expectNear(p.ttcLevel, 71);
    expectNear(p.ttc, 11);
    expectNear(p.levelSlope, 0.5);
  });

  it('project memberi titik awal & akhir garis proyeksi', () => {
    const pts = project(linear(20, 5, 0.1, 40, 0.5), 'mweri', 30);
    expect(pts).toHaveLength(2);
    expectNear(pts[0]?.x, 19);
    expectNear(pts[1]?.x, 49);
    expectNear(pts[1]?.y, 6.9 + 3);
  });
});
