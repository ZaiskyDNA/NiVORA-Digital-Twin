import { describe, expect, it } from 'vitest';
import { DISRUPTION_EDGE_ID, ROUTE_CANDIDATES, ROUTE_GRAPH } from '../../config/plant';
import { DEFAULT_ROUTE_WEIGHTS } from '../../config/weights';
import {
  compositeCost,
  dijkstra,
  edgeCost,
  routeCost,
  routeFromVertices,
  safeRoute,
  shortestRoute,
  toDisplayScale,
  withDisabledEdges,
} from '../routing';
import type { Graph } from '../types';
import { expectNear } from './helpers';

const W = DEFAULT_ROUTE_WEIGHTS;

// Lampiran 7 esai.
const APPENDIX_7 = {
  A: { D: 2, R: 9, O: 3, cost: 5.7 },
  B: { D: 4, R: 2, O: 3, cost: 2.8 },
  C: { D: 5, R: 4, O: 2, cost: 3.9 },
} as const;

describe('Biaya rute (§5.5)', () => {
  it('bobot default berjumlah 1', () => {
    expectNear(W.alpha + W.beta + W.gamma, 1);
  });

  it.each(Object.entries(APPENDIX_7))('rute %s dari skor Lampiran 7 → cost sesuai', (_id, r) => {
    expectNear(edgeCost(r, W), r.cost);
  });

  it.each(Object.entries(APPENDIX_7))('rute kandidat %s di plant.ts: Σ skor edge & cost = Lampiran 7', (id, r) => {
    const route = routeFromVertices(ROUTE_GRAPH, ROUTE_CANDIDATES[id as keyof typeof ROUTE_CANDIDATES], compositeCost(W));
    expect(route).not.toBeNull();
    expect(route!.totals).toEqual({ D: r.D, R: r.R, O: r.O });
    expectNear(route!.cost, r.cost);
    expectNear(routeCost(route!.totals, W), r.cost);
  });

  it('graf memenuhi syarat §6: ≥10 vertex, skor edge 0–10', () => {
    expect(ROUTE_GRAPH.vertices.length).toBeGreaterThanOrEqual(10);
    for (const e of ROUTE_GRAPH.edges) {
      for (const s of [e.D, e.R, e.O]) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('Dijkstra safe routing', () => {
  it('memilih rute B (safe route, cost 2.8)', () => {
    const r = safeRoute(ROUTE_GRAPH, 'nodeA', 'reprocessing', W);
    expect(r?.vertices).toEqual([...ROUTE_CANDIDATES.B]);
    expectNear(r?.cost, 2.8);
  });

  it('jika edge rute B dinonaktifkan → memilih rute C (cost 3.9)', () => {
    const disrupted = withDisabledEdges(ROUTE_GRAPH, [DISRUPTION_EDGE_ID]);
    const r = safeRoute(disrupted, 'nodeA', 'reprocessing', W);
    expect(r?.vertices).toEqual([...ROUTE_CANDIDATES.C]);
    expectNear(r?.cost, 3.9);
    // Graf asli tidak ikut berubah.
    expect(ROUTE_GRAPH.edges.find((e) => e.id === DISRUPTION_EDGE_ID)?.disabled).toBeUndefined();
  });

  it('jika B dan C sama-sama terblokir → terpaksa rute A', () => {
    const r = safeRoute(withDisabledEdges(ROUTE_GRAPH, ['j1-j2', 'j3-j4']), 'nodeA', 'reprocessing', W);
    expect(r?.vertices).toEqual([...ROUTE_CANDIDATES.A]);
    expectNear(r?.cost, 5.7);
  });

  it('rute terpendek murni (hanya D) = rute A yang menembus zona pekerja', () => {
    const r = shortestRoute(ROUTE_GRAPH, 'nodeA', 'reprocessing');
    expect(r?.vertices).toEqual([...ROUTE_CANDIDATES.A]);
    expect(r?.totals.D).toBe(2);
  });

  it('routeFromVertices menolak rute yang melewati edge terblokir', () => {
    const disrupted = withDisabledEdges(ROUTE_GRAPH, [DISRUPTION_EDGE_ID]);
    expect(routeFromVertices(disrupted, ROUTE_CANDIDATES.B, compositeCost(W))).toBeNull();
  });

  it('mengembalikan null bila tujuan tidak terjangkau atau tidak dikenal', () => {
    const g: Graph = {
      vertices: [{ id: 'x', position: [0, 0, 0] }, { id: 'y', position: [1, 0, 0] }],
      edges: [{ id: 'x-y', from: 'x', to: 'y', D: 1, R: 1, O: 1, disabled: true }],
    };
    expect(dijkstra(g, 'x', 'y', compositeCost(W))).toBeNull();
    expect(dijkstra(g, 'x', 'zzz', compositeCost(W))).toBeNull();
  });

  it('sumber = tujuan → rute kosong dengan cost 0', () => {
    const r = safeRoute(ROUTE_GRAPH, 'nodeA', 'nodeA', W);
    expect(r?.vertices).toEqual(['nodeA']);
    expect(r?.cost).toBe(0);
  });

  it('menolak biaya edge negatif', () => {
    expect(() => dijkstra(ROUTE_GRAPH, 'nodeA', 'reprocessing', () => -1)).toThrow();
  });
});

describe('Skala tampilan (§13.3)', () => {
  it('tidak mengubah skor bila semua ≤ 10', () => {
    expect(toDisplayScale([{ D: 2, R: 9, O: 3 }])).toEqual([{ D: 2, R: 9, O: 3 }]);
  });

  it('menormalisasi seragam bila ada total > 10', () => {
    const [a, b] = toDisplayScale([{ D: 20, R: 5, O: 0 }, { D: 10, R: 0, O: 2 }]);
    expect(a).toEqual({ D: 10, R: 2.5, O: 0 });
    expect(b).toEqual({ D: 5, R: 0, O: 1 });
  });
});
