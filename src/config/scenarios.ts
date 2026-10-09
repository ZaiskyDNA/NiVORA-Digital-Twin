/** Skenario demo (§8, Lampiran 5 esai). Nilai ilustratif. */
import { DISRUPTION_EDGE_ID } from './plant';

export type ScenarioId = 'normal' | 'surge' | 'disruption';

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Pengali laju akumulasi residu. */
  productionRate: number;
  /** Pengali PM dasar (aktivitas crusher/conveyor). */
  pmMultiplier: number;
  /** Edge yang diblokir (barikade 3D). */
  disabledEdges: string[];
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  normal: {
    id: 'normal',
    label: 'Normal Operation',
    description: 'Laju produksi 1.0×, PM stabil — pemantauan rutin.',
    productionRate: 1,
    pmMultiplier: 1,
    disabledEdges: [],
  },
  surge: {
    id: 'surge',
    label: 'Production Surge',
    description: 'Laju produksi 1.8×, PM naik — Node A cepat menuju critical.',
    productionRate: 1.8,
    pmMultiplier: 1.35,
    disabledEdges: [],
  },
  disruption: {
    id: 'disruption',
    label: 'Route Disruption',
    description: 'Ruas kunci safe route diblokir — sistem mencari rute alternatif teraman.',
    productionRate: 1,
    pmMultiplier: 1,
    disabledEdges: [DISRUPTION_EDGE_ID],
  },
};

export const SCENARIO_ORDER: ScenarioId[] = ['normal', 'surge', 'disruption'];
