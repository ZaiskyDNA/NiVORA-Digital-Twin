import { describe, expect, it } from 'vitest';
import { NODE_SEEDS, STAGE_FACILITY } from '../../config/plant';
import { decidePathway, PATHWAY_STAGES } from '../pathway';
import type { Material } from '../types';

const NONE: Material = { compatibleWithProcess: false, secondaryUse: false, recoverableValue: false, treatable: false };

describe('Circular Material Decision Pathway (§5.4)', () => {
  it.each([
    [{ ...NONE, compatibleWithProcess: true }, 'reuse'],
    [{ ...NONE, secondaryUse: true }, 'recycle'],
    [{ ...NONE, recoverableValue: true }, 'recovery'],
    [{ ...NONE, treatable: true }, 'treatment'],
    [NONE, 'disposal'],
  ] as const)('%o → %s', (material, stage) => {
    expect(decidePathway(material).stage).toBe(stage);
  });

  it('mengembalikan tahap PERTAMA yang layak walau tahap berikutnya juga layak', () => {
    const all: Material = { compatibleWithProcess: true, secondaryUse: true, recoverableValue: true, treatable: true };
    expect(decidePathway(all).stage).toBe('reuse');
    expect(decidePathway({ ...all, compatibleWithProcess: false }).stage).toBe('recycle');
    expect(decidePathway({ ...NONE, recoverableValue: true, treatable: true }).stage).toBe('recovery');
  });

  it('mencatat tahap yang dievaluasi dan berhenti di keputusan', () => {
    const d = decidePathway({ ...NONE, recoverableValue: true });
    expect(d.evaluated).toEqual([
      { stage: 'reuse', feasible: false },
      { stage: 'recycle', feasible: false },
      { stage: 'recovery', feasible: true },
    ]);
  });

  it('Safe Disposal hanya bila semua tahap sirkular tidak layak', () => {
    const d = decidePathway(NONE);
    expect(d.evaluated.map((s) => s.stage)).toEqual([...PATHWAY_STAGES]);
    expect(d.evaluated.slice(0, -1).every((s) => !s.feasible)).toBe(true);
  });

  it('tujuan default §13.6: A → Reprocessing, B → Recovery, C → Treatment', () => {
    const dest = Object.fromEntries(NODE_SEEDS.map((n) => [n.id, STAGE_FACILITY[decidePathway(n.material).stage]]));
    expect(dest).toEqual({ A: 'reprocessing', B: 'recovery', C: 'treatment' });
  });
});
