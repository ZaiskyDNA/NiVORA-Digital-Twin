import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SEED } from '../../sim/engine';
import { selectViewed, useSim } from '../useSim';

const get = () => useSim.getState();

describe('store useSim', () => {
  beforeEach(() => {
    get().reset(DEFAULT_SEED);
    get().setScenario('normal');
    get().setWeights({ mweri: { wH: 0.2, wP: 0.4, wW: 0.3, wT: 0.1 }, route: { alpha: 0.3, beta: 0.5, gamma: 0.2 } });
    get().setSpeed(1);
    get().setView('nivora');
  });

  it('play / pause / toggle', () => {
    get().play();
    expect(get().running).toBe(true);
    get().pause();
    expect(get().running).toBe(false);
    get().toggle();
    expect(get().running).toBe(true);
  });

  it('setSpeed', () => {
    get().setSpeed(20);
    expect(get().speed).toBe(20);
  });

  it('tick memajukan kedua engine (NiVORA & Reaktif) bersamaan', () => {
    get().tick(5);
    expect(get().nivora.t).toBe(5);
    expect(get().reactive.t).toBe(5);
  });

  it('setScenario berlaku ke kedua engine & memicu re-routing', () => {
    get().setScenario('disruption');
    expect(get().nivora.scenarioId).toBe('disruption');
    expect(get().reactive.scenarioId).toBe('disruption');
    expect(get().nivora.recommendation?.selectedCandidate).toBe('C');
  });

  it('setWeights menormalisasi Σ = 1 dan berlaku ke kedua engine', () => {
    get().setWeights({ route: { alpha: 2, beta: 1, gamma: 1 } });
    const w = get().nivora.weights.route;
    expect(w.alpha + w.beta + w.gamma).toBeCloseTo(1, 12);
    expect(w.alpha).toBeCloseTo(0.5, 12);
    expect(get().reactive.weights.route).toEqual(w);
  });

  it('reset mempertahankan skenario & bobot, mengembalikan waktu ke 0', () => {
    get().setScenario('surge');
    get().tick(10);
    get().play();
    get().reset();
    expect(get().nivora.t).toBe(0);
    expect(get().nivora.scenarioId).toBe('surge');
    expect(get().running).toBe(false);
  });

  it('selectViewed mengikuti mode tampilan', () => {
    get().setView('reactive');
    expect(selectViewed(get()).policy).toBe('reactive');
  });
});
