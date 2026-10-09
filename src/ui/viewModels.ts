/**
 * View model panel: SimState → data siap tampil. Fungsi murni (tanpa React) agar teks
 * rekomendasi, KPI, dan pathway bisa diuji. Komponen UI hanya merender hasil fungsi ini.
 */
import { FACILITY_LABEL, PATHWAY_LABEL, PATHWAY_REASON, PM_LEVEL_LABEL } from '../config/i18n';
import { ROUTE_CANDIDATES, STAGE_FACILITY } from '../config/plant';
import { EDGE_AI_THRESHOLDS } from '../config/thresholds';
import { NORMALIZATION } from '../config/weights';
import { project } from '../sim/digitalTwin';
import { step, type SimState } from '../sim/engine';
import { compareKpi, summarize } from '../sim/metrics';
import { classifyMweri, mweriParamsOf } from '../sim/mweri';
import { decidePathway, PATHWAY_STAGES, type PathwayStage } from '../sim/pathway';
import { toDisplayScale } from '../sim/routing';
import type { MweriClass, NodeState, Status } from '../sim/types';

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
  /** Lintasan hasil simulasi what-if. */
  sim?: number;
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
  /** Nilai mentah kedua mode untuk tampilan berdampingan. */
  nivora: string;
  reactive: string;
}

const signed = (pct: number): string => {
  const r = Math.round(pct);
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r)}%`;
};

function deltaTile(
  key: KpiTileView['key'],
  pct: number | null,
  lowerIsBetter: boolean,
  raw: { nivora: string; reactive: string },
): KpiTileView {
  if (pct === null || !Number.isFinite(pct)) {
    return { key, value: '—', direction: null, trend: 'neutral', sr: 'belum ada pembanding reaktif', ...raw };
  }
  const r = Math.round(pct);
  const direction = r < 0 ? 'down' : r > 0 ? 'up' : 'flat';
  const better = lowerIsBetter ? r < 0 : r > 0;
  const trend: Trend = r === 0 ? 'neutral' : better ? 'better' : 'worse';
  const sr = r === 0 ? 'sama dengan reaktif' : `${r < 0 ? 'turun' : 'naik'} ${Math.abs(r)}% dibanding reaktif`;
  return { key, value: signed(pct), direction, trend, sr, ...raw };
}

export function kpiTiles(nivora: SimState, reactive: SimState): KpiTileView[] {
  const kn = summarize(nivora.metrics);
  const kr = summarize(reactive.metrics);
  const cmp = compareKpi(kn, kr);
  const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
  const rate = kn.planet.recoveryRate;
  const baseRate = kr.planet.recoveryRate;
  const planetRaw = { nivora: pct(rate), reactive: pct(baseRate) };
  // Baik/buruk dinilai terhadap baseline reaktif, bukan angka absolut.
  const planetTrend: Trend =
    rate === null || baseRate === null || Math.round(rate * 100) === Math.round(baseRate * 100)
      ? 'neutral'
      : rate > baseRate
        ? 'better'
        : 'worse';
  const planet: KpiTileView =
    rate === null
      ? { key: 'planet', value: '—', direction: null, trend: 'neutral', sr: 'belum ada residu yang ditangani', ...planetRaw }
      : {
          key: 'planet',
          value: `${Math.round(rate * 100)}%`,
          direction: null,
          trend: planetTrend,
          sr: `${Math.round(rate * 100)}% residu kembali ke jalur sirkular`,
          ...planetRaw,
        };
  return [
    deltaTile('people', cmp.exposure, true, {
      nivora: String(Math.round(kn.people.exposureTotal)),
      reactive: String(Math.round(kr.people.exposureTotal)),
    }),
    planet,
    deltaTile('productivity', cmp.unnecessaryTrips, true, {
      nivora: String(kn.productivity.unnecessaryTrips),
      reactive: String(kr.productivity.unnecessaryTrips),
    }),
  ];
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
  /** Rute melewati zona pekerja (mis. saat bobot β = 0) — jangan disebut "safe". */
  throughZone: boolean;
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
      const vertices = ROUTE_CANDIDATES[c.id as keyof typeof ROUTE_CANDIDATES] ?? [];
      const throughZone = vertices.some((v, j) => {
        const next = vertices[j + 1];
        return next !== undefined && s.graph.edges.some((e) => e.zoneId && ((e.from === v && e.to === next) || (e.from === next && e.to === v)));
      });
      return {
        id: c.id,
        throughZone,
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

// ── Detail node (kartu terpilih) ─────────────────────────────────────────

export interface MweriTerm {
  key: 'H' | 'P' | 'W' | 'T';
  score: number; // 0–10
  weight: number;
  contribution: number; // weight × score
}

export interface NodeDetailView {
  terms: MweriTerm[];
  exposureMin: number;
  exposureWindowMin: number;
  /** Kemiringan tren residu (%/menit), null bila belum cukup data. */
  levelSlope: number | null;
  stage: string;
  destination: string;
}

/** Komposisi MWERI = Σ w·skor — menjelaskan kenapa Node C rendah (W = 0). */
export function nodeDetailView(s: SimState, id: string): NodeDetailView | null {
  const n = s.nodes.find((x) => x.id === id);
  if (!n) return null;
  const p = mweriParamsOf(n, NORMALIZATION.exposureLimitMin);
  const w = s.weights.mweri;
  const term = (key: MweriTerm['key'], score: number, weight: number): MweriTerm => ({
    key,
    score: +score.toFixed(1),
    weight: +weight.toFixed(2),
    contribution: +(score * weight).toFixed(2),
  });
  const { stage } = decidePathway(n.material);
  const facility = STAGE_FACILITY[stage];
  return {
    terms: [term('H', p.H, w.wH), term('P', p.P, w.wP), term('W', p.W, w.wW), term('T', p.T, w.wT)],
    exposureMin: n.exposureMin,
    exposureWindowMin: NORMALIZATION.exposureWindowMin,
    levelSlope: n.levelSlope === null ? null : +n.levelSlope.toFixed(2),
    stage: PATHWAY_LABEL[stage],
    destination: FACILITY_LABEL[facility] ?? facility,
  };
}

// ── Insight: volume vs risiko (pesan kunci esai) ─────────────────────────

export interface VolumeRiskInsight {
  nodeId: string;
  residue: number;
  mweri: string;
  rank: number;
  topNodeId: string;
}

/**
 * Node dengan residu tertinggi yang TIDAK menjadi prioritas #1 karena tidak ada pekerja di zonanya.
 * Sistem berbasis volume akan mendahulukannya; MWERI tidak (Node C pada demo).
 */
export function volumeRiskInsight(s: SimState): VolumeRiskInsight | null {
  const byResidue = [...s.nodes].sort((a, b) => b.residueLevel - a.residueLevel);
  const n = byResidue[0];
  const top = s.ranking[0];
  if (!n || !top || n.id === top || n.workers > 0) return null;
  return {
    nodeId: n.id,
    residue: Math.round(n.residueLevel),
    mweri: displayMweri(n.mweri).toFixed(1),
    rank: s.ranking.indexOf(n.id) + 1,
    topNodeId: top,
  };
}

// ── Simulasi what-if ────────────────────────────────────────────────────

export interface WhatIfNode {
  id: string;
  mweriBefore: string;
  mweriAfter: string;
  residueBefore: number;
  residueAfter: number;
  statusBefore: Status;
  statusAfter: Status;
  /** Pernah critical selama horizon simulasi. */
  becameCritical: boolean;
}

export interface WhatIfResult {
  fromT: number;
  minutes: number;
  nodes: WhatIfNode[];
  dispatches: number;
  reroutes: number;
  /** Lintasan MWERI tiap node (untuk garis "simulasi" di grafik). */
  trajectories: Record<string, { t: number; mweri: number }[]>;
  recommendationAfter: TextPart[];
}

/**
 * Jalankan engine `minutes` tick ke depan pada salinan state (fork, §5.3). State asli tidak berubah
 * karena `step` murni.
 */
export function whatIf(s0: SimState, minutes = 30): WhatIfResult {
  let s = s0;
  const trajectories: WhatIfResult['trajectories'] = Object.fromEntries(
    s0.nodes.map((n) => [n.id, [{ t: s0.t, mweri: n.mweri }]]),
  );
  const critical = new Set<string>();
  let dispatches = 0;
  let reroutes = 0;
  for (let i = 0; i < minutes; i++) {
    s = step(s);
    for (const n of s.nodes) {
      trajectories[n.id]?.push({ t: s.t, mweri: n.mweri });
      if (n.status === 'critical') critical.add(n.id);
    }
    // Event tick ini = event dengan t sama dengan waktu sekarang (t unik per tick).
    for (const e of s.events) {
      if (e.t !== s.t) continue;
      if (e.type === 'dispatch') dispatches += 1;
      if (e.type === 'reroute') reroutes += 1;
    }
  }
  return {
    fromT: s0.t,
    minutes,
    dispatches,
    reroutes,
    trajectories,
    recommendationAfter: recommendationParts(s),
    nodes: s0.nodes.map((before) => {
      const after = s.nodes.find((n) => n.id === before.id) ?? before;
      return {
        id: before.id,
        mweriBefore: displayMweri(before.mweri).toFixed(1),
        mweriAfter: displayMweri(after.mweri).toFixed(1),
        residueBefore: Math.round(before.residueLevel),
        residueAfter: Math.round(after.residueLevel),
        statusBefore: before.status,
        statusAfter: after.status,
        becameCritical: critical.has(before.id),
      };
    }),
  };
}

/** Gabungkan lintasan simulasi ke titik grafik sebagai seri `sim`. */
export function withSimulated(points: readonly ChartPoint[], traj: readonly { t: number; mweri: number }[] | undefined) {
  if (!traj || traj.length === 0) return points;
  const byT = new Map<number, ChartPoint>(points.map((p) => [p.t, { ...p }]));
  for (const q of traj) byT.set(q.t, { ...(byT.get(q.t) ?? { t: q.t }), sim: q.mweri });
  return [...byT.values()].sort((a, b) => a.t - b.t);
}
