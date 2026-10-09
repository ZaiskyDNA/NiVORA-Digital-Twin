/**
 * Generator data sensor sintetis per node (§5.6 langkah 1).
 * Jumlah draw RNG per tick SELALU sama (3 normal + 1 uniform per node) agar mode NiVORA
 * dan Reaktif menerima derau lingkungan yang identik (§13.5).
 */
import type { NodeDynamics } from '../config/plant';
import type { Scenario } from '../config/scenarios';
import { clamp } from './mweri';
import { nextFloat, nextNormal, type RngState } from './rng';
import type { NodeState } from './types';

export interface SensorContext {
  scenario: Scenario;
  dynamics: Record<string, NodeDynamics>;
  rng: RngState;
  /** Zona yang sedang dilintasi truk → debu tambahan. */
  dustZones: ReadonlySet<string>;
  dustBoost: number;
  exposureWindowMin: number;
  /** Ambang PM untuk menghitung paparan (§9: zona dengan PM ≥ 5). */
  exposurePm: number;
}

/** Laju relaksasi PM menuju targetnya per menit. */
const PM_RELAX = 0.25;

/** Target skor PM: aktivitas × (0.7 + 0.6 × residu/100) + debu truk. */
export function pmTarget(node: NodeState, dyn: NodeDynamics, ctx: SensorContext): number {
  const fromActivity = dyn.pmBase * ctx.scenario.pmMultiplier * (0.7 + (0.6 * node.residueLevel) / 100);
  return fromActivity + (ctx.dustZones.has(node.zoneId) ? ctx.dustBoost : 0);
}

/** Perbarui sensor semua node (memutasi `nodes` — panggil pada salinan state). */
export function updateSensors(nodes: NodeState[], ctx: SensorContext): void {
  for (const node of nodes) {
    const dyn = ctx.dynamics[node.id];
    // Draw tetap dilakukan walau dinamika tidak ada, agar urutan stream stabil.
    const nResidue = nextNormal(ctx.rng);
    const nPm = nextNormal(ctx.rng);
    const uWorker = nextFloat(ctx.rng);
    if (!dyn) continue;

    node.residueLevel = clamp(
      node.residueLevel + dyn.accumulation * ctx.scenario.productionRate + nResidue * 0.05,
      0,
      100,
    );

    node.pm = clamp(node.pm + (pmTarget(node, dyn, ctx) - node.pm) * PM_RELAX + nPm * 0.15);

    // Random walk jumlah pekerja (berbasis zona, tanpa identitas).
    const step = uWorker < 0.12 ? -1 : uWorker > 0.88 ? 1 : 0;
    node.workers = Math.round(clamp(node.workers + step, dyn.workersMin, dyn.workersMax));

    // Jendela paparan bergulir (§13.4).
    node.exposureWindow.push(node.workers > 0 && node.pm >= ctx.exposurePm ? 1 : 0);
    while (node.exposureWindow.length > ctx.exposureWindowMin) node.exposureWindow.shift();
    node.exposureMin = node.exposureWindow.reduce((a, b) => a + b, 0);
  }
}

/** Jendela paparan awal yang konsisten dengan `exposureMin` seed (menit terpapar di ujung jendela). */
export function initialExposureWindow(exposureMin: number, windowMin: number): number[] {
  const n = Math.max(0, Math.min(windowMin, Math.round(exposureMin)));
  return [...Array<number>(windowMin - n).fill(0), ...Array<number>(n).fill(1)];
}
