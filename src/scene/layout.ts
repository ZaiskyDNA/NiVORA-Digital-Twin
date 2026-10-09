/** Konstanta tata letak scene yang dipakai beberapa komponen (dipisah agar fast refresh tetap jalan). */
import { NODE_MARKER, NODE_SEEDS, ROUTE_GRAPH } from '../config/plant';
import type { Vec3 } from '../sim/types';
import type { CameraPreset } from '../store/useView';

/** Lantai ±42 × ±30 (§6). */
export const FLOOR_SIZE: [number, number] = [84, 60];

export const TOWER = { w: 3.2, h: 9 };
export const POLE = { r: 0.3, h: 5.5 };

/** Titik puncak beacon node — dipakai penanda, label, dan (nanti) NodeCard. */
export const beaconHeight = (nodeId: string): number =>
  NODE_MARKER[nodeId] === 'pole' ? POLE.h + 0.6 : TOWER.h + 0.6;

const nodeA = NODE_SEEDS.find((n) => n.id === 'A')?.position ?? [0, 0, 0];

/** Sudut isometrik sejati: elevasi atan(1/√2) ≈ 35.26° → polar dari sumbu Y ≈ 54.74°. */
export const ISO_POLAR = Math.PI / 2 - Math.atan(1 / Math.SQRT2);
export const ISO_AZIMUTH = Math.PI / 4;

export interface CameraPose {
  target: Vec3;
  /** Sudut dari sumbu +Y (rad). */
  polar: number;
  /** Sudut di bidang XZ dari +Z ke +X (rad). */
  azimuth: number;
  /** Pengali zoom terhadap zoom dasar "seluruh lantai terlihat". */
  zoom: number;
}

export const CAMERA_PRESETS_POSE: Record<CameraPreset, CameraPose> = {
  // Kalibrasi dari docs/reference.png: pusat layar ≈ titik dunia (−7, 0, −5).
  overview: { target: [-7, 0, -5], polar: ISO_POLAR, azimuth: ISO_AZIMUTH, zoom: 1 },
  nodeA: { target: [nodeA[0], 3, nodeA[2]], polar: ISO_POLAR, azimuth: ISO_AZIMUTH, zoom: 2.4 },
  // Lebih tegak agar rute Node A → Reprocessing & zona pekerja terbaca seperti peta.
  route: { target: [-17, 0, 15], polar: 0.6, azimuth: ISO_AZIMUTH, zoom: 1.9 },
};

/**
 * Zoom dasar (px per unit dunia) agar seluruh lantai muat seperti di referensi
 * (diagonal lantai ≈ 72% lebar layar).
 */
export function baseZoom(width: number, height: number): number {
  const [w, d] = FLOOR_SIZE;
  const isoWidth = (w + d) / Math.SQRT2; // lebar belah ketupat lantai di layar, dalam unit
  const isoHeight = isoWidth * Math.cos(ISO_POLAR) + 12; // + ruang untuk bangunan tinggi
  return Math.min((width * 0.72) / isoWidth, (height * 0.78) / isoHeight);
}

/** Posisi kamera dari pose (jarak tetap — ortografis tidak bergantung jarak). */
export const CAMERA_DISTANCE = 140;
export function cameraPosition(p: Pick<CameraPose, 'target' | 'polar' | 'azimuth'>): Vec3 {
  const [x, y, z] = p.target;
  const r = CAMERA_DISTANCE;
  return [
    x + r * Math.sin(p.polar) * Math.sin(p.azimuth),
    y + r * Math.cos(p.polar),
    z + r * Math.sin(p.polar) * Math.cos(p.azimuth),
  ];
}

/** Arah "kanan layar" pada kamera isometrik (azimuth 45°) di bidang XZ. */
const SCREEN_RIGHT: Vec3 = [Math.SQRT1_2, 0, -Math.SQRT1_2];

/** Titik label = anchor + geseran dalam satuan layar (kanan, atas) — untuk garis penunjuk diagonal. */
export function offsetOnScreen([x, y, z]: Vec3, right: number, up: number): Vec3 {
  return [x + SCREEN_RIGHT[0] * right, y + up, z + SCREEN_RIGHT[2] * right];
}

/** Posisi vertex graf rute (dipakai rute & truk). */
export const VERTEX_POS: Readonly<Record<string, Vec3>> = Object.fromEntries(
  ROUTE_GRAPH.vertices.map((v) => [v.id, v.position]),
);

/** Ketinggian garis rute di atas jalan. */
export const ROUTE_Y = 0.18;
