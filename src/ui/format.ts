/** Format angka & waktu untuk UI. */

export const fmt = (v: number | null | undefined, digits = 1): string =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(digits);

/** Menit simulasi → "jj:mm" sejak awal sesi. */
export function formatClock(t: number): string {
  const sign = t < 0 ? '−' : '';
  const m = Math.abs(Math.trunc(t));
  return `${sign}${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Persen perubahan bertanda, minus tipografis (design-system §4.4). */
export function formatDelta(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return '—';
  const r = Math.round(pct);
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r)}%`;
}
