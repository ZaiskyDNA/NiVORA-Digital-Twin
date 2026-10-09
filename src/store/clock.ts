/**
 * Jam simulasi berbasis requestAnimationFrame (§13.4): 1× = 1 tick (1 menit simulasi) per detik nyata.
 * Saat tab tidak aktif rAF berhenti; selisih waktu dibatasi agar tidak terjadi lonjakan tick.
 */
import { useSim } from './useSim';

/** Batas tick per frame (20× pada 60 fps ≈ 0.33 tick/frame — batas ini hanya pengaman). */
const MAX_TICKS_PER_FRAME = 4;
const MAX_FRAME_MS = 250;

export function startSimClock(store = useSim): () => void {
  let raf = 0;
  let last = performance.now();
  let acc = 0;

  const frame = (t: number) => {
    const dt = Math.min(t - last, MAX_FRAME_MS);
    last = t;
    const st = store.getState();
    if (st.running) {
      acc += (dt * st.speed) / 1000;
      const n = Math.min(Math.floor(acc), MAX_TICKS_PER_FRAME);
      if (n > 0) {
        acc -= n;
        st.tick(n);
      }
      if (acc > MAX_TICKS_PER_FRAME) acc = 0;
    } else {
      acc = 0;
    }
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
