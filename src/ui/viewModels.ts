/**
 * View model panel: SimState → data siap tampil. Fungsi murni (tanpa React) agar teks
 * rekomendasi, KPI, dan pathway bisa diuji. Komponen UI hanya merender hasil fungsi ini.
 */
import { FACILITY_LABEL, PATHWAY_LABEL, PATHWAY_REASON, PM_LEVEL_LABEL } from '../config/i18n';
import { ROUTE_CANDIDATES } from '../config/plant';
import { EDGE_AI_THRESHOLDS } from '../config/thresholds';
import { NORMALIZATION } from '../config/weights';
import { project } from '../sim/digitalTwin';
import type { SimState } from '../sim/engine';
import { compareKpi, summarize } from '../sim/metrics';
import { classifyMweri, mweriParamsOf } from '../sim/mweri';
import { decidePathway, PATHWAY_STAGES, type PathwayStage } from '../sim/pathway';
import { toDisplayScale } from '../sim/routing';
import type { MweriClass, NodeState } from '../sim/types';

// ── Ranking MWERI ───────────────────────────────────────────────────────

/** Nilai MWERI seperti ditampilkan (1 desimal) — kelas dihitung dari angka yang sama agar
 *  tidak ada kontradiksi "3.0 · RENDAH" (nilai mentah 2.96). */
const displayMweri = (v: number): number => Math.round(v * 10) / 10;
const displayClass = (v: number): MweriClass => classifyMweri(displayMweri(v));

export interface RankRow {
  id: string;
  name: string;
  rank: number;
  mweri: number;
  cls: MweriClass;
  /** Parameter MWERI dibulatkan, untuk teks "H8 · P9 · W9 · T5". */
  params: { H: number; P: number; W: number; T: number };
}

export function rankingRows(s: SimState): RankRow[] {
  return s.ranking.flatMap((id, i) => {
    const n = s.nodes.find((x) => x.id === id);
    if (!n) return [];
    const p = mweriParamsOf(n, NORMALIZATION.exposureLimitMin);
    return [
      {
        id: n.id,
        name: n.name,
        rank: i + 1,
        mweri: displayMweri(n.mweri),
        cls: displayClass(n.mweri),
        params: { H: Math.round(p.H), P: Math.round(p.P), W: Math.round(p.W), T: Math.round(p.T) },
      },
    ];
  });
}

// ── Grafik prediksi Digital Twin ────────────────────────────────────────

export interface ChartPoint {
  t: number;
  mweri?: number;
  proj?: number;
}

/** Riwayat MWERI (N sampel terakhir) + garis proyeksi regresi ke depan. */
export function mweriChart(n: NodeState, samples = 40, horizonMin = 30): ChartPoint[] {
  const points: ChartPoint[] = n.history.slice(-samples).map((h) => ({ t: h.t, mweri: h.mweri }));
  const [from, to] = project(n.history, 'mweri', horizonMin);
  const last = points.at(-1);
  if (from && to && last) {
    last.proj = from.y;
    points.push({ t: to.x, proj: Math.max(0, Math.min(10, to.y)) });
  }
  return points;
}

// ── Kartu node ──────────────────────────────────────────────────────────

export type PmLevel = keyof typeof PM_LEVEL_LABEL;

export const pmLevel = (pm: number): PmLevel =>
  pm >= EDGE_AI_THRESHOLDS.criticalPm ? 'high' : pm >= EDGE_AI_THRESHOLDS.warningPm ? 'medium' : 'low';

export interface NodeCardView {
  id: string;
  name: string;
  status: NodeState['status'];
  /** Alasan Edge-AI dipisah koma — string agar view bisa dibandingkan dangkal. */
  reasons: string;
  mweri: string;
  cls: MweriClass;
  rank: number;
  residue: string;
  pm: PmLevel;
  workers: string;
  /** Menit hingga kritis (dibulatkan), 0 = sudah kritis, null = tren stabil. */
  ttc: number | null;
  /** Pesan kunci esai: residu tinggi tanpa pekerja → prioritas rendah. */
  noWorkersHighResidue: boolean;
}

export function nodeCardView(s: SimState, id: string): NodeCardView | null {
  const n = s.nodes.find((x) => x.id === id);
  if (!n) return null;
  return {
    id: n.id,
    name: n.name,
    status: n.status,
    reasons: n.statusReasons.join(','),
    mweri: displayMweri(n.mweri).toFixed(1),
    cls: displayClass(n.mweri),
    rank: s.ranking.indexOf(n.id) + 1,
    residue: `${Math.round(n.residueLevel)}%`,
    pm: pmLevel(n.pm),
    workers: `${n.workers}/${n.maxWorkersZone}`,
    ttc: n.ttc === null ? null : Math.max(0, Math.round(n.ttc)),
    noWorkersHighResidue: n.workers === 0 && n.residueLevel >= EDGE_AI_THRESHOLDS.warningLevel,
  };
}

// ── Rekomendasi operasional ─────────────────────────────────────────────

export interface TextPart {
  text: string;
  strong?: boolean;
}

/**
 * Kalimat rekomendasi yang selalu menjawab kapan · prioritas · ke mana · lewat mana (§11).
 * Dikembalikan sebagai potongan agar nama entitas bisa ditebalkan tanpa HTML mentah.
 */
export function recommendationParts(s: SimState): TextPart[] {
  const rec = s.recommendation;
  if (!rec) return [{ text: 'Belum ada node yang perlu ditangani.' }];
  const node = `Node ${rec.nodeId}`;
  const dest = FACILITY_LABEL[rec.destination] ?? rec.destination;
  const routeName = rec.selectedCandidate ? `Rute ${rec.selectedCandidate}` : 'rute teraman';

  const when: TextPart[] =
    rec.urgency === 'now'
      ? [{ text: 'Tangani ' }, { text: node, strong: true }, { text: ' sekarang' }]
      : rec.urgency === 'soon' && rec.ttc !== null
        ? [{ text: 'Jadwalkan ' }, { text: node, strong: true }, { text: ` dalam ±${Math.round(rec.ttc)} menit` }]
        : [{ text: 'Pantau ' }, { text: node, strong: true }, { text: ' — belum perlu diangkut' }];

  const throughZone = rec.route?.edges.some((e) => e.zoneId) ?? false;
  const why =
    s.policy === 'reactive'
      ? ' (rute terpendek, mode reaktif)'
      : throughZone
        ? ' (melewati zona pekerja — tidak ada alternatif lebih aman)'
        : ' (menghindari zona pekerja)';

  return [
    ...when,
    { text: ` (prioritas #${rec.rank}) → arahkan residu ke ` },
    { text: dest, strong: true },
    { text: ' melalui ' },
    { text: routeName, strong: true },
    { text: `${why}.` },
  ];
}

// ── KPI 3P ──────────────────────────────────────────────────────────────

export type Trend = 'better' | 'worse' | 'neutral';

export interface KpiTileView {
  key: 'people' | 'planet' | 'productivity';
  value: string;
  /** Arah perubahan angka (panah) — terpisah dari baik/buruk. */
  direction: 'up' | 'down' | 'flat' | null;
  trend: Trend;
  /** Teks pembaca layar, mis. "turun 41% dibanding reaktif". */
  sr: string;
}

const signed = (pct: number): string => {
  const r = Math.round(pct);
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r)}%`;
};

function deltaTile(key: KpiTileView['key'], pct: number | null, lowerIsBetter: boolean): KpiTileView {
  if (pct === null || !Number.isFinite(pct)) {
    return { key, value: '—', direction: null, trend: 'neutral', sr: 'belum ada pembanding reaktif' };
  }
  const r = Math.round(pct);
  const direction = r < 0 ? 'down' : r > 0 ? 'up' : 'flat';
  const better = lowerIsBetter ? r < 0 : r > 0;
  const trend: Trend = r === 0 ? 'neutral' : better ? 'better' : 'worse';
  const sr = r === 0 ? 'sama dengan reaktif' : `${r < 0 ? 'turun' : 'naik'} ${Math.abs(r)}% dibanding reaktif`;
  return { key, value: signed(pct), direction, trend, sr };
}

export function kpiTiles(nivora: SimState, reactive: SimState): KpiTileView[] {
  const kn = summarize(nivora.metrics);
  const kr = summarize(reactive.metrics);
  const cmp = compareKpi(kn, kr);
  const rate = kn.planet.recoveryRate;
  const planet: KpiTileView =
    rate === null
      ? { key: 'planet', value: '—', direction: null, trend: 'neutral', sr: 'belum ada residu yang ditangani' }
      : {
          key: 'planet',
          value: `${Math.round(rate * 100)}%`,
          direction: null,
          trend: rate >= 0.5 ? 'better' : 'neutral',
          sr: `${Math.round(rate * 100)}% residu kembali ke jalur sirkular`,
        };
  return [deltaTile('people', cmp.exposure, true), planet, deltaTile('productivity', cmp.unnecessaryTrips, true)];
}

// ── Pathway ─────────────────────────────────────────────────────────────

export interface PathwayStepView {
  stage: PathwayStage;
  label: string;
  state: 'active' | 'rejected' | 'pending';
}

export interface PathwayView {
  nodeId: string;
  steps: PathwayStepView[];
  active: PathwayStage;
  reason: string;
  destination: string;
}

/** Keputusan pathway untuk node prioritas #1 (atau node tertentu). */
export function pathwayView(s: SimState, nodeId?: string): PathwayView | null {
  const id = nodeId ?? s.ranking[0];
  const n = s.nodes.find((x) => x.id === id);
  if (!n) return null;
  const d = decidePathway(n.material);
  const evaluated = new Map(d.evaluated.map((e) => [e.stage, e.feasible]));
  return {
    nodeId: n.id,
    active: d.stage,
    reason: PATHWAY_REASON[d.stage],
    destination: s.recommendation?.nodeId === n.id ? s.recommendation.destination : d.stage,
    steps: PATHWAY_STAGES.map((stage) => ({
      stage,
      label: PATHWAY_LABEL[stage],
      state: stage === d.stage ? 'active' : evaluated.get(stage) === false ? 'rejected' : 'pending',
    })),
  };
}

// ── Tabel routing ───────────────────────────────────────────────────────

export interface RouteRowView {
  id: string;
  kind: 'safe' | 'shortest' | 'alternative';
  selected: boolean;
  blocked: boolean;
  D: string;
  R: string;
  O: string;
  cost: string;
}

const num = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Baris tabel Lampiran 7 (skor ditampilkan 0–10, §13.3) + penanda terpilih/terpendek/terblokir. */
export function routingRows(s: SimState): { rows: RouteRowView[]; scaled: boolean } {
  const rec = s.recommendation;
  if (!rec || rec.candidates.length === 0) return { rows: [], scaled: false };
  const display = toDisplayScale(rec.candidates.map((c) => c.totals));
  const scaled = rec.candidates.some((c) => c.totals.D > 10 || c.totals.R > 10 || c.totals.O > 10);
  const shortestId = rec.shortest
    ? (rec.candidates.find((c) => {
        const v = ROUTE_CANDIDATES[c.id as keyof typeof ROUTE_CANDIDATES];
        return v?.length === rec.shortest?.vertices.length && v.every((x, i) => x === rec.shortest?.vertices[i]);
      })?.id ?? null)
    : null;
  return {
    scaled,
    rows: rec.candidates.map((c, i) => {
      const d = display[i] ?? c.totals;
      const selected = c.id === rec.selectedCandidate;
      return {
        id: c.id,
        kind: selected && s.policy === 'nivora' ? 'safe' : c.id === shortestId ? 'shortest' : 'alternative',
        selected,
        blocked: c.blocked,
        D: num(d.D),
        R: num(d.R),
        O: num(d.O),
        cost: c.cost.toFixed(1),
      };
    }),
  };
}

/** Rumus biaya rute dengan bobot aktif, mis. "C = 0.3·D + 0.5·R + 0.2·O". */
export const routeFormula = (s: SimState): string => {
  const w = s.weights.route;
  return `C = ${w.alpha.toFixed(1)}·D + ${w.beta.toFixed(1)}·R + ${w.gamma.toFixed(1)}·O`;
};

/** Rumus MWERI dengan bobot aktif. */
export const mweriFormula = (s: SimState): string => {
  const w = s.weights.mweri;
  return `MWERI = ${w.wH.toFixed(1)}·H + ${w.wP.toFixed(1)}·P + ${w.wW.toFixed(1)}·W + ${w.wT.toFixed(1)}·T`;
};
