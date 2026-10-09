import { describe, expect, it } from 'vitest';
import { DISRUPTION_EDGE_ID } from '../../config/plant';
import { POLICY } from '../../config/thresholds';
import { createInitialState, runTicks, setScenario, setWeights, step, type Policy, type SimState } from '../engine';
import { expectNear } from './helpers';

const node = (s: SimState, id: string) => {
  const n = s.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`node ${id}`);
  return n;
};

/** Menit pertama Node A berstatus critical (null bila tidak terjadi dalam `horizon`). */
function firstCritical(s0: SimState, horizon: number): number | null {
  let s = s0;
  for (let i = 0; i < horizon; i++) {
    s = step(s);
    if (node(s, 'A').status === 'critical') return s.t;
  }
  return null;
}

describe('Inisialisasi', () => {
  const s = createInitialState();

  it('baseline awal shift: belum ada node yang critical', () => {
    expect(s.nodes.every((n) => n.status !== 'critical')).toBe(true);
  });

  it('history di-warm-up sehingga Digital Twin langsung punya prediksi (§13.4)', () => {
    expect(node(s, 'A').history).toHaveLength(20);
    expect(node(s, 'A').ttc).not.toBeNull();
  });

  it('Node C: residu tertinggi tetapi prioritas MWERI terendah', () => {
    const c = node(s, 'C');
    expect(c.residueLevel).toBeGreaterThan(node(s, 'A').residueLevel);
    expect(s.ranking.at(-1)).toBe('C');
    expect(c.mweri).toBeLessThan(3);
  });

  it('rekomendasi awal: Node A → Unit Reprocessing lewat rute B; tabel kandidat = Lampiran 7 (R snapshot)', () => {
    const rec = s.recommendation;
    expect(rec?.nodeId).toBe('A');
    expect(rec?.destination).toBe('reprocessing');
    expect(rec?.selectedCandidate).toBe('B');
    const rows = Object.fromEntries((rec?.candidates ?? []).map((r) => [r.id, r]));
    expect(rows.A?.totals).toEqual({ D: 2, R: 9, O: 3 });
    expectNear(rows.A?.cost, 5.7);
    expectNear(rows.B?.cost, 2.8);
    expectNear(rows.C?.cost, 3.9);
  });
});

describe('Determinisme & kemurnian (§5.6, §13.5)', () => {
  it('seed sama → state identik', () => {
    expect(runTicks(createInitialState({ seed: 7 }), 120)).toEqual(runTicks(createInitialState({ seed: 7 }), 120));
  });

  it('seed berbeda → lintasan berbeda', () => {
    const a = runTicks(createInitialState({ seed: 7 }), 60);
    const b = runTicks(createInitialState({ seed: 8 }), 60);
    expect(node(a, 'A').residueLevel).not.toBe(node(b, 'A').residueLevel);
  });

  it('step tidak memutasi state sebelumnya (fork what-if aman)', () => {
    const s0 = createInitialState();
    const snapshot = structuredClone(s0);
    runTicks(s0, 30);
    expect(s0).toEqual(snapshot);
  });

  it('mode NiVORA & Reaktif menerima derau lingkungan identik (stream RNG terpisah)', () => {
    const n = runTicks(createInitialState({ policy: 'nivora' }), 200);
    const r = runTicks(createInitialState({ policy: 'reactive' }), 200);
    expect(n.envRng).toEqual(r.envRng);
  });
});

describe('Skenario (§8)', () => {
  it.each<Policy>(['nivora', 'reactive'])('[%s] Production Surge membuat Node A critical lebih cepat daripada Normal', (policy) => {
    const horizon = 240;
    const normal = firstCritical(createInitialState({ policy, scenarioId: 'normal' }), horizon);
    const surge = firstCritical(createInitialState({ policy, scenarioId: 'surge' }), horizon);
    expect(surge).not.toBeNull();
    expect(surge as number).toBeLessThan(normal ?? Infinity);
  });

  it('Surge: Node A critical dalam < 30 menit simulasi (narasi "kritis dalam ±18 menit")', () => {
    const t = firstCritical(createInitialState({ scenarioId: 'surge' }), 60);
    expect(t).not.toBeNull();
    expect(t as number).toBeLessThan(30);
  });

  it('Normal + NiVORA: Node A ditangani sebelum sempat critical', () => {
    expect(firstCritical(createInitialState({ policy: 'nivora', scenarioId: 'normal' }), 240)).toBeNull();
  });

  it('Route Disruption memblokir edge kunci & memicu re-routing rekomendasi B → C', () => {
    const before = runTicks(createInitialState(), 5);
    expect(before.recommendation?.selectedCandidate).toBe('B');

    const after = setScenario(before, 'disruption');
    expect(after.graph.edges.find((e) => e.id === DISRUPTION_EDGE_ID)?.disabled).toBe(true);
    expect(after.recommendation?.selectedCandidate).toBe('C');
    expect(after.recommendation?.candidates.find((r) => r.id === 'B')?.blocked).toBe(true);
    expect(after.events.some((e) => e.type === 'reroute' && e.nodeId === 'A')).toBe(true);

    // Tetap pada C di tick berikutnya; kembali ke B setelah blokade dibuka.
    expect(step(after).recommendation?.selectedCandidate).toBe('C');
    expect(setScenario(step(after), 'normal').recommendation?.selectedCandidate).toBe('B');
  });

  it('Route Disruption saat truk sedang menuju rute B → truk dialihkan & tetap tiba', () => {
    // Surge memicu dispatch Node A lewat rute B.
    let s = createInitialState({ scenarioId: 'surge' });
    for (let i = 0; i < 60 && !s.tasks.some((t) => t.legs.some((l) => l.edgeId === DISRUPTION_EDGE_ID)); i++) s = step(s);
    const task = s.tasks.find((t) => t.legs.some((l) => l.edgeId === DISRUPTION_EDGE_ID));
    expect(task).toBeDefined();
    const id = task!.id;

    // Dialihkan saat skenario diganti — tanpa menunggu tick.
    const switched = setScenario(s, 'disruption');
    const planned = switched.tasks.find((t) => t.id === id)!;
    expect(planned.legs.slice(planned.leg).some((l) => l.edgeId === DISRUPTION_EDGE_ID)).toBe(false);

    s = step(switched);
    const moved = s.tasks.find((t) => t.id === id);
    if (moved) {
      expect(moved.legs.slice(moved.leg).some((l) => l.edgeId === DISRUPTION_EDGE_ID)).toBe(false);
    }
    expect(s.events.some((e) => e.type === 'reroute' && e.taskId === id)).toBe(true);

    for (let i = 0; i < 60 && s.tasks.some((t) => t.id === id); i++) s = step(s);
    expect(s.events.some((e) => e.type === 'arrive' && e.taskId === id && e.detail === 'reprocessing')).toBe(true);
  });
  it('truk yang sedang berada DI ruas yang diblokir putar balik ke awal ruas lalu lewat rute lain', () => {
    const s0 = createInitialState();
    const legs = [
      { edgeId: 'nodeA-j1', from: 'nodeA', to: 'j1', D: 1 },
      { edgeId: 'j1-j2', from: 'j1', to: 'j2', D: 2 },
      { edgeId: 'j2-reprocessing', from: 'j2', to: 'reprocessing', D: 1 },
    ];
    s0.tasks = [
      {
        id: 99,
        nodeId: 'A',
        stage: 'reuse',
        destination: 'reprocessing',
        legs,
        leg: 1, // di ruas j1-j2 ...
        legProgress: 1, // ... sudah menempuh 1 dari 2
        loadingMin: 0,
        dispatchedAt: 0,
        nodeStatusAtDispatch: 'warning',
      },
    ];
    const switched = setScenario(s0, 'disruption');
    const t = switched.tasks.find((x) => x.id === 99)!;
    expect(t.legs[0]).toMatchObject({ edgeId: 'j1-j2', from: 'j2', to: 'j1', D: 1, retreat: true });
    expect(t.legs.slice(1).some((l) => l.edgeId === 'j1-j2')).toBe(false);
    expect(t.legs.at(-1)?.to).toBe('reprocessing');

    // Tick berikutnya: tetap mundur (tidak berbalik lagi ke arah blokade) lalu tiba lewat rute lain.
    let s = step(switched);
    expect(s.tasks.find((x) => x.id === 99)?.legs[0]).toMatchObject({ from: 'j2', to: 'j1', retreat: true });
    for (let i = 0; i < 40 && s.tasks.some((x) => x.id === 99); i++) s = step(s);
    expect(s.events.some((e) => e.type === 'arrive' && e.taskId === 99 && e.detail === 'reprocessing')).toBe(true);
  });
});

describe('Kebijakan penanganan', () => {
  it('NiVORA: dispatch → truk tiba → residu node turun', () => {
    let s = createInitialState({ scenarioId: 'surge' });
    let dispatchedAt: number | null = null;
    let levelAtArrival: { before: number; after: number } | null = null;
    for (let i = 0; i < 90 && !levelAtArrival; i++) {
      const prev = s;
      s = step(s);
      if (dispatchedAt === null && s.events.some((e) => e.type === 'dispatch' && e.nodeId === 'A')) dispatchedAt = s.t;
      if (s.events.some((e) => e.type === 'arrive' && e.nodeId === 'A' && e.t === s.t)) {
        levelAtArrival = { before: node(prev, 'A').residueLevel, after: node(s, 'A').residueLevel };
      }
    }
    expect(dispatchedAt).not.toBeNull();
    expect(levelAtArrival).not.toBeNull();
    expect(levelAtArrival!.after).toBeLessThan(levelAtArrival!.before - 20);
  });

  it(`NiVORA: tidak mengirim truk untuk residu < ${POLICY.nivoraMinLoadLevel}%`, () => {
    let s = createInitialState({ scenarioId: 'surge' });
    for (let i = 0; i < 240; i++) {
      const prev = s;
      s = step(s);
      for (const e of s.events.filter((x) => x.type === 'dispatch' && x.t === s.t)) {
        expect(node(prev, e.nodeId as string).residueLevel).toBeGreaterThanOrEqual(POLICY.nivoraMinLoadLevel - 1);
      }
    }
  });

  it('urgensi "now" hanya bila truk memang akan dikirim (residu cukup untuk diangkut)', () => {
    let s = createInitialState({ scenarioId: 'surge' });
    for (let i = 0; i < 240; i++) {
      s = step(s);
      const rec = s.recommendation;
      const n = node(s, rec?.nodeId as string);
      if (rec?.urgency === 'now') expect(n.residueLevel).toBeGreaterThanOrEqual(POLICY.nivoraMinLoadLevel);
    }
  });

  it('Reaktif: rute = terpendek (A, menembus zona pekerja)', () => {
    expect(createInitialState({ policy: 'reactive' }).recommendation?.selectedCandidate).toBe('A');
  });

  it('Reaktif: tidak menangani sebelum ambang/jadwal → paparan pekerja lebih tinggi daripada NiVORA', () => {
    const n = runTicks(createInitialState({ policy: 'nivora' }), 240);
    const r = runTicks(createInitialState({ policy: 'reactive' }), 240);
    expect(r.metrics.exposureTotal).toBeGreaterThan(n.metrics.exposureTotal);
  });

  it('setWeights: bobot jarak penuh (α = 1) membuat rekomendasi memilih rute terpendek A', () => {
    const s = setWeights(createInitialState(), { route: { alpha: 1, beta: 0, gamma: 0 } });
    expect(s.recommendation?.selectedCandidate).toBe('A');
  });

  it('setWeights MWERI langsung menghitung ulang MWERI & ranking', () => {
    const s = setWeights(createInitialState(), { mweri: { wH: 1, wP: 0, wW: 0, wT: 0 } });
    expectNear(node(s, 'A').mweri, 8);
    expectNear(node(s, 'C').mweri, 6);
    expect(s.ranking).toEqual(['A', 'B', 'C']);
  });
});
