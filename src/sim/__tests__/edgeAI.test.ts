import { describe, expect, it } from 'vitest';
import { classifyStatus } from '../edgeAI';

describe('Edge-AI rule-based (§5.2)', () => {
  it('Node A (residu 72, PM 9, MWERI 8.4) → critical karena PM & MWERI', () => {
    expect(classifyStatus({ residueLevel: 72, pm: 9, mweri: 8.4, levelSlope: 0.2 })).toEqual({
      status: 'critical',
      reasons: ['pm', 'mweri'],
    });
  });

  it('Node B (residu 54, PM 6) → warning karena PM', () => {
    expect(classifyStatus({ residueLevel: 54, pm: 6, mweri: 5.1, levelSlope: 0.1 })).toEqual({
      status: 'warning',
      reasons: ['pm'],
    });
  });

  it('Node C (residu 61, PM 3, MWERI 2.6) → WARNING (volume) — ambang tidak diubah (§13.2)', () => {
    expect(classifyStatus({ residueLevel: 61, pm: 3, mweri: 2.6, levelSlope: 0 })).toEqual({
      status: 'warning',
      reasons: ['volume'],
    });
  });

  it('batas ambang inklusif', () => {
    const base = { residueLevel: 0, pm: 0, mweri: 0, levelSlope: null };
    expect(classifyStatus({ ...base, residueLevel: 85 }).status).toBe('critical');
    expect(classifyStatus({ ...base, residueLevel: 84.9 }).status).toBe('warning');
    expect(classifyStatus({ ...base, residueLevel: 60 }).status).toBe('warning');
    expect(classifyStatus({ ...base, residueLevel: 59.9 }).status).toBe('normal');
    expect(classifyStatus({ ...base, pm: 8 }).status).toBe('critical');
    expect(classifyStatus({ ...base, pm: 5 }).status).toBe('warning');
    expect(classifyStatus({ ...base, mweri: 8 }).status).toBe('critical');
  });

  it('tren level naik tajam memicu warning walau nilai masih rendah', () => {
    expect(classifyStatus({ residueLevel: 30, pm: 2, mweri: 2, levelSlope: 0.8 })).toEqual({
      status: 'warning',
      reasons: ['trend'],
    });
    expect(classifyStatus({ residueLevel: 30, pm: 2, mweri: 2, levelSlope: 0.5 }).status).toBe('normal');
  });

  it('semua rendah → normal tanpa alasan', () => {
    expect(classifyStatus({ residueLevel: 20, pm: 1, mweri: 1, levelSlope: null })).toEqual({
      status: 'normal',
      reasons: [],
    });
  });
});
