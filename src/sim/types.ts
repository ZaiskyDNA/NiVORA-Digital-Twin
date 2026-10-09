/** Tipe domain NiVORA (CLAUDE.md §4). Murni data — tanpa React/Three. */

export type Status = 'normal' | 'warning' | 'critical';

/** Kelas MWERI (§5.1): 0–3 Rendah · 3–6 Sedang · 6–8 Tinggi · 8–10 Kritis. */
export type MweriClass = 'rendah' | 'sedang' | 'tinggi' | 'kritis';

export type Vec3 = [number, number, number];

/** Karakteristik material residu — input Circular Material Decision Pathway (§5.4). */
export interface Material {
  compatibleWithProcess: boolean;
  secondaryUse: boolean;
  recoverableValue: boolean;
  treatable: boolean;
}

export interface HistorySample {
  t: number; // menit simulasi
  mweri: number;
  level: number; // residueLevel %
}

export interface NodeState {
  id: string;
  name: string;
  position: Vec3;
  residueLevel: number; // 0–100 (%)
  pm: number; // skor partikulat 0–10 (= P setelah normalisasi pm_raw / pmLimit)
  workers: number; // jumlah pekerja di zona node — berbasis zona, TANPA identitas
  maxWorkersZone: number; // kapasitas zona untuk normalisasi W
  exposureMin: number; // paparan dalam jendela bergulir (§13.4), menit
  hazard: number; // H: bahaya material 0–10
  status: Status;
  mweri: number;
  ttc: number | null;
  history: HistorySample[];
  material: Material;
}

/** Data awal node di plant.ts — field turunan (status, MWERI, prediksi) dihitung engine. */
export type NodeSeed = Omit<NodeState, 'status' | 'mweri' | 'ttc' | 'history'>;

/** Parameter MWERI pada skala 0–10. */
export interface MweriParams {
  H: number;
  P: number;
  W: number;
  T: number;
}

export interface MweriWeights {
  wH: number;
  wP: number;
  wW: number;
  wT: number;
}

export interface RouteWeights {
  alpha: number; // jarak D
  beta: number; // risiko pekerja R
  gamma: number; // gangguan operasional O
}

/**
 * Edge graf rute (tak berarah). Skor D/R/O 0–10 per edge; skor sebuah rute = jumlah
 * skor edge-nya (§13.3).
 */
export interface Edge {
  id: string;
  from: string;
  to: string;
  D: number;
  R: number;
  O: number;
  disabled?: boolean;
  /** Zona pekerja yang dilewati — dasar R dinamis di Fase 2. */
  zoneId?: string;
}

export interface Vertex {
  id: string;
  position: Vec3;
}

export interface Graph {
  vertices: Vertex[];
  edges: Edge[];
}
