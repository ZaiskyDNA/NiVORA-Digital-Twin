/** Hook UI kecil: media query & selector store yang di-throttle. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSim, type SimStore } from '../store/useSim';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
  );
}

/**
 * Batas laju pembaruan teks panel & kartu. Pada 20× engine berdetak 20×/detik; angka yang berganti
 * secepat itu tidak terbaca dan re-render React-nya menurunkan fps scene (terukur 19 → 60 fps).
 */
export const UI_TEXT_MS = 200;
/** Grafik & KPI (§13.8). */
export const UI_CHART_MS = 500;

/** Di bawah 1280px panel samping boleh/biasanya dilipat (§13.7). */
export const NARROW_QUERY = '(max-width: 1279px)';

/**
 * Tata letak ponsel (§13.16): layar sempit (potret) atau pendek (lanskap ponsel). Desktop/tablet
 * memakai layout panel samping.
 */
export const MOBILE_QUERY = '(max-width: 767px), (max-height: 520px)';
export const useIsMobile = (): boolean => useMediaQuery(MOBILE_QUERY);

/**
 * Nilai turunan store yang diperbarui paling sering setiap `ms` (mis. grafik & KPI ±2 Hz, §13.8).
 * `select` harus stabil (fungsi modul atau useCallback).
 */
export function useThrottledSim<T>(select: (s: SimStore) => T, ms: number): T {
  const [value, setValue] = useState(() => select(useSim.getState()));
  useEffect(() => {
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      last = performance.now();
      timer = undefined;
      setValue(select(useSim.getState()));
    };
    const unsubscribe = useSim.subscribe(() => {
      const wait = ms - (performance.now() - last);
      if (wait <= 0) run();
      else timer ??= setTimeout(run, wait);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [select, ms]);
  return value;
}
