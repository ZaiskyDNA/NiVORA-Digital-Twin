import { describe, expect, it } from 'vitest';
import { createInitialState, runTicks, setScenario, setWeights } from '../../sim/engine';
import {
  kpiTiles,
  mweriChart,
  nodeDetailView,
  volumeRiskInsight,
  whatIf,
  withSimulated,
  mweriFormula,
  nodeCardView,
  pathwayView,
  pmLevel,
  rankingRows,
  recommendationParts,
  recommendationView,
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

describe('nodeDetailView — komposisi MWERI', () => {
  it('Σ kontribusi = MWERI; Node C: kontribusi W = 0 (tidak ada pekerja)', () => {
    const s = createInitialState();
    for (const id of ['A', 'B', 'C']) {
      const d = nodeDetailView(s, id)!;
      const total = d.terms.reduce((a, t) => a + t.score * t.weight, 0);
      expect(total).toBeCloseTo(s.nodes.find((n) => n.id === id)!.mweri, 1);
    }
    const c = nodeDetailView(s, 'C')!;
    expect(c.terms.find((t) => t.key === 'W')).toMatchObject({ score: 0, contribution: 0 });
    expect(c.destination).toBe('Treatment');
  });
});

describe('volumeRiskInsight — pesan kunci Node C', () => {
  it('residu tertinggi tanpa pekerja & bukan prioritas #1 → insight Node C', () => {
    const i = volumeRiskInsight(createInitialState());
    expect(i).toMatchObject({ nodeId: 'C', rank: 3, topNodeId: 'A' });
    expect(i!.residue).toBeGreaterThanOrEqual(58);
  });

  it('tidak muncul bila node residu tertinggi adalah prioritas #1', () => {
    const s = createInitialState();
    s.nodes.find((n) => n.id === 'A')!.residueLevel = 95;
    expect(volumeRiskInsight(s)).toBeNull();
  });
});

describe('whatIf — fork 30 menit', () => {
  it('tidak mengubah state asli & menghasilkan lintasan 31 titik per node', () => {
    const s = createInitialState({ scenarioId: 'surge' });
    const snapshot = structuredClone(s);
    const r = whatIf(s, 30);
    expect(s).toEqual(snapshot);
    expect(r.fromT).toBe(0);
    expect(r.trajectories.A).toHaveLength(31);
    expect(r.trajectories.A?.at(-1)?.t).toBe(30);
  });

  it('Surge: Node A diprediksi critical dan truk dikirim dalam 30 menit', () => {
    const r = whatIf(createInitialState({ scenarioId: 'surge' }), 30);
    expect(r.nodes.find((n) => n.id === 'A')?.becameCritical).toBe(true);
    expect(r.dispatches).toBeGreaterThan(0);
  });

  it('hasil sama dengan runTicks pada state yang sama (deterministik)', () => {
    const s = createInitialState({ seed: 3 });
    const end = runTicks(s, 30);
    const r = whatIf(s, 30);
    expect(r.nodes.find((n) => n.id === 'B')?.mweriAfter).toBe(
      (Math.round(end.nodes.find((n) => n.id === 'B')!.mweri * 10) / 10).toFixed(1),
    );
  });

  it('withSimulated menggabungkan lintasan ke titik grafik', () => {
    const merged = withSimulated([{ t: 0, mweri: 5 }], [{ t: 0, mweri: 5 }, { t: 1, mweri: 6 }]);
    expect(merged).toEqual([{ t: 0, mweri: 5, sim: 5 }, { t: 1, sim: 6 }]);
  });
});

describe('kpiTiles — nilai berdampingan', () => {
  it('setiap tile membawa nilai NiVORA & reaktif', () => {
    const n = runTicks(createInitialState({ policy: 'nivora' }), 240);
    const r = runTicks(createInitialState({ policy: 'reactive' }), 240);
    const [people, planet, productivity] = kpiTiles(n, r);
    expect(Number(people!.nivora)).toBeLessThan(Number(people!.reactive));
    expect(planet!.nivora).toMatch(/%$/);
    expect(productivity!.nivora).toMatch(/%$/);
    expect(productivity!.reactive).toMatch(/%$/);
  });
});

describe('routingRows — rute terpilih yang melewati zona pekerja', () => {
  it('β = 0 → A terpilih dan ditandai throughZone (tidak disebut "safe" begitu saja)', () => {
    const s = setWeights(createInitialState(), { route: { alpha: 1, beta: 0, gamma: 0 } });
    const a = routingRows(s).rows.find((r) => r.id === 'A');
    expect(a).toMatchObject({ selected: true, kind: 'safe', throughZone: true });
    expect(routingRows(createInitialState()).rows.find((r) => r.id === 'B')?.throughZone).toBe(false);
  });
});

describe('kpiTiles — tren Planet relatif terhadap reaktif', () => {
  it('recovery rate lebih rendah dari baseline → "worse", bukan hijau', () => {
    const n = runTicks(createInitialState({ policy: 'nivora' }), 240);
    const r = runTicks(createInitialState({ policy: 'reactive' }), 240);
    n.metrics.handled = 100;
    n.metrics.recovered = 78;
    r.metrics.handled = 100;
    r.metrics.recovered = 100;
    expect(kpiTiles(n, r)[1]).toMatchObject({ value: '78%', trend: 'worse', reactive: '100%' });
  });
});

describe('recommendationView — kartu Rekomendasi', () => {
  it('menjawab kapan · prioritas · ke mana · lewat mana untuk Node A', () => {
    const v = recommendationView(createInitialState())!;
    expect(v).toMatchObject({
      nodeId: 'A',
      rank: 1,
      destination: 'Unit Reprocessing',
      stage: 'reuse',
      stageIndex: 0,
      routeId: 'B',
      routeCost: '2.8',
      throughZone: false,
      reactive: false,
    });
  });

  it('Surge: urgensi "now"; Disruption: rute C', () => {
    expect(recommendationView(runTicks(createInitialState({ scenarioId: 'surge' }), 10))?.urgency).toBe('now');
    expect(recommendationView(setScenario(createInitialState(), 'disruption'))?.routeId).toBe('C');
  });

  it('mode reaktif ditandai & rute terpendek A melewati zona', () => {
    const v = recommendationView(createInitialState({ policy: 'reactive' }))!;
    expect(v).toMatchObject({ reactive: true, routeId: 'A', throughZone: true });
  });
});
