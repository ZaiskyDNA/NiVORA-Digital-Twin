/**
 * Digital Twin — prediksi time-to-critical (§5.3).
 * Regresi linear (least squares) atas N sampel terakhir; ttc = (ambang − nilai sekarang) / slope.
 */
import { DIGITAL_TWIN } from '../config/thresholds';
import type { HistorySample } from './types';

export interface Point {
  x: number;
  y: number;
}

export interface LinearFit {
  slope: number;
  intercept: number;
}

/** Least squares. Null bila < 2 titik atau semua x sama. */
export function linearRegression(points: readonly Point[]): LinearFit | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - mx;
    sxx += dx * dx;
    sxy += dx * (p.y - my);
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

/**
 * Menit hingga `key` mencapai `threshold`.
 * 0 bila sudah di/atas ambang; null bila tren tidak naik atau data kurang.
 */
export function timeToCritical(
  history: readonly HistorySample[],
  key: 'mweri' | 'level',
  threshold: number,
  window: number = DIGITAL_TWIN.regressionWindow,
): number | null {
  const recent = history.slice(-window);
  const last = recent.at(-1);
  if (!last) return null;
  if (last[key] >= threshold) return 0;
  const fit = linearRegression(recent.map((s) => ({ x: s.t, y: s[key] })));
  if (!fit || fit.slope <= 0) return null;
  return (threshold - last[key]) / fit.slope;
}

export interface Prediction {
  ttcMweri: number | null;
  ttcLevel: number | null;
  /** Yang lebih cepat dari keduanya. */
  ttc: number | null;
  /** Kemiringan level (%/menit) — input aturan tren Edge-AI. */
  levelSlope: number | null;
}

export function predict(history: readonly HistorySample[], cfg = DIGITAL_TWIN): Prediction {
  const ttcMweri = timeToCritical(history, 'mweri', cfg.mweriCritical, cfg.regressionWindow);
  const ttcLevel = timeToCritical(history, 'level', cfg.levelCritical, cfg.regressionWindow);
  const candidates = [ttcMweri, ttcLevel].filter((v): v is number => v !== null);
  const fit = linearRegression(history.slice(-cfg.regressionWindow).map((s) => ({ x: s.t, y: s.level })));
  return {
    ttcMweri,
    ttcLevel,
    ttc: candidates.length > 0 ? Math.min(...candidates) : null,
    levelSlope: fit ? fit.slope : null,
  };
}

/** Titik proyeksi garis putus-putus untuk grafik (dari sampel terakhir ke depan). */
export function project(
  history: readonly HistorySample[],
  key: 'mweri' | 'level',
  horizonMin: number,
  window: number = DIGITAL_TWIN.regressionWindow,
): Point[] {
  const recent = history.slice(-window);
  const last = recent.at(-1);
  const fit = linearRegression(recent.map((s) => ({ x: s.t, y: s[key] })));
  if (!last || !fit) return [];
  return [
    { x: last.t, y: last[key] },
    { x: last.t + horizonMin, y: last[key] + fit.slope * horizonMin },
  ];
}
