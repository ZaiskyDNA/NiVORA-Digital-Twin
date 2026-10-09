/**
 * Keterangan presentasi otomatis: judul langkah, kalimat penjelas, progres 60 detik, dan kontrol
 * jeda/lewati/keluar. Progres digerakkan lewat ref per frame (tanpa re-render React).
 */
import { useCallback, useEffect, useRef } from 'react';
import { UI } from '../config/i18n';
import { nextStep, pauseTour, resumeTour, startTour, stopTour, TOUR, tourProgress, tourTick } from '../demo/tour';
import { useTour } from '../store/useTour';
import { UI_CHART_MS, useThrottledSim } from './hooks';

const ctrl =
  'grid size-8 place-items-center rounded-control text-fg-2 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2 hover:text-fg';

export function TourOverlay() {
  const active = useTour((s) => s.active);
  const index = useTour((s) => s.index);
  const paused = useTour((s) => s.paused);
  const bar = useRef<HTMLDivElement>(null);
  const done = index >= TOUR.length;
  const step = TOUR[Math.min(index, TOUR.length - 1)];
  // Keterangan bisa memuat angka live (ttc, KPI) — diperbarui ±2 Hz.
  const select = useCallback(() => step?.caption() ?? '', [step]);
  const caption = useThrottledSim(select, UI_CHART_MS);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      tourTick();
      if (bar.current) bar.current.style.transform = `scaleX(${tourProgress()})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active || !step) return null;

  return (
    <section
      aria-label={UI.tour.label}
      className="pointer-events-auto mx-auto w-full max-w-2xl overflow-hidden rounded-panel border border-line-strong bg-surface-0/95 shadow-panel"
    >
      <div className="flex items-start gap-4 p-panel">
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-caption text-fg-3">
              {UI.tour.step(Math.min(index + 1, TOUR.length), TOUR.length)}
            </span>
            <span className="text-heading font-semibold text-fg">{step.title}</span>
          </p>
          <p className="mt-1 text-body text-fg-2">{done ? `${caption} ${UI.tour.done}` : caption}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {done ? (
            <button type="button" onClick={startTour} className="h-8 rounded-control border border-line-control bg-surface-1 px-3 text-caption text-fg hover:bg-surface-2">
              {UI.tour.restart}
            </button>
          ) : (
            <>
              <button type="button" aria-label={paused ? UI.tour.resume : UI.tour.pause} onClick={paused ? resumeTour : pauseTour} className={ctrl}>
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
                  {paused ? <path d="M5 3v10l8-5z" /> : <path d="M4 3h3v10H4zM9 3h3v10H9z" />}
                </svg>
              </button>
              <button type="button" aria-label={UI.tour.next} onClick={nextStep} className={ctrl}>
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
                  <path d="M3 3v10l7-5zM11 3h2v10h-2z" />
                </svg>
              </button>
            </>
          )}
          <button type="button" aria-label={UI.tour.exit} onClick={stopTour} className={ctrl}>
            <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3 3 6 6M9 3 3 9" />
            </svg>
          </button>
        </div>
      </div>
      {/* Progres 60 detik — origin kiri, scaleX ditulis per frame. */}
      <div className="h-1 bg-surface-2" aria-hidden>
        <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
      </div>
    </section>
  );
}
