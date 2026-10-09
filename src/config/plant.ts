/**
 * Layout fasilitas, node, dan graf rute (§6). Data, bukan kode.
 * Koordinat dunia [x, y, z]; lantai ±42 × ±30. Posisi kira-kira — disetel ulang di Fase 3
 * terhadap docs/reference.png. Semua nilai ilustratif.
 */
import type { PathwayStage } from '../sim/pathway';
import type { Graph, NodeSeed, Vec3 } from '../sim/types';

// ── Node sensor ─────────────────────────────────────────────────────────
// Baseline awal shift (t = 0) — engine mulai dari sini. Belum ada node yang critical, sehingga
// skenario menentukan seberapa cepat kondisi memburuk (§8).
// W = workers / maxWorkersZone × 10; T = exposureMin / exposureLimitMin(60) × 10.
export const NODE_SEEDS: NodeSeed[] = [
  {
    id: 'A',
    name: 'Transfer Point 1',
    position: [0, 0, 2],
    residueLevel: 45,
    pm: 5.5,
    zoneId: 'wz-high',
    workers: 9,
    maxWorkersZone: 10,
    exposureMin: 20,
    hazard: 8,
    material: { compatibleWithProcess: true, secondaryUse: true, recoverableValue: true, treatable: true },
  },
  {
    id: 'B',
    name: 'Transfer Point 2',
    position: [8, 0, -6],
    residueLevel: 40,
    pm: 4.5,
    zoneId: 'zone-b',
    workers: 3,
    maxWorkersZone: 10,
    exposureMin: 15,
    hazard: 7,
    material: { compatibleWithProcess: false, secondaryUse: false, recoverableValue: true, treatable: true },
  },
  {
    id: 'C',
    name: 'Stockpile Edge',
    position: [20, 0, 10],
    residueLevel: 58,
    pm: 3,
    zoneId: 'zone-c',
    workers: 0,
    maxWorkersZone: 10,
    exposureMin: 12,
    hazard: 6,
    material: { compatibleWithProcess: false, secondaryUse: false, recoverableValue: false, treatable: true },
  },
];

/**
 * Potret Lampiran 4 esai: A (H8 P9 W9 T5) → 8.4, B (H7 P6 W3 T4) → 5.1, C (H6 P3 W0 T2) → 2.6.
 * Bukan titik awal engine — dipakai test & sebagai acuan; kondisi serupa muncul saat Production Surge.
 */
export const ESSAY_SNAPSHOT: Record<string, Pick<NodeSeed, 'residueLevel' | 'pm' | 'workers' | 'exposureMin'>> = {
  A: { residueLevel: 72, pm: 9, workers: 9, exposureMin: 30 },
  B: { residueLevel: 54, pm: 6, workers: 3, exposureMin: 24 },
  C: { residueLevel: 61, pm: 3, workers: 0, exposureMin: 12 },
};

/** Dinamika sensor sintetis per node (§5.6). Nilai ilustratif, per menit pada laju produksi 1.0×. */
export interface NodeDynamics {
  /** Akumulasi residu (% per menit). */
  accumulation: number;
  /** Skor PM dasar dari aktivitas crusher/conveyor di sekitar node. */
  pmBase: number;
  /** Rentang jumlah pekerja di zona (random walk). */
  workersMin: number;
  workersMax: number;
}

export const NODE_DYNAMICS: Record<string, NodeDynamics> = {
  A: { accumulation: 0.35, pmBase: 6, workersMin: 7, workersMax: 10 },
  B: { accumulation: 0.2, pmBase: 4.5, workersMin: 2, workersMax: 4 },
  // Node C: tidak ada pekerja — pesan kunci esai (residu tinggi, MWERI rendah).
  C: { accumulation: 0.12, pmBase: 2.5, workersMin: 0, workersMax: 0 },
};

/** Truk & penanganan (ilustratif). */
export const HAULING = {
  /** Kecepatan truk (satuan D per menit). */
  speed: 0.5,
  /** Residu yang diangkut per trip (% level node). */
  capacity: 45,
  /** Level minimum setelah ditangani. */
  floorLevel: 5,
  /** Jumlah truk maksimum yang beroperasi bersamaan. */
  fleet: 2,
  /** Rentang waktu muat (menit), diacak dengan stream RNG keputusan. */
  loadingMin: [1, 3] as [number, number],
  /** Tambahan skor PM di zona yang sedang dilintasi truk (debu jalan angkut). */
  dustBoost: 1.5,
} as const;

// ── Fasilitas ───────────────────────────────────────────────────────────
export type FacilityKind =
  | 'stockpile'
  | 'crusher'
  | 'smelter'
  | 'reprocessing'
  | 'recovery'
  | 'treatment'
  | 'disposal';

export interface Facility {
  id: string;
  kind: FacilityKind;
  position: Vec3;
  size: Vec3;
}

export const FACILITIES: Facility[] = [
  { id: 'stockpile', kind: 'stockpile', position: [16, 0, 16], size: [10, 4, 8] },
  { id: 'crusher', kind: 'crusher', position: [8, 0, 8], size: [5, 5, 5] },
  { id: 'smelter', kind: 'smelter', position: [-2, 0, -14], size: [14, 9, 10] },
  { id: 'reprocessing', kind: 'reprocessing', position: [-18, 0, -2], size: [6, 5, 6] },
  { id: 'recovery', kind: 'recovery', position: [6, 0, -18], size: [6, 4, 6] },
  { id: 'treatment', kind: 'treatment', position: [26, 0, -10], size: [6, 4, 6] },
  { id: 'disposal', kind: 'disposal', position: [32, 0, 6], size: [10, 0.5, 7] },
];

/** Zona pekerja. `wz-high` = zona aktivitas tinggi antara Node A & Reprocessing (§6). */
export const WORKER_ZONES: { id: string; center: Vec3; size: [number, number] }[] = [
  { id: 'wz-high', center: [-9, 0, 3], size: [8, 7] },
  { id: 'zone-b', center: [8, 0, -8], size: [6, 4] },
  { id: 'zone-c', center: [20, 0, 12], size: [6, 4] },
];

/** Tahap pathway → fasilitas tujuan (§5.4, §13.6). Repurpose/Recycle ditangani unit Reprocessing. */
export const STAGE_FACILITY: Record<PathwayStage, string> = {
  reuse: 'reprocessing',
  recycle: 'reprocessing',
  recovery: 'recovery',
  treatment: 'treatment',
  disposal: 'disposal',
};

// ── Graf rute ───────────────────────────────────────────────────────────
// Skor edge dirancang agar Σ skor tiap rute kandidat = Lampiran 7 (§13.3):
//   A  nodeA → wz → reprocessing           D 1+1     R 5+4     O 2+1    = 2/9/3 → 5.7
//   B  nodeA → j1 → j2 → reprocessing      D 1+2+1   R 1+0+1   O 1+1+1  = 4/2/3 → 2.8
//   C  nodeA → j3 → j4 → reprocessing      D 2+2+1   R 1+2+1   O 1+0+1  = 5/4/2 → 3.9
// R pada edge ini = snapshot awal; R dinamis dihitung engine dari pekerja di `zoneId` (Fase 2).
export const ROUTE_GRAPH: Graph = {
  vertices: [
    { id: 'nodeA', position: [0, 0, 2] },
    { id: 'nodeB', position: [8, 0, -6] },
    { id: 'nodeC', position: [20, 0, 10] },
    { id: 'wz', position: [-9, 0, 3] },
    { id: 'j1', position: [2, 0, -5] },
    { id: 'j2', position: [-14, 0, -7] },
    { id: 'j3', position: [0, 0, 12] },
    { id: 'j4', position: [-16, 0, 10] },
    { id: 'j5', position: [18, 0, 3] },
    { id: 'reprocessing', position: [-18, 0, -2] },
    { id: 'recovery', position: [6, 0, -18] },
    { id: 'treatment', position: [26, 0, -10] },
    { id: 'disposal', position: [32, 0, 6] },
  ],
  edges: [
    // Rute A — terpendek, menembus zona pekerja
    { id: 'nodeA-wz', from: 'nodeA', to: 'wz', D: 1, R: 5, O: 2, zoneId: 'wz-high' },
    { id: 'wz-reprocessing', from: 'wz', to: 'reprocessing', D: 1, R: 4, O: 1, zoneId: 'wz-high' },
    // Rute B — jalan angkut belakang (safe route)
    { id: 'nodeA-j1', from: 'nodeA', to: 'j1', D: 1, R: 1, O: 1 },
    { id: 'j1-j2', from: 'j1', to: 'j2', D: 2, R: 0, O: 1 },
    { id: 'j2-reprocessing', from: 'j2', to: 'reprocessing', D: 1, R: 1, O: 1 },
    // Rute C — jalan angkut depan (alternatif)
    { id: 'nodeA-j3', from: 'nodeA', to: 'j3', D: 2, R: 1, O: 1 },
    { id: 'j3-j4', from: 'j3', to: 'j4', D: 2, R: 2, O: 0 },
    { id: 'j4-reprocessing', from: 'j4', to: 'reprocessing', D: 1, R: 1, O: 1 },
    // Jaringan pendukung node B & C
    { id: 'nodeB-j1', from: 'nodeB', to: 'j1', D: 1, R: 1, O: 1 },
    { id: 'j1-recovery', from: 'j1', to: 'recovery', D: 2, R: 1, O: 1 },
    { id: 'j1-j5', from: 'j1', to: 'j5', D: 3, R: 1, O: 2 },
    { id: 'nodeC-j5', from: 'nodeC', to: 'j5', D: 1, R: 0, O: 1 },
    { id: 'j3-j5', from: 'j3', to: 'j5', D: 3, R: 1, O: 1 },
    { id: 'j5-treatment', from: 'j5', to: 'treatment', D: 2, R: 1, O: 1 },
    { id: 'j5-disposal', from: 'j5', to: 'disposal', D: 1, R: 0, O: 1 },
  ],
};

/** Node sensor → vertex graf. */
export const NODE_VERTEX: Record<string, string> = { A: 'nodeA', B: 'nodeB', C: 'nodeC' };

/** Rute kandidat bernama untuk tabel routing (Lampiran 7). */
export const ROUTE_CANDIDATES = {
  A: ['nodeA', 'wz', 'reprocessing'],
  B: ['nodeA', 'j1', 'j2', 'reprocessing'],
  C: ['nodeA', 'j3', 'j4', 'reprocessing'],
} as const satisfies Record<string, readonly string[]>;

/** Edge kunci safe route yang diblokir pada skenario Route Disruption (§8). */
export const DISRUPTION_EDGE_ID = 'j1-j2';
