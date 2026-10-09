/**
 * Store simulasi (zustand). Memegang DUA engine dengan seed sama (§13.5):
 * `nivora` (ditampilkan) dan `reactive` (headless, baseline KPI). Logika ada di src/sim/.
 */
import { create } from 'zustand';
import type { ScenarioId } from '../config/scenarios';
import {
  createInitialState,
  DEFAULT_SEED,
  runTicks,
  setScenario as engineSetScenario,
  setWeights as engineSetWeights,
  type Policy,
  type SimState,
  type SimWeights,
} from '../sim/engine';
import { normalizeWeights } from '../sim/mweri';
import type { MweriWeights, RouteWeights } from '../sim/types';

export type Speed = 1 | 5 | 20;
export const SPEEDS: readonly Speed[] = [1, 5, 20];

export interface WeightsPatch {
  mweri?: Partial<MweriWeights>;
  route?: Partial<RouteWeights>;
}

export interface SimStore {
  nivora: SimState;
  reactive: SimState;
  running: boolean;
  speed: Speed;
  /** Mode yang ditampilkan scene (toggle "Reaktif vs NiVORA"). */
  view: Policy;
  /** performance.now() saat tick terakhir — dasar interpolasi scene (§13.4). */
  lastTickAt: number;

  play: () => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (speed: Speed) => void;
  setScenario: (id: ScenarioId) => void;
  /** Bobot dinormalisasi otomatis agar Σ = 1. */
  setWeights: (patch: WeightsPatch) => void;
  setView: (view: Policy) => void;
  /** Maju `n` tick (dipanggil clock, atau tombol "step" saat jeda). */
  tick: (n?: number) => void;
  reset: (seed?: number) => void;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

const initial = (seed: number) => ({
  nivora: createInitialState({ seed, policy: 'nivora' }),
  reactive: createInitialState({ seed, policy: 'reactive' }),
});

export const useSim = create<SimStore>()((set, get) => ({
  ...initial(DEFAULT_SEED),
  running: false,
  speed: 1,
  view: 'nivora',
  lastTickAt: 0,

  play: () => set({ running: true, lastTickAt: now() }),
  pause: () => set({ running: false }),
  toggle: () => (get().running ? get().pause() : get().play()),
  setSpeed: (speed) => set({ speed }),

  setScenario: (id) =>
    set((s) => ({ nivora: engineSetScenario(s.nivora, id), reactive: engineSetScenario(s.reactive, id) })),

  setWeights: (patch) =>
    set((s) => {
      const cur = s.nivora.weights;
      const weights: SimWeights = {
        mweri: patch.mweri ? normalizeWeights({ ...cur.mweri, ...patch.mweri }) : cur.mweri,
        route: patch.route ? normalizeWeights({ ...cur.route, ...patch.route }) : cur.route,
      };
      return { nivora: engineSetWeights(s.nivora, weights), reactive: engineSetWeights(s.reactive, weights) };
    }),

  setView: (view) => set({ view }),

  tick: (n = 1) =>
    set((s) => ({ nivora: runTicks(s.nivora, n), reactive: runTicks(s.reactive, n), lastTickAt: now() })),

  reset: (seed) => {
    const { nivora } = get();
    const fresh = initial(seed ?? nivora.seed);
    // Pertahankan skenario & bobot yang sedang dipilih.
    set({
      nivora: engineSetWeights(engineSetScenario(fresh.nivora, nivora.scenarioId), nivora.weights),
      reactive: engineSetWeights(engineSetScenario(fresh.reactive, nivora.scenarioId), nivora.weights),
      running: false,
      lastTickAt: now(),
    });
  },
}));

/** State engine yang sedang ditampilkan. */
export const selectViewed = (s: SimStore): SimState => (s.view === 'nivora' ? s.nivora : s.reactive);

declare global {
  interface Window {
    /** Hanya mode dev: akses store untuk debugging & pengujian end-to-end. */
    __nivoraSim?: typeof useSim;
  }
}
if (import.meta.env.DEV && typeof window !== 'undefined') window.__nivoraSim = useSim;
