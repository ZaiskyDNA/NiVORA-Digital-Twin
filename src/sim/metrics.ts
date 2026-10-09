/**
 * KPI 3P — People / Planet / Productivity (§9).
 * Akumulator disimpan di SimState; fungsi di sini memutasi akumulator pada salinan state.
 */
import type { PathwayStage } from './pathway';
import type { NodeState, Status } from './types';

export interface MetricsAcc {
  /** Pekerja-menit di zona dengan PM ≥ ambang, shift berjalan (reset tiap 8 jam, §13.4). */
  exposureShift: number;
  /** Sama, kumulatif sejak awal sesi. */
  exposureTotal: number;
  shiftIndex: number;
  mweriSum: number;
  mweriSamples: number;
  handled: number; // total residu ditangani (% level)
  recovered: number; // ke reuse / recycle / recovery
  disposed: number; // ke safe disposal
  trips: number;
  unnecessaryTrips: number;
  distance: number; // Σ D rute
}

export const createMetrics = (): MetricsAcc => ({
  exposureShift: 0,
  exposureTotal: 0,
  shiftIndex: 0,
  mweriSum: 0,
  mweriSamples: 0,
  handled: 0,
  recovered: 0,
  disposed: 0,
  trips: 0,
  unnecessaryTrips: 0,
  distance: 0,
});

const RECOVERY_STAGES: ReadonlySet<PathwayStage> = new Set(['reuse', 'recycle', 'recovery']);

export function recordTick(
  m: MetricsAcc,
  t: number,
  nodes: readonly NodeState[],
  opts: { shiftMin: number; exposurePm: number },
): void {
  const shift = Math.floor(t / opts.shiftMin);
  if (shift !== m.shiftIndex) {
    m.shiftIndex = shift;
    m.exposureShift = 0;
  }
  let exposed = 0;
  let mweri = 0;
  for (const n of nodes) {
    if (n.pm >= opts.exposurePm) exposed += n.workers;
    mweri += n.mweri;
  }
  m.exposureShift += exposed;
  m.exposureTotal += exposed;
  if (nodes.length > 0) {
    m.mweriSum += mweri / nodes.length;
    m.mweriSamples += 1;
  }
}

export function recordDispatch(m: MetricsAcc, distance: number, nodeStatus: Status): void {
  m.trips += 1;
  m.distance += distance;
  if (nodeStatus === 'normal') m.unnecessaryTrips += 1;
}

export function recordArrival(m: MetricsAcc, amount: number, stage: PathwayStage): void {
  m.handled += amount;
  if (RECOVERY_STAGES.has(stage)) m.recovered += amount;
  if (stage === 'disposal') m.disposed += amount;
}

export interface Kpi {
  people: { exposureShift: number; exposureTotal: number; avgMweri: number | null };
  planet: { recoveryRate: number | null; wasteToDisposal: number | null };
  productivity: { trips: number; unnecessaryTrips: number; distance: number };
}

export function summarize(m: MetricsAcc): Kpi {
  return {
    people: {
      exposureShift: m.exposureShift,
      exposureTotal: m.exposureTotal,
      avgMweri: m.mweriSamples > 0 ? m.mweriSum / m.mweriSamples : null,
    },
    planet: {
      recoveryRate: m.handled > 0 ? m.recovered / m.handled : null,
      wasteToDisposal: m.handled > 0 ? m.disposed / m.handled : null,
    },
    productivity: { trips: m.trips, unnecessaryTrips: m.unnecessaryTrips, distance: m.distance },
  };
}

/** Persen perubahan NiVORA terhadap baseline reaktif; null bila baseline 0 atau tidak ada. */
export function percentChange(nivora: number | null, reactive: number | null): number | null {
  if (nivora === null || reactive === null || reactive === 0) return null;
  return ((nivora - reactive) / reactive) * 100;
}

export interface KpiComparison {
  exposure: number | null;
  avgMweri: number | null;
  recoveryRate: number | null;
  trips: number | null;
  unnecessaryTrips: number | null;
  distance: number | null;
}

export function compareKpi(nivora: Kpi, reactive: Kpi): KpiComparison {
  return {
    exposure: percentChange(nivora.people.exposureTotal, reactive.people.exposureTotal),
    avgMweri: percentChange(nivora.people.avgMweri, reactive.people.avgMweri),
    recoveryRate: percentChange(nivora.planet.recoveryRate, reactive.planet.recoveryRate),
    trips: percentChange(nivora.productivity.trips, reactive.productivity.trips),
    unnecessaryTrips: percentChange(nivora.productivity.unnecessaryTrips, reactive.productivity.unnecessaryTrips),
    distance: percentChange(nivora.productivity.distance, reactive.productivity.distance),
  };
}
