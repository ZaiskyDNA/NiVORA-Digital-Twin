import { describe, expect, it } from 'vitest';
import { compareKpi, createMetrics, percentChange, recordArrival, recordDispatch, recordTick, summarize } from '../metrics';
import type { NodeState } from '../types';
import { expectNear } from './helpers';

const n = (pm: number, workers: number, mweri: number) => ({ pm, workers, mweri }) as NodeState;
const OPTS = { shiftMin: 480, exposurePm: 5 };

describe('KPI 3P (§9)', () => {
  it('paparan = pekerja-menit hanya di zona dengan PM ≥ 5; rata-rata MWERI', () => {
    const m = createMetrics();
    recordTick(m, 1, [n(6, 4, 8), n(4.9, 10, 2)], OPTS);
    recordTick(m, 2, [n(5, 3, 6), n(2, 0, 0)], OPTS);
    const k = summarize(m);
    expect(k.people.exposureShift).toBe(7);
    // Dosis menimbang intensitas: 4 pekerja × 0.6 + 3 pekerja × 0.5; zona di bawah ambang tidak dihitung.
    expectNear(k.people.exposureDose, 4 * 0.6 + 3 * 0.5);
    expectNear(k.people.avgMweri, (5 + 3) / 2);
  });

  it('paparan per shift di-reset setiap 8 jam; total tetap kumulatif (§13.4)', () => {
    const m = createMetrics();
    recordTick(m, 479, [n(6, 2, 0)], OPTS);
    recordTick(m, 480, [n(6, 3, 0)], OPTS);
    expect(m.exposureShift).toBe(3);
    expect(m.exposureTotal).toBe(5);
  });

  it('recovery rate, waste-to-disposal, trip tidak perlu', () => {
    const m = createMetrics();
    recordDispatch(m, 4, 'critical');
    recordDispatch(m, 2, 'normal');
    recordDispatch(m, 3, 'warning', true); // muatan rendah → juga tidak perlu
    recordArrival(m, 40, 'reuse');
    recordArrival(m, 30, 'recovery');
    recordArrival(m, 20, 'treatment');
    recordArrival(m, 10, 'disposal');
    const k = summarize(m);
    expectNear(k.planet.recoveryRate, 0.7);
    expectNear(k.planet.wasteToDisposal, 0.1);
    expect(k.productivity).toMatchObject({ trips: 3, unnecessaryTrips: 2, distance: 9 });
    expectNear(k.productivity.usefulTripRate, 1 / 3);
  });

  it('KPI kosong → null, bukan NaN', () => {
    const k = summarize(createMetrics());
    expect(k.people.avgMweri).toBeNull();
    expect(k.planet.recoveryRate).toBeNull();
    expect(k.productivity.usefulTripRate).toBeNull();
    expect(k.people.exposureDose).toBe(0);
  });

  it('persen perubahan terhadap baseline reaktif', () => {
    expectNear(percentChange(59, 100), -41);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(null, 3)).toBeNull();
    const a = createMetrics();
    const b = createMetrics();
    a.exposureTotal = 50;
    b.exposureTotal = 100;
    expectNear(compareKpi(summarize(a), summarize(b)).exposure, -50);
  });
});
