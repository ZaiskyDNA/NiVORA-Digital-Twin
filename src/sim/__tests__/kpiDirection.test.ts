/**
 * Arah perbedaan KPI 3P NiVORA vs baseline reaktif di ketiga skenario (bukan nilai persis —
 * angkanya ilustratif dan boleh berubah bila dinamika disetel ulang). Kedua engine memakai seed
 * yang sama, jadi input sensornya identik dan perbedaan murni berasal dari kebijakan (§13.5).
 */
import { describe, expect, it } from 'vitest';
import { SCENARIO_ORDER, type ScenarioId } from '../../config/scenarios';
import { kpiTiles } from '../../ui/viewModels';
import { createInitialState, runTicks, setScenario, type Policy, type SimState } from '../engine';
import { summarize } from '../metrics';

/** Satu shift penuh. */
const SHIFT = 480;
const run = (policy: Policy, scenario: ScenarioId, ticks = SHIFT, seed?: number): SimState =>
  runTicks(setScenario(createInitialState({ policy, seed }), scenario), ticks);

describe.each(SCENARIO_ORDER)('KPI 3P · skenario %s', (scenario) => {
  const n = run('nivora', scenario);
  const r = run('reactive', scenario);
  const kn = summarize(n.metrics);
  const kr = summarize(r.metrics);

  it('People: dosis paparan NiVORA jelas lebih rendah (≥ 5%)', () => {
    expect(kn.people.exposureDose).toBeLessThan(kr.people.exposureDose * 0.95);
  });

  it('People: durasi paparan setara atau lebih baik (toleransi 2%)', () => {
    // Saat Surge PM hampir selalu di atas ambang di kedua mode → durasi praktis sama; yang
    // membedakan adalah intensitas, yang ditangkap oleh dosis.
    expect(kn.people.exposureTotal).toBeLessThanOrEqual(kr.people.exposureTotal * 1.02);
  });

  it('Planet: recovery rate NiVORA lebih tinggi', () => {
    expect(kn.planet.recoveryRate).not.toBeNull();
    expect(kn.planet.recoveryRate!).toBeGreaterThan(kr.planet.recoveryRate!);
  });

  it('Productivity: NiVORA tidak mengirim trip yang tidak perlu; reaktif (jadwal tetap) mengirimnya', () => {
    expect(kn.productivity.trips).toBeGreaterThan(0);
    expect(kn.productivity.unnecessaryTrips).toBe(0);
    expect(kr.productivity.unnecessaryTrips).toBeGreaterThan(0);
    expect(kn.productivity.usefulTripRate!).toBeGreaterThan(kr.productivity.usefulTripRate!);
  });

  it('kartu KPI: ketiganya bernilai (bukan "—") dan ditandai lebih baik', () => {
    const tiles = kpiTiles(n, r);
    expect(tiles.map((t) => t.key)).toEqual(['people', 'planet', 'productivity']);
    for (const t of tiles) {
      expect(t.value, t.key).not.toBe('—');
      expect(t.trend, t.key).toBe('better');
    }
    expect(tiles[0]!.direction).toBe('down');
  });

  it('kejujuran trade-off: safe route lebih panjang → jarak tempuh NiVORA tidak lebih pendek', () => {
    expect(kn.productivity.distance).toBeGreaterThanOrEqual(kr.productivity.distance);
  });
});

describe('KPI 3P · ketahanan', () => {
  it('Production Surge: People tidak lagi ±0% walau PM selalu di atas ambang di kedua mode', () => {
    const people = kpiTiles(run('nivora', 'surge', 240), run('reactive', 'surge', 240))[0]!;
    expect(people.value).not.toBe('±0%');
    expect(people.trend).toBe('better');
  });

  it.each([7, 1234, 987654])('arah People & Productivity sama pada seed lain (%i)', (seed) => {
    for (const scenario of SCENARIO_ORDER) {
      const kn = summarize(run('nivora', scenario, SHIFT, seed).metrics);
      const kr = summarize(run('reactive', scenario, SHIFT, seed).metrics);
      expect(kn.people.exposureDose, `${scenario} dosis`).toBeLessThan(kr.people.exposureDose);
      expect(kn.productivity.usefulTripRate!, `${scenario} trip`).toBeGreaterThanOrEqual(kr.productivity.usefulTripRate!);
    }
  });
});
