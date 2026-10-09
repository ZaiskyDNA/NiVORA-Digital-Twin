/**
 * MWERI — Mining Waste Exposure Risk Index (§5.1).
 *   MWERI = wH·H + wP·P + wW·W + wT·T,  Σw = 1, parameter skala 0–10.
 * Indeks prioritas, bukan instrumen diagnosis medis.
 */
import type { MweriClass, MweriParams, MweriWeights, NodeState } from './types';

export const clamp = (v: number, min = 0, max = 10): number => Math.min(max, Math.max(min, v));

/** Skor 0–10 dari rasio nilai terhadap batasnya. */
export const toScore = (value: number, limit: number): number => (limit > 0 ? clamp((value / limit) * 10) : 0);

export function computeMweri(p: MweriParams, w: MweriWeights): number {
  return w.wH * p.H + w.wP * p.P + w.wW * p.W + w.wT * p.T;
}

/** Ambil parameter MWERI dari state node. `pm` sudah berupa skor 0–10. */
export function mweriParamsOf(node: NodeState, exposureLimitMin: number): MweriParams {
  return {
    H: clamp(node.hazard),
    P: clamp(node.pm),
    W: toScore(node.workers, node.maxWorkersZone),
    T: toScore(node.exposureMin, exposureLimitMin),
  };
}

export function classifyMweri(value: number): MweriClass {
  if (value >= 8) return 'kritis';
  if (value >= 6) return 'tinggi';
  if (value >= 3) return 'sedang';
  return 'rendah';
}

/**
 * Normalisasi bobot agar Σ = 1 (untuk slider). Bobot negatif dianggap 0;
 * jika semua 0, kembali ke bobot rata.
 */
export function normalizeWeights<T extends Record<string, number>>(weights: T): T {
  const keys = Object.keys(weights) as (keyof T)[];
  const safe = keys.map((k) => Math.max(0, weights[k] ?? 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  const out = {} as Record<keyof T, number>;
  keys.forEach((k, i) => {
    out[k] = sum > 0 ? (safe[i] ?? 0) / sum : 1 / keys.length;
  });
  return out as T;
}

/** Urutkan id node berdasarkan MWERI menurun (stabil: seri → urutan id). */
export function rankByMweri(nodes: Pick<NodeState, 'id' | 'mweri'>[]): string[] {
  return [...nodes].sort((a, b) => b.mweri - a.mweri || a.id.localeCompare(b.id)).map((n) => n.id);
}
