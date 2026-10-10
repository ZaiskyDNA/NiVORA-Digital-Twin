/**
 * Naskah presentasi otomatis 60 detik (§10 Fase 7):
 * Overview → Normal → Production Surge → Node A critical (fokus + prediksi) → pathway & safe route
 * → Route Disruption → ringkasan KPI Reaktif vs NiVORA.
 * Setiap langkah hanya memanggil aksi store; simulasi tetap di src/sim/ (§12). Seed tetap → demo
 * dapat direproduksi.
 */
import { UI } from '../config/i18n';
import { DEFAULT_MWERI_WEIGHTS, DEFAULT_ROUTE_WEIGHTS } from '../config/weights';
import { DEFAULT_SEED } from '../sim/engine';
import { useSim } from '../store/useSim';
import { useTour } from '../store/useTour';
import { useView } from '../store/useView';
import { kpiTiles, whatIf } from '../ui/viewModels';

export interface TourStep {
  id: 'overview' | 'normal' | 'surge' | 'nodeA' | 'route' | 'disruption' | 'kpi';
  title: string;
  durationMs: number;
  caption: () => string;
  /** Aksi saat langkah dimulai; boleh async (mis. mempercepat simulasi bertahap). */
  enter: () => void | Promise<void>;
}

const sim = () => useSim.getState();
const view = () => useView.getState();
const T = UI.tour.steps;

/** Majukan kedua engine sampai `done()` atau `max` tick, bertahap agar UI tidak membeku. */
export async function fastForward(done: () => boolean, max: number, chunk = 20): Promise<void> {
  let left = max;
  while (left > 0 && !done()) {
    const n = Math.min(chunk, left);
    for (let i = 0; i < n && !done(); i++) sim().tick(1);
    left -= n;
    if (typeof requestAnimationFrame !== 'undefined') await new Promise((r) => requestAnimationFrame(() => r(null)));
  }
}

const nodeA = () => sim().nivora.nodes.find((n) => n.id === 'A');

export const TOUR: readonly TourStep[] = [
  {
    id: 'overview',
    title: T.overview.title,
    durationMs: 6000,
    caption: () => T.overview.text,
    enter: () => {
      // reset() mempertahankan skenario & bobot aktif — kembalikan dulu agar demo selalu identik.
      sim().setScenario('normal');
      sim().setWeights({ mweri: DEFAULT_MWERI_WEIGHTS, route: DEFAULT_ROUTE_WEIGHTS });
      sim().reset(DEFAULT_SEED);
      sim().setView('nivora');
      view().setCompareMode(false);
      view().setWhatIf(null);
      view().setFocusMode(true);
      view().setPreset('overview');
    },
  },
  {
    id: 'normal',
    title: T.normal.title,
    durationMs: 8000,
    caption: () => T.normal.text,
    enter: () => {
      sim().setSpeed(5);
      sim().play();
    },
  },
  {
    id: 'surge',
    title: T.surge.title,
    durationMs: 10000,
    caption: () => T.surge.text,
    enter: () => {
      sim().setScenario('surge');
      sim().setSpeed(5);
      sim().play();
    },
  },
  {
    id: 'nodeA',
    title: T.nodeA.title,
    durationMs: 10000,
    caption: () => {
      const ttc = nodeA()?.ttc ?? null;
      return T.nodeA.text(ttc === null || ttc <= 0 ? T.nodeA.ttcNow : T.nodeA.ttcIn(Math.round(ttc)));
    },
    enter: async () => {
      sim().setSpeed(1);
      // Momen yang diceritakan: A critical DAN rekomendasinya "tangani sekarang" (bukan baru saja
      // diangkut). Deterministik dengan seed tetap.
      const due = () => {
        const rec = sim().nivora.recommendation;
        return nodeA()?.status === 'critical' && rec?.nodeId === 'A' && rec.urgency === 'now';
      };
      await fastForward(due, 180);
      view().setFocusMode(false); // panel MWERI + grafik prediksi ikut tampil
      view().selectNode('A');
      view().setWhatIf(whatIf(sim().nivora, 30));
    },
  },
  {
    id: 'route',
    title: T.route.title,
    durationMs: 9000,
    caption: () => T.route.text,
    enter: () => {
      view().setWhatIf(null);
      view().setFocusMode(true);
      view().setPreset('route');
      sim().setSpeed(5);
      sim().play();
    },
  },
  {
    id: 'disruption',
    title: T.disruption.title,
    durationMs: 9000,
    caption: () => T.disruption.text,
    enter: () => {
      sim().setScenario('disruption');
      view().setPreset('route');
    },
  },
  {
    id: 'kpi',
    title: T.kpi.title,
    durationMs: 8000,
    caption: () => {
      const [people, planet, productivity] = kpiTiles(sim().nivora, sim().reactive);
      return T.kpi.text(people?.value ?? '—', planet?.value ?? '—', productivity?.value ?? '—');
    },
    enter: async () => {
      // Ringkasan bermakna butuh satu sesi panjang: majukan ±4 jam simulasi di kedua engine.
      await fastForward(() => false, 240, 30);
      sim().setSpeed(5);
      view().setPreset('overview');
      view().setFocusMode(false);
      view().setCompareMode(true);
    },
  },
];

export const TOUR_TOTAL_MS = TOUR.reduce((a, s) => a + s.durationMs, 0);

// ── Runner ──────────────────────────────────────────────────────────────

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function enterStep(index: number): void {
  useTour.getState().set({ index, stepStartedAt: now(), pausedElapsed: 0 });
  const step = TOUR[index];
  if (step) void step.enter();
}

export function startTour(): void {
  useTour.getState().set({ active: true, paused: false });
  enterStep(0);
}

export function nextStep(): void {
  const { index } = useTour.getState();
  if (index + 1 < TOUR.length) enterStep(index + 1);
  else finishTour();
}

/** Tur selesai: tetap di langkah ringkasan, simulasi dijeda. */
export function finishTour(): void {
  sim().pause();
  useTour.getState().set({ index: TOUR.length, paused: false });
}

export function pauseTour(): void {
  const t = useTour.getState();
  if (!t.active || t.paused) return;
  sim().pause();
  t.set({ paused: true, pausedElapsed: now() - t.stepStartedAt });
}

export function resumeTour(): void {
  const t = useTour.getState();
  if (!t.active || !t.paused) return;
  sim().play();
  t.set({ paused: false, stepStartedAt: now() - t.pausedElapsed });
}

export function stopTour(): void {
  useTour.getState().set({ active: false, paused: false, index: 0 });
  view().setFocusMode(false);
}

/** Dipanggil tiap frame selama tur aktif: pindah langkah saat durasinya habis. */
export function tourTick(): void {
  const t = useTour.getState();
  if (!t.active || t.paused || t.index >= TOUR.length) return;
  const step = TOUR[t.index];
  if (step && now() - t.stepStartedAt >= step.durationMs) nextStep();
}

/** Progres keseluruhan 0–1. */
export function tourProgress(): number {
  const t = useTour.getState();
  if (t.index >= TOUR.length) return 1;
  const done = TOUR.slice(0, t.index).reduce((a, s) => a + s.durationMs, 0);
  const step = TOUR[t.index];
  const inStep = t.paused ? t.pausedElapsed : now() - t.stepStartedAt;
  return Math.min(1, (done + Math.min(inStep, step?.durationMs ?? 0)) / TOUR_TOTAL_MS);
}
