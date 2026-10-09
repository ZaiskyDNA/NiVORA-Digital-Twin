/**
 * RNG seeded mulberry32 (§5.6). State disimpan sebagai objek data di dalam SimState
 * (bukan closure) agar ikut ter-clone saat fork what-if (§13.5).
 */

export interface RngState {
  s: number; // uint32
}

export const createRng = (seed: number): RngState => ({ s: seed >>> 0 });

/** Turunkan seed stream terpisah (mis. lingkungan vs keputusan) dari satu seed induk. */
export const deriveSeed = (seed: number, stream: number): number =>
  (Math.imul((seed ^ (stream * 0x9e3779b9)) >>> 0, 0x85ebca6b) ^ stream) >>> 0;

/** Bilangan acak [0, 1). Memajukan state. */
export function nextFloat(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const nextRange = (r: RngState, min: number, max: number): number => min + nextFloat(r) * (max - min);

export const nextInt = (r: RngState, min: number, max: number): number => Math.floor(nextRange(r, min, max + 1));

/** Normal standar (Box–Muller). Selalu memakai tepat dua draw agar urutan stream stabil. */
export function nextNormal(r: RngState): number {
  const u1 = nextFloat(r) || Number.MIN_VALUE;
  const u2 = nextFloat(r);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
