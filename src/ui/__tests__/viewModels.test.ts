import { describe, expect, it } from 'vitest';
import { createInitialState, runTicks, setScenario, setWeights } from '../../sim/engine';
import {
  kpiTiles,
  mweriChart,
  mweriFormula,
  nodeCardView,
  pathwayView,
  pmLevel,
  rankingRows,
  recommendationParts,
  routeFormula,
  routingRows,
} from '../viewModels';

const text = (parts: { text: string }[]) => parts.map((p) => p.text).join('');

describe('rankingRows', () => {
  it('urut A > B > C dengan kelas & parameter dibulatkan', () => {
    const rows = rankingRows(createInitialState());
    expect(rows.map((r) => r.id)).toEqual(['A', 'B', 'C']);
    expect(rows[0]).toMatchObject({ rank: 1, params: { H: 8, W: 9 } });
    expect(rows[2]?.cls).toBe('rendah');
  });
});

describe('nodeCardView', () => {
  it('Node C: residu tinggi tanpa pekerja → pesan kunci & prioritas #3', () => {
    const s = runTicks(createInitialState(), 30); // C melewati 60% → warning (volume)
    const c = nodeCardView(s, 'C');
    expect(c?.status).toBe('warning');
    expect(c?.reasons).toContain('volume');
    expect(c?.cls).toBe('rendah');
    expect(c?.rank).toBe(3);
    expect(c?.noWorkersHighResidue).toBe(true);
    expect(c?.workers).toBe('0/10');
  });

  it('level PM selaras ambang Edge-AI', () => {
    expect(pmLevel(9)).toBe('high');
    expect(pmLevel(6)).toBe('medium');
    expect(pmLevel(3)).toBe('low');
  });
});

describe('recommendationParts — kapan · prioritas · ke mana · lewat mana (§11)', () => {
  it('NiVORA: menyebut node, prioritas, tujuan, dan rute aman', () => {
    const t = text(recommendationParts(createInitialState()));
    expect(t).toMatch(/Node A/);
    expect(t).toMatch(/prioritas #1/);
    expect(t).toMatch(/Unit Reprocessing/);
    expect(t).toMatch(/Rute B/);
    expect(t).toMatch(/menghindari zona pekerja/);
  });

  it('urgensi "sekarang" saat Node A critical (Surge)', () => {
    const s = runTicks(createInitialState({ scenarioId: 'surge' }), 10);
    expect(text(recommendationParts(s))).toMatch(/^Tangani Node A sekarang/);
  });

  it('Route Disruption: rekomendasi pindah ke Rute C', () => {
    expect(text(recommendationParts(setScenario(createInitialState(), 'disruption')))).toMatch(/Rute C/);
  });

  it('bila rute teraman terpaksa lewat zona pekerja, alasannya jujur', () => {
    const s = setWeights(createInitialState(), { route: { alpha: 1, beta: 0, gamma: 0 } });
    expect(text(recommendationParts(s))).toMatch(/melewati zona pekerja/);
  });

  it('nama entitas ditandai tebal', () => {
    const strong = recommendationParts(createInitialState())
      .filter((p) => p.strong)
      .map((p) => p.text);
    expect(strong).toEqual(['Node A', 'Unit Reprocessing', 'Rute B']);
  });
});

describe('mweriChart', () => {
  it('riwayat + satu titik proyeksi di ujung horizon', () => {
    const s = runTicks(createInitialState({ scenarioId: 'surge' }), 5);
    const pts = mweriChart(s.nodes[0]!, 40, 30);
    const last = pts.at(-1)!;
    expect(last.mweri).toBeUndefined();
    expect(last.proj).toBeDefined();
    expect(last.t).toBe(s.t + 30);
    expect(pts.at(-2)?.proj).toBeCloseTo(pts.at(-2)?.mweri ?? NaN, 9);
  });
});

describe('kpiTiles', () => {
  it('belum ada data → "—" tanpa NaN', () => {
    const s = createInitialState();
    const tiles = kpiTiles(s, createInitialState({ policy: 'reactive' }));
    expect(tiles.map((t) => t.value)).toEqual(['—', '—', '—']);
  });

  it('paparan NiVORA < reaktif → nilai negatif ditandai "better" dengan minus tipografis', () => {
    const n = runTicks(createInitialState({ policy: 'nivora' }), 240);
    const r = runTicks(createInitialState({ policy: 'reactive' }), 240);
    const people = kpiTiles(n, r)[0]!;
    expect(people.value.startsWith('−')).toBe(true);
    expect(people.trend).toBe('better');
    expect(people.direction).toBe('down');
    expect(people.sr).toMatch(/^turun \d+% dibanding reaktif$/);
  });
});

describe('pathwayView', () => {
  it('Node A → Reuse aktif, tahap lain belum dievaluasi', () => {
    const v = pathwayView(createInitialState())!;
    expect(v.nodeId).toBe('A');
    expect(v.steps.map((x) => x.state)).toEqual(['active', 'pending', 'pending', 'pending', 'pending']);
    expect(v.reason).toMatch(/memenuhi kebutuhan proses/);
  });

  it('Node C → Treatment aktif, tiga tahap sebelumnya tidak layak', () => {
    const v = pathwayView(createInitialState(), 'C')!;
    expect(v.steps.map((x) => x.state)).toEqual(['rejected', 'rejected', 'rejected', 'active', 'pending']);
  });
});

describe('routingRows', () => {
  it('awal: B terpilih (safe), A terpendek, C alternatif — biaya Lampiran 7', () => {
    const { rows, scaled } = routingRows(createInitialState());
    expect(scaled).toBe(false);
    expect(rows.map((r) => [r.id, r.kind, r.cost])).toEqual([
      ['A', 'shortest', '5.7'],
      ['B', 'safe', '2.8'],
      ['C', 'alternative', '3.9'],
    ]);
  });

  it('Disruption: B terblokir, C terpilih', () => {
    const { rows } = routingRows(setScenario(createInitialState(), 'disruption'));
    expect(rows.find((r) => r.id === 'B')).toMatchObject({ blocked: true, selected: false });
    expect(rows.find((r) => r.id === 'C')).toMatchObject({ kind: 'safe', selected: true });
  });

  it('mode reaktif: rute terpilih = terpendek, tidak pernah berlabel "safe"', () => {
    const { rows } = routingRows(createInitialState({ policy: 'reactive' }));
    expect(rows.some((r) => r.kind === 'safe')).toBe(false);
    expect(rows.find((r) => r.selected)?.id).toBe('A');
  });

  it('rumus memakai bobot aktif', () => {
    expect(routeFormula(createInitialState())).toBe('C = 0.3·D + 0.5·R + 0.2·O');
    expect(mweriFormula(createInitialState())).toBe('MWERI = 0.2·H + 0.4·P + 0.3·W + 0.1·T');
  });
});

describe('konsistensi angka & kelas MWERI', () => {
  it('kelas dihitung dari nilai yang ditampilkan (2.96 → "3.0" → SEDANG, bukan RENDAH)', () => {
    const s = createInitialState();
    const c = s.nodes.find((n) => n.id === 'C')!;
    c.mweri = 2.96;
    const card = nodeCardView(s, 'C')!;
    expect(card.mweri).toBe('3.0');
    expect(card.cls).toBe('sedang');
    expect(rankingRows(s).find((r) => r.id === 'C')?.cls).toBe('sedang');
  });
});
