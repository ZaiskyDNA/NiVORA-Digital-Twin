import type { MweriWeights, RouteWeights } from '../sim/types';

/** Bobot MWERI default — diturunkan dari Lampiran 4 esai (§5.1). Σ = 1. */
export const DEFAULT_MWERI_WEIGHTS: MweriWeights = { wH: 0.2, wP: 0.4, wW: 0.3, wT: 0.1 };

/** Bobot biaya rute default — diturunkan dari Lampiran 7 esai (§5.5). Σ = 1. */
export const DEFAULT_ROUTE_WEIGHTS: RouteWeights = { alpha: 0.3, beta: 0.5, gamma: 0.2 };

/** Normalisasi sensor → skor 0–10 (§5.1, §13.4). Nilai ilustratif. */
export const NORMALIZATION = {
  /** PM mentah (µg/m³, ilustratif) yang setara skor 10. */
  pmLimit: 150,
  /** Paparan (menit) dalam jendela yang setara skor T = 10. */
  exposureLimitMin: 60,
  /** Panjang jendela bergulir paparan untuk input T (§13.4). */
  exposureWindowMin: 60,
} as const;
