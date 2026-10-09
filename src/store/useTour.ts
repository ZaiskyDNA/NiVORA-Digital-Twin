/** State presentasi otomatis (auto-tour). Logika langkah ada di src/demo/tour.ts. */
import { create } from 'zustand';

interface TourStore {
  active: boolean;
  /** Indeks langkah aktif; = jumlah langkah bila tur selesai. */
  index: number;
  paused: boolean;
  /** performance.now() saat langkah aktif dimulai (dikoreksi saat jeda). */
  stepStartedAt: number;
  /** Waktu langkah yang sudah berjalan saat dijeda. */
  pausedElapsed: number;
  set: (patch: Partial<Omit<TourStore, 'set'>>) => void;
}

export const useTour = create<TourStore>()((set) => ({
  active: false,
  index: 0,
  paused: false,
  stepStartedAt: 0,
  pausedElapsed: 0,
  set: (patch) => set(patch),
}));
