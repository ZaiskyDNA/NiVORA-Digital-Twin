/**
 * Palet scene per tema. Semua warna berasal dari token (tokens.css → styles/tokens.ts); file ini
 * hanya menyusunnya per peran dan menyimpan parameter non-warna (intensitas cahaya, bloom, bayangan).
 */
import type { FacilityKind } from '../config/plant';
import { Color } from 'three';
import type { Status } from '../sim/types';
import { color, THEMES, type Theme } from '../styles/tokens';

export interface FacilityStyle {
  body: string; // warna sisi
  top: string; // warna muka atas (lebih terang)
  edge: string; // garis tepi
}

export interface ScenePalette {
  theme: Theme;
  status: Record<Status, string>;
  /** Warna teks label DOM di atas scene (≥4.5:1 pada surface). */
  statusText: Record<Status, string>;
  facility: Record<FacilityKind, FacilityStyle>;
  stack: FacilityStyle;
  pit: string;
  floor: string;
  gridCell: string;
  gridSection: string;
  floorEdge: string;
  road: string;
  conveyorBelt: string;
  conveyorFrame: string;
  canvas: string;
  safe: string;
  critical: string;
  criticalText: string;
  worker: string;
  dust: string;
  ore: string;
  truck: { body: string; cab: string; load: string };
  barricade: { post: string; light: string };
  beaconRing: string;
  outline: string;
  /** Dash penunjuk arah di atas safe route pada tema terang. */
  routeDash: string;
  light: {
    hemiSky: string;
    hemiGround: string;
    hemi: number;
    ambient: number;
    sun: string;
    sunIntensity: number;
  };
  shadow: { color: string; opacity: number; blur: number };
  /**
   * Bloom hanya di tema gelap: pengali HDR (> 1) membuat beacon, safe route, dan lampu truk
   * tertangkap Bloom. Tema terang: pengali 1 (warna pekat) + outline sebagai pengganti cahaya.
   */
  bloom: { enabled: boolean; beacon: number; safeRoute: number; truckLight: number };
  /** Debu: aditif di latar gelap; di latar terang harus menggelapkan (normal blending). */
  dustAdditive: boolean;
  /** Opacity isi zona pekerja (aktivitas tinggi / biasa). */
  zoneFill: [number, number];
}

const FACILITY_KINDS: FacilityKind[] = [
  'smelter',
  'crusher',
  'reprocessing',
  'recovery',
  'treatment',
  'disposal',
  'stockpile',
];

function build(theme: Theme): ScenePalette {
  const c = (key: string) => color(theme, key);
  const dark = theme === 'dark';
  const facility = Object.fromEntries(
    FACILITY_KINDS.map((k) => {
      const key = `scene${k[0]?.toUpperCase()}${k.slice(1)}`;
      return [k, { body: c(`${key}Body`), top: c(`${key}Top`), edge: c(`${key}Edge`) }];
    }),
  ) as Record<FacilityKind, FacilityStyle>;
  return {
    theme,
    status: { normal: c('normal'), warning: c('warning'), critical: c('critical') },
    statusText: { normal: c('normalFg'), warning: c('warningFg'), critical: c('criticalFg') },
    facility,
    stack: { body: c('sceneStackBody'), top: c('sceneStackTop'), edge: facility.smelter.edge },
    pit: c('scenePit'),
    floor: c('floor'),
    gridCell: c('sceneGridCell'),
    gridSection: c('sceneGridSection'),
    floorEdge: c('sceneFloorEdge'),
    road: c('sceneRoad'),
    conveyorBelt: c('sceneConveyorBelt'),
    conveyorFrame: c('sceneConveyorFrame'),
    canvas: c('canvas'),
    safe: c('safe'),
    critical: c('critical'),
    criticalText: c('criticalFg'),
    worker: c('worker'),
    dust: c('sceneDust'),
    ore: c('sceneOre'),
    truck: { body: c('sceneTruckBody'), cab: c('sceneTruckCab'), load: c('sceneTruckLoad') },
    barricade: { post: c('fg2'), light: dark ? c('fg') : c('surface0') },
    beaconRing: c('sceneBeaconRing'),
    outline: c('sceneOutline'),
    routeDash: c('surface0'),
    light: {
      hemiSky: c('sceneHemiSky'),
      hemiGround: c('sceneHemiGround'),
      hemi: dark ? 0.55 : 1.5,
      ambient: dark ? 0.25 : 1.0,
      sun: c('sceneSun'),
      sunIntensity: dark ? 1.5 : 2.0,
    },
    shadow: { color: c('sceneShadow'), opacity: dark ? 0.35 : 0.22, blur: dark ? 2.4 : 3.6 },
    bloom: dark
      ? { enabled: true, beacon: 2.4, safeRoute: 2.2, truckLight: 3 }
      : { enabled: false, beacon: 1, safeRoute: 1, truckLight: 1 },
    dustAdditive: dark,
    zoneFill: dark ? [0.16, 0.07] : [0.2, 0.1],
  };
}

/** Dibangun sekali per tema — referensi stabil, aman dipakai sebagai dependensi memo. */
export const SCENE_PALETTE = Object.fromEntries(THEMES.map((t) => [t, build(t)])) as Record<Theme, ScenePalette>;

/** Pulsa ring node per status (Hz) — makin kritis makin cepat (§7). */
export const PULSE_HZ: Record<Status, number> = { normal: 0.3, warning: 0.65, critical: 1.4 };

/** Warna dikali skalar (HDR bila > 1). Dibuat di memo — jangan buat Color di dalam useFrame. */
export const hdr = (hex: string, k: number): Color => new Color(hex).multiplyScalar(k);
