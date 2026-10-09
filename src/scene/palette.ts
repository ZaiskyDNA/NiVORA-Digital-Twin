/**
 * Warna material scene. Status & peran dari token (src/styles/tokens.ts); warna fasilitas
 * khusus scene, diambil dari docs/reference.png (low-poly digital twin, bukan fotorealistis).
 */
import type { FacilityKind } from '../config/plant';
import { Color } from 'three';
import type { Status } from '../sim/types';
import { COLOR } from '../styles/tokens';

export const STATUS_COLOR: Record<Status, string> = {
  normal: COLOR.normal,
  warning: COLOR.warning,
  critical: COLOR.critical,
};

export interface FacilityStyle {
  body: string; // warna sisi
  top: string; // warna muka atas (lebih terang)
  edge: string; // garis tepi menyala
}

export const FACILITY_STYLE: Record<FacilityKind, FacilityStyle> = {
  smelter: { body: '#2c3d5c', top: '#3b5379', edge: '#6fb6ff' },
  crusher: { body: '#2c3a52', top: '#3e5170', edge: '#6fb6ff' },
  reprocessing: { body: '#156b55', top: '#1f9d79', edge: COLOR.normal },
  recovery: { body: '#16707f', top: '#1fa3b5', edge: COLOR.safe },
  treatment: { body: '#4b3a7c', top: '#6a55a8', edge: '#b39cff' },
  disposal: { body: '#3a2a22', top: '#4a362b', edge: '#c28a6a' },
  stockpile: { body: '#6e5640', top: '#8a6c50', edge: '#d1a77d' },
};

export const SCENE = {
  /** Grid cyan 7% / 14% dicampur ke warna lantai (Grid drei tidak punya opacity). */
  gridCell: '#1c394f',
  gridSection: '#1d4559',
  floorEdge: '#2f5b86',
  road: '#14223a',
  roadEdge: '#24395a',
  conveyorBelt: '#9db6d8',
  conveyorFrame: '#5c7396',
  zoneFill: COLOR.critical,
} as const;

/** Pulsa ring node per status (Hz) — makin kritis makin cepat (§7). */
export const PULSE_HZ: Record<Status, number> = { normal: 0.3, warning: 0.65, critical: 1.4 };

/**
 * Warna HDR (> 1) untuk objek yang boleh tertangkap Bloom (luminanceThreshold = 1).
 * Dibuat sekali di modul — jangan buat Color di dalam useFrame.
 */
export const hdr = (hex: string, k: number): Color => new Color(hex).multiplyScalar(k);

export const BLOOM = {
  beacon: 2.4,
  safeRoute: 2.2,
  truckLight: 3,
} as const;

export const DUST_COLOR = '#e6c9a8';
export const ORE_COLOR = '#8a7560';
export const TRUCK = { body: '#c9d6e8', cab: '#6fb6ff', load: '#7a5a3f' } as const;
