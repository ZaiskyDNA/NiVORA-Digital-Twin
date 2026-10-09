/**
 * Circular Material Decision Pathway (§5.4).
 * Dievaluasi berurutan; berhenti di tahap pertama yang layak. Safe Disposal = pilihan terakhir.
 */
import type { Material } from './types';

export const PATHWAY_STAGES = ['reuse', 'recycle', 'recovery', 'treatment', 'disposal'] as const;
export type PathwayStage = (typeof PATHWAY_STAGES)[number];

const CRITERION: Record<Exclude<PathwayStage, 'disposal'>, keyof Material> = {
  reuse: 'compatibleWithProcess',
  recycle: 'secondaryUse',
  recovery: 'recoverableValue',
  treatment: 'treatable',
};

export interface PathwayStep {
  stage: PathwayStage;
  feasible: boolean;
}

export interface PathwayDecision {
  stage: PathwayStage;
  /** Tahap yang sudah dievaluasi sampai keputusan (untuk UI "tidak layak" vs "belum dievaluasi"). */
  evaluated: PathwayStep[];
}

export function decidePathway(material: Material): PathwayDecision {
  const evaluated: PathwayStep[] = [];
  for (const stage of PATHWAY_STAGES) {
    const feasible = stage === 'disposal' || material[CRITERION[stage]];
    evaluated.push({ stage, feasible });
    if (feasible) return { stage, evaluated };
  }
  // Tidak tercapai: 'disposal' selalu layak.
  return { stage: 'disposal', evaluated };
}
