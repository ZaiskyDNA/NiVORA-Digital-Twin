/**
 * Jembatan store → scene (§13.8). Satu objek mutable berisi state engine sebelumnya & sekarang;
 * dibaca langsung di useFrame (tanpa re-render React). `tickAlpha` = posisi di antara dua tick
 * untuk interpolasi gerak (§13.4).
 */
import type { SimState } from '../sim/engine';
import { selectViewed, useSim, type SimStore } from '../store/useSim';

interface SimFrame {
  prev: SimState;
  curr: SimState;
  lastTickAt: number;
  tickMs: number;
  running: boolean;
}

const initial = selectViewed(useSim.getState());

export const simFrame: SimFrame = {
  prev: initial,
  curr: initial,
  lastTickAt: 0,
  tickMs: 1000,
  running: false,
};

function apply(s: SimStore): void {
  const viewed = selectViewed(s);
  if (viewed !== simFrame.curr) {
    // Interpolasi hanya antar-tick berurutan pada engine yang sama; selain itu lompat langsung.
    const continuous = viewed.policy === simFrame.curr.policy && viewed.t > simFrame.curr.t;
    simFrame.prev = continuous ? simFrame.curr : viewed;
    simFrame.curr = viewed;
  }
  simFrame.lastTickAt = s.lastTickAt;
  simFrame.tickMs = 1000 / s.speed;
  simFrame.running = s.running;
}

/** Mulai sinkronisasi; kembalikan fungsi berhenti. */
export function syncSimFrame(): () => void {
  apply(useSim.getState());
  return useSim.subscribe(apply);
}

/** 0 → state `prev`, 1 → state `curr`. Saat jeda selalu 1. */
export function tickAlpha(now: number): number {
  if (!simFrame.running) return 1;
  const a = (now - simFrame.lastTickAt) / simFrame.tickMs;
  return a < 0 ? 0 : a > 1 ? 1 : a;
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
