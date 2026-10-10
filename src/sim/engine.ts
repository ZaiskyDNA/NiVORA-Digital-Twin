/**
 * Loop simulasi (§5.6). Tick = 1 menit simulasi.
 * `step` murni: menerima state, mengembalikan state baru (salinan) — state lama tidak berubah,
 * sehingga fork what-if cukup memanggil `runTicks` pada state yang sama (§13.5).
 *
 * Urutan per tick (§13.2: MWERI sebelum Edge-AI):
 *   1. truk bergerak / tiba / re-route   2. sensor   3. graf (R dinamis)   4. MWERI
 *   5. Digital Twin   6. Edge-AI   7. ranking   8. dispatch   9. rekomendasi   10. KPI
 */
import {
  HAULING,
  NODE_DYNAMICS,
  NODE_SEEDS,
  NODE_VERTEX,
  ROUTE_CANDIDATES,
  ROUTE_GRAPH,
  STAGE_FACILITY,
} from '../config/plant';
import { SCENARIOS, type ScenarioId } from '../config/scenarios';
import { POLICY, SIM } from '../config/thresholds';
import { DEFAULT_MWERI_WEIGHTS, DEFAULT_ROUTE_WEIGHTS, NORMALIZATION } from '../config/weights';
import { predict } from './digitalTwin';
import { classifyStatus } from './edgeAI';
import { createMetrics, recordArrival, recordDispatch, recordTick, type MetricsAcc } from './metrics';
import { clamp, computeMweri, mweriParamsOf, rankByMweri } from './mweri';
import { decidePathway, type PathwayStage } from './pathway';
import { createRng, deriveSeed, nextInt, type RngState } from './rng';
import {
  compositeCost,
  routeFromVertices,
  safeRoute,
  shortestRoute,
  type Route,
  type ScoreTotals,
} from './routing';
import { initialExposureWindow, updateSensors } from './sensors';
import type { Graph, Leg, MweriWeights, NodeState, RouteWeights, Status, Task } from './types';

export type Policy = 'nivora' | 'reactive';

export interface SimWeights {
  mweri: MweriWeights;
  route: RouteWeights;
}

export type SimEventType = 'dispatch' | 'arrive' | 'reroute' | 'status' | 'scenario' | 'no-route';

export interface SimEvent {
  t: number;
  type: SimEventType;
  nodeId?: string;
  taskId?: number;
  detail?: string;
}

export interface RouteRow {
  id: string;
  totals: ScoreTotals;
  cost: number;
  blocked: boolean;
}

export type Urgency = 'now' | 'soon' | 'monitor';

/** Rekomendasi operasional: kapan · prioritas · ke mana · lewat mana. */
export interface Recommendation {
  nodeId: string;
  rank: number;
  urgency: Urgency;
  ttc: number | null;
  stage: PathwayStage;
  destination: string;
  route: Route | null;
  shortest: Route | null;
  /** Tabel Lampiran 7 — hanya bila asal/tujuan cocok dengan rute kandidat. */
  candidates: RouteRow[];
  selectedCandidate: string | null;
  taskActive: boolean;
}

export interface SimState {
  t: number;
  seed: number;
  policy: Policy;
  scenarioId: ScenarioId;
  weights: SimWeights;
  envRng: RngState;
  decisionRng: RngState;
  nodes: NodeState[];
  graph: Graph;
  ranking: string[];
  tasks: Task[];
  nextTaskId: number;
  scheduleCursor: number;
  recommendation: Recommendation | null;
  metrics: MetricsAcc;
  events: SimEvent[];
}

export interface InitOptions {
  seed?: number;
  policy?: Policy;
  scenarioId?: ScenarioId;
  weights?: SimWeights;
}

export const DEFAULT_SEED = 20260;
const WARMUP_SAMPLES = 20;

const ENV_STREAM = 1;
const DECISION_STREAM = 2;

// ── Inisialisasi ────────────────────────────────────────────────────────

export function createInitialState(opts: InitOptions = {}): SimState {
  const seed = opts.seed ?? DEFAULT_SEED;
  const nodes: NodeState[] = NODE_SEEDS.map((seedNode) => ({
    ...structuredClone(seedNode),
    status: 'normal' as Status,
    statusReasons: [],
    mweri: 0,
    ttc: null,
    levelSlope: null,
    history: [],
    exposureWindow: initialExposureWindow(seedNode.exposureMin, NORMALIZATION.exposureWindowMin),
  }));

  const s: SimState = {
    t: 0,
    seed,
    policy: opts.policy ?? 'nivora',
    scenarioId: opts.scenarioId ?? 'normal',
    weights: structuredClone(opts.weights ?? { mweri: DEFAULT_MWERI_WEIGHTS, route: DEFAULT_ROUTE_WEIGHTS }),
    envRng: createRng(deriveSeed(seed, ENV_STREAM)),
    decisionRng: createRng(deriveSeed(seed, DECISION_STREAM)),
    nodes,
    graph: ROUTE_GRAPH,
    ranking: [],
    tasks: [],
    nextTaskId: 1,
    scheduleCursor: 0,
    recommendation: null,
    metrics: createMetrics(),
    events: [],
  };

  s.graph = buildGraph(s);
  for (const n of s.nodes) n.mweri = mweriOf(n, s.weights);
  // Warm-up history (§13.4): tren level linear sesuai laju akumulasi normal, MWERI datar.
  for (const n of s.nodes) {
    const acc = NODE_DYNAMICS[n.id]?.accumulation ?? 0;
    for (let k = WARMUP_SAMPLES - 1; k >= 0; k--) {
      n.history.push({ t: -k, mweri: n.mweri, level: clamp(n.residueLevel - acc * k, 0, 100) });
    }
  }
  evaluate(s, { pushHistory: false, logStatus: false });
  refreshRecommendation(s, null);
  return s;
}

// ── Tick ────────────────────────────────────────────────────────────────

export function step(prev: SimState): SimState {
  const s = structuredClone(prev);
  s.t += 1;
  const scenario = SCENARIOS[s.scenarioId];

  moveTrucks(s);

  const dustZones = new Set<string>();
  for (const task of s.tasks) {
    const leg = task.loadingMin <= 0 ? task.legs[task.leg] : undefined;
    if (leg?.zoneId) dustZones.add(leg.zoneId);
  }
  updateSensors(s.nodes, {
    scenario,
    dynamics: NODE_DYNAMICS,
    rng: s.envRng,
    dustZones,
    dustBoost: HAULING.dustBoost,
    exposureWindowMin: NORMALIZATION.exposureWindowMin,
    exposurePm: SIM.exposurePm,
  });

  s.graph = buildGraph(s);
  evaluate(s, { pushHistory: true, logStatus: true });
  dispatch(s);
  refreshRecommendation(s, prev.recommendation);
  recordTick(s.metrics, s.t, s.nodes, { shiftMin: SIM.shiftMin, exposurePm: SIM.exposurePm });
  return s;
}

export function runTicks(state: SimState, n: number): SimState {
  let s = state;
  for (let i = 0; i < n; i++) s = step(s);
  return s;
}

// ── Aksi (murni) ────────────────────────────────────────────────────────

export function setScenario(prev: SimState, scenarioId: ScenarioId): SimState {
  if (prev.scenarioId === scenarioId) return prev;
  const s = structuredClone(prev);
  s.scenarioId = scenarioId;
  s.graph = buildGraph(s);
  pushEvent(s, { t: s.t, type: 'scenario', detail: scenarioId });
  rerouteTasks(s); // truk yang sudah jalan langsung dialihkan, tidak menunggu tick berikutnya
  refreshRecommendation(s, prev.recommendation);
  return s;
}

export function setWeights(prev: SimState, weights: Partial<SimWeights>): SimState {
  const s = structuredClone(prev);
  s.weights = { mweri: weights.mweri ?? s.weights.mweri, route: weights.route ?? s.weights.route };
  evaluate(s, { pushHistory: false, logStatus: true });
  refreshRecommendation(s, prev.recommendation);
  return s;
}

// ── Internal ────────────────────────────────────────────────────────────

const mweriOf = (n: NodeState, w: SimWeights): number =>
  computeMweri(mweriParamsOf(n, NORMALIZATION.exposureLimitMin), w.mweri);

/** Pekerja baseline per zona — R edge di zona tsb. = R snapshot × pekerja sekarang / baseline. */
const BASELINE_ZONE_WORKERS: Record<string, number> = Object.fromEntries(
  NODE_SEEDS.map((n) => [n.zoneId, n.workers]),
);

/** Graf aktif: edge skenario diblokir + R dinamis dari pekerja di zona (§5.5). */
export function buildGraph(s: Pick<SimState, 'scenarioId' | 'nodes'>): Graph {
  const disabled = new Set(SCENARIOS[s.scenarioId].disabledEdges);
  const workersByZone = new Map(s.nodes.map((n) => [n.zoneId, n.workers]));
  return {
    vertices: ROUTE_GRAPH.vertices,
    edges: ROUTE_GRAPH.edges.map((e) => {
      const base = e.zoneId ? BASELINE_ZONE_WORKERS[e.zoneId] : undefined;
      const now = e.zoneId ? workersByZone.get(e.zoneId) : undefined;
      const R = base && now !== undefined ? clamp((e.R * now) / base) : e.R;
      return { ...e, R, disabled: disabled.has(e.id) || undefined };
    }),
  };
}

/** Langkah 4–7: MWERI → Digital Twin → Edge-AI → ranking. */
function evaluate(s: SimState, opts: { pushHistory: boolean; logStatus: boolean }): void {
  for (const n of s.nodes) {
    n.mweri = mweriOf(n, s.weights);
    if (opts.pushHistory) {
      n.history.push({ t: s.t, mweri: n.mweri, level: n.residueLevel });
      if (n.history.length > SIM.historyMax) n.history.splice(0, n.history.length - SIM.historyMax);
    } else {
      const last = n.history.at(-1);
      if (last && last.t === s.t) last.mweri = n.mweri;
    }
    const p = predict(n.history);
    n.ttc = p.ttc;
    n.levelSlope = p.levelSlope;
    const { status, reasons } = classifyStatus({
      residueLevel: n.residueLevel,
      pm: n.pm,
      mweri: n.mweri,
      levelSlope: n.levelSlope,
    });
    if (opts.logStatus && status !== n.status) {
      pushEvent(s, { t: s.t, type: 'status', nodeId: n.id, detail: `${n.status}→${status}` });
    }
    n.status = status;
    n.statusReasons = reasons;
  }
  s.ranking = rankByMweri(s.nodes);
}

type RouteFn = (graph: Graph, from: string, to: string) => Route | null;

const routeFnOf = (s: SimState): RouteFn =>
  s.policy === 'nivora' ? (g, a, b) => safeRoute(g, a, b, s.weights.route) : shortestRoute;

/** Ruas truk dari rute (orientasi mengikuti urutan vertex). */
function legsOf(route: Route): Leg[] {
  return route.edges.map((e, i) => ({
    edgeId: e.id,
    from: route.vertices[i] as string,
    to: route.vertices[i + 1] as string,
    D: e.D,
    zoneId: e.zoneId,
  }));
}

/** Langkah 8: buat task penanganan sesuai kebijakan. */
function dispatch(s: SimState): void {
  const busy = new Set(s.tasks.map((t) => t.nodeId));
  const canSend = () => s.tasks.length < HAULING.fleet;

  if (s.policy === 'nivora') {
    s.ranking.forEach((id, i) => {
      const n = s.nodes.find((x) => x.id === id);
      if (!n || busy.has(id) || !canSend()) return;
      if (n.residueLevel < POLICY.nivoraMinLoadLevel) return;
      const imminent = i === 0 && n.ttc !== null && n.ttc < POLICY.nivoraTtcDispatch;
      if (n.status === 'critical' || imminent) createTask(s, n);
    });
    return;
  }

  // Reaktif: ambang residu tinggi ATAU jadwal tetap bergiliran; rute = terpendek (§8).
  for (const n of s.nodes) {
    if (n.residueLevel >= POLICY.reactiveLevel && !busy.has(n.id) && canSend()) {
      createTask(s, n);
      busy.add(n.id);
    }
  }
  if (s.t > 0 && s.t % POLICY.reactiveScheduleMin === 0) {
    const n = s.nodes[s.scheduleCursor % s.nodes.length];
    s.scheduleCursor += 1;
    if (n && !busy.has(n.id) && canSend()) createTask(s, n);
  }
}

function createTask(s: SimState, n: NodeState): void {
  const { stage } = decidePathway(n.material);
  const destination = STAGE_FACILITY[stage];
  const from = NODE_VERTEX[n.id];
  const route = from ? routeFnOf(s)(s.graph, from, destination) : null;
  if (!route) {
    pushEvent(s, { t: s.t, type: 'no-route', nodeId: n.id, detail: destination });
    return;
  }
  const [lo, hi] = HAULING.loadingMin;
  const task: Task = {
    id: s.nextTaskId++,
    nodeId: n.id,
    stage,
    destination,
    legs: legsOf(route),
    leg: 0,
    legProgress: 0,
    loadingMin: nextInt(s.decisionRng, lo, hi),
    dispatchedAt: s.t,
    nodeStatusAtDispatch: n.status,
  };
  s.tasks.push(task);
  recordDispatch(s.metrics, route.totals.D, n.status, n.residueLevel < POLICY.nivoraMinLoadLevel);
  pushEvent(s, { t: s.t, type: 'dispatch', nodeId: n.id, taskId: task.id, detail: route.vertices.join('→') });
}

/** Langkah 1: muat → jalan → re-route bila ruas diblokir → tiba & kurangi residu. */
function moveTrucks(s: SimState): void {
  // Rencana rute diperbarui juga selama muat, agar truk tidak berangkat ke ruas yang diblokir.
  rerouteTasks(s);
  const arrived: Task[] = [];

  for (const task of s.tasks) {
    if (task.loadingMin > 0) {
      task.loadingMin -= 1;
      continue;
    }

    let budget: number = HAULING.speed;
    while (budget > 0 && task.leg < task.legs.length) {
      const leg = task.legs[task.leg] as Leg;
      const left = leg.D - task.legProgress;
      if (budget >= left) {
        budget -= left;
        task.leg += 1;
        task.legProgress = 0;
      } else {
        task.legProgress += budget;
        budget = 0;
      }
    }
    if (task.leg >= task.legs.length) arrived.push(task);
  }

  for (const task of arrived) {
    const n = s.nodes.find((x) => x.id === task.nodeId);
    if (n) {
      const amount = Math.max(0, Math.min(HAULING.capacity, n.residueLevel - HAULING.floorLevel));
      n.residueLevel -= amount;
      recordArrival(s.metrics, amount, task.stage);
    }
    pushEvent(s, { t: s.t, type: 'arrive', nodeId: task.nodeId, taskId: task.id, detail: task.destination });
  }
  s.tasks = s.tasks.filter((t) => !arrived.includes(t));
}

function rerouteTasks(s: SimState): void {
  const disabled = new Set(s.graph.edges.filter((e) => e.disabled).map((e) => e.id));
  const route = routeFnOf(s);
  for (const task of s.tasks) rerouteIfBlocked(s, task, disabled, route);
}

function rerouteIfBlocked(s: SimState, task: Task, disabled: ReadonlySet<string>, route: RouteFn): void {
  const cur = task.legs[task.leg];
  if (!cur) return;
  const blocked = (l: Leg) => !l.retreat && disabled.has(l.edgeId);
  const currentBlocked = blocked(cur);
  const aheadBlocked = task.legs.slice(task.leg + 1).some(blocked);
  if (!currentBlocked && !aheadBlocked) return;

  // Belum mulai menempuh ruas → hitung ulang dari posisi sekarang.
  // Ruas sekarang diblokir → putar balik ke awal ruas. Selain itu → selesaikan ruas, lalu belok.
  const notStarted = task.legProgress === 0;
  const pivot = notStarted || currentBlocked ? cur.from : cur.to;
  const next = route(s.graph, pivot, task.destination);
  if (!next) return; // tidak ada jalan: truk menunggu di tempat

  const head: Leg[] = notStarted
    ? []
    : currentBlocked
      ? [{ ...cur, from: cur.to, to: cur.from, D: task.legProgress, retreat: true }]
      : [cur];
  const progress = notStarted || currentBlocked ? 0 : task.legProgress;
  task.legs = [...head, ...legsOf(next)];
  task.leg = 0;
  task.legProgress = progress;
  pushEvent(s, { t: s.t, type: 'reroute', nodeId: task.nodeId, taskId: task.id, detail: next.vertices.join('→') });
}

/** Langkah 9: rekomendasi untuk node prioritas #1 + deteksi re-routing. */
function refreshRecommendation(s: SimState, prev: Recommendation | null): void {
  const topId = s.ranking[0];
  const n = s.nodes.find((x) => x.id === topId);
  const from = topId ? NODE_VERTEX[topId] : undefined;
  if (!n || !from) {
    s.recommendation = null;
    return;
  }
  const { stage } = decidePathway(n.material);
  const destination = STAGE_FACILITY[stage];
  const route = routeFnOf(s)(s.graph, from, destination);
  const shortest = shortestRoute(s.graph, from, destination);

  const candidates: RouteRow[] = [];
  const first = ROUTE_CANDIDATES.A[0];
  const last = ROUTE_CANDIDATES.A[ROUTE_CANDIDATES.A.length - 1];
  if (from === first && destination === last) {
    const open: Graph = { vertices: s.graph.vertices, edges: s.graph.edges.map((e) => ({ ...e, disabled: undefined })) };
    for (const [id, vertices] of Object.entries(ROUTE_CANDIDATES)) {
      const r = routeFromVertices(open, vertices, compositeCost(s.weights.route));
      if (!r) continue;
      candidates.push({
        id,
        totals: r.totals,
        cost: r.cost,
        blocked: routeFromVertices(s.graph, vertices, compositeCost(s.weights.route)) === null,
      });
    }
  }
  const sameVertices = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  const selectedCandidate =
    route === null
      ? null
      : (Object.entries(ROUTE_CANDIDATES).find(([, v]) => sameVertices(v, route.vertices))?.[0] ?? null);

  // "now" hanya bila kebijakan memang akan mengirim truk (sama dengan aturan dispatch NiVORA).
  const due = n.status === 'critical' || (n.ttc !== null && n.ttc < POLICY.nivoraTtcDispatch);
  const worthHauling = n.residueLevel >= POLICY.nivoraMinLoadLevel;
  const urgency: Urgency = due && worthHauling ? 'now' : n.ttc !== null && worthHauling ? 'soon' : 'monitor';

  s.recommendation = {
    nodeId: n.id,
    rank: 1,
    urgency,
    ttc: n.ttc,
    stage,
    destination,
    route,
    shortest,
    candidates,
    selectedCandidate,
    taskActive: s.tasks.some((t) => t.nodeId === n.id),
  };

  if (
    prev &&
    prev.nodeId === n.id &&
    prev.destination === destination &&
    prev.route &&
    route &&
    !sameVertices(prev.route.vertices, route.vertices)
  ) {
    pushEvent(s, {
      t: s.t,
      type: 'reroute',
      nodeId: n.id,
      detail: `${prev.route.vertices.join('→')} ⇒ ${route.vertices.join('→')}`,
    });
  }
}

function pushEvent(s: SimState, e: SimEvent): void {
  s.events.push(e);
  if (s.events.length > SIM.eventsMax) s.events.splice(0, s.events.length - SIM.eventsMax);
}
