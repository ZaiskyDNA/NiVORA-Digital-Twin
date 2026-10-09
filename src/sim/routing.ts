/**
 * Graph-Based Safe Routing (§5.5).
 *   C_ij = α·D_ij + β·R_ij + γ·O_ij,  α+β+γ = 1
 * Skor rute = jumlah skor edge (§13.3), sehingga biaya rute = jumlah biaya edge (aditif → Dijkstra valid).
 */
import type { Edge, Graph, RouteWeights } from './types';

export interface ScoreTotals {
  D: number;
  R: number;
  O: number;
}

export interface Route {
  vertices: string[];
  edges: Edge[];
  totals: ScoreTotals;
  /** Biaya menurut fungsi biaya yang dipakai saat pencarian. */
  cost: number;
}

export type CostFn = (e: Edge) => number;

export const edgeCost = (e: Pick<Edge, 'D' | 'R' | 'O'>, w: RouteWeights): number =>
  w.alpha * e.D + w.beta * e.R + w.gamma * e.O;

export const compositeCost =
  (w: RouteWeights): CostFn =>
  (e) =>
    edgeCost(e, w);

/** Biaya jarak murni — untuk garis "terpendek" pembanding. */
export const distanceCost: CostFn = (e) => e.D;

export function sumScores(edges: readonly Edge[]): ScoreTotals {
  return edges.reduce((t, e) => ({ D: t.D + e.D, R: t.R + e.R, O: t.O + e.O }), { D: 0, R: 0, O: 0 });
}

/** Biaya rute dari total skornya (identik dengan Σ biaya edge karena linear). */
export const routeCost = (totals: ScoreTotals, w: RouteWeights): number => edgeCost(totals, w);

/** Cari edge aktif yang menghubungkan dua vertex berurutan (graf tak berarah). */
function findEdge(edges: readonly Edge[], a: string, b: string): Edge | undefined {
  return edges.find((e) => !e.disabled && ((e.from === a && e.to === b) || (e.from === b && e.to === a)));
}

/** Bangun Route dari urutan vertex. Null bila ada segmen yang tidak terhubung/terblokir. */
export function routeFromVertices(graph: Graph, vertices: readonly string[], cost: CostFn): Route | null {
  const edges: Edge[] = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    const e = findEdge(graph.edges, vertices[i] as string, vertices[i + 1] as string);
    if (!e) return null;
    edges.push(e);
  }
  return { vertices: [...vertices], edges, totals: sumScores(edges), cost: edges.reduce((s, e) => s + cost(e), 0) };
}

/**
 * Dijkstra pada graf tak berarah; edge `disabled` diabaikan.
 * Graf kecil (puluhan vertex) → seleksi linear O(V²) cukup dan deterministik.
 * Seri biaya diputus berdasarkan urutan vertex di `graph.vertices`.
 */
export function dijkstra(graph: Graph, source: string, target: string, cost: CostFn): Route | null {
  const adj = new Map<string, { to: string; edge: Edge }[]>();
  for (const v of graph.vertices) adj.set(v.id, []);
  for (const e of graph.edges) {
    if (e.disabled) continue;
    const c = cost(e);
    if (c < 0) throw new Error(`Biaya edge negatif tidak didukung: ${e.id}`);
    adj.get(e.from)?.push({ to: e.to, edge: e });
    adj.get(e.to)?.push({ to: e.from, edge: e });
  }
  if (!adj.has(source) || !adj.has(target)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; edge: Edge }>();
  const done = new Set<string>();
  for (const v of graph.vertices) dist.set(v.id, Infinity);
  dist.set(source, 0);

  for (;;) {
    let u: string | null = null;
    let best = Infinity;
    for (const v of graph.vertices) {
      const d = dist.get(v.id) ?? Infinity;
      if (!done.has(v.id) && d < best) {
        best = d;
        u = v.id;
      }
    }
    if (u === null || u === target) break;
    done.add(u);
    for (const { to, edge } of adj.get(u) ?? []) {
      const alt = best + cost(edge);
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, { from: u, edge });
      }
    }
  }

  const total = dist.get(target) ?? Infinity;
  if (!Number.isFinite(total)) return null;

  const vertices = [target];
  const edges: Edge[] = [];
  for (let cur = target; cur !== source; ) {
    const step = prev.get(cur);
    if (!step) return null;
    edges.unshift(step.edge);
    vertices.unshift(step.from);
    cur = step.from;
  }
  return { vertices, edges, totals: sumScores(edges), cost: total };
}

/** Rute teraman menurut biaya komposit. */
export const safeRoute = (graph: Graph, from: string, to: string, w: RouteWeights): Route | null =>
  dijkstra(graph, from, to, compositeCost(w));

/** Rute terpendek murni (hanya D) — pembanding visual. */
export const shortestRoute = (graph: Graph, from: string, to: string): Route | null =>
  dijkstra(graph, from, to, distanceCost);

/** Salinan graf dengan edge tertentu dinonaktifkan (skenario Route Disruption). */
export function withDisabledEdges(graph: Graph, edgeIds: readonly string[]): Graph {
  const off = new Set(edgeIds);
  return { vertices: graph.vertices, edges: graph.edges.map((e) => (off.has(e.id) ? { ...e, disabled: true } : e)) };
}

/** Skor tampilan 0–10: total > 10 dinormalisasi relatif ke skor maksimum di antara rute (§13.3). */
export function toDisplayScale(totals: readonly ScoreTotals[]): ScoreTotals[] {
  const max = Math.max(10, ...totals.flatMap((t) => [t.D, t.R, t.O]));
  const k = 10 / max;
  return totals.map((t) => ({ D: t.D * k, R: t.R * k, O: t.O * k }));
}
