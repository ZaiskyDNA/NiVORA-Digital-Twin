/**
 * TopBar ponsel (§13.16): dua baris ringkas. Baris 1 = identitas · tur presentasi · menu;
 * baris 2 = jalankan/jam + skenario selebar layar. Kecepatan, kamera, bobot, dan perbandingan
 * reaktif dipindah ke menu agar layar tidak menumpuk.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { UI } from '../config/i18n';
import { startTour, stopTour } from '../demo/tour';
import { selectViewed, SPEEDS, useSim, type SimStore } from '../store/useSim';
import { useTour } from '../store/useTour';
import { useView } from '../store/useView';
import { CameraPresetBar } from './CameraPresetBar';
import { formatClock } from './format';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { ScenarioSwitch } from './ScenarioSwitch';
import { ThemeToggle } from './ThemeToggle';

const selectT = (s: SimStore) => selectViewed(s).t;
const iconBtn =
  'grid size-10 shrink-0 place-items-center rounded-control border border-line-control bg-surface-1 text-fg-2 active:bg-surface-2';

function Menu({ onClose, id }: { onClose: () => void; id: string }) {
  const speed = useSim((s) => s.speed);
  const setSpeed = useSim((s) => s.setSpeed);
  const setWeightsOpen = useView((s) => s.setWeightsOpen);
  return (
    <div
      id={id}
      className="pointer-events-auto absolute top-full right-3 z-[var(--z-drawer)] mt-2 w-64 space-y-4 rounded-panel border border-line-strong bg-surface-0 p-tile shadow-panel"
    >
      <div>
        <p className="text-label uppercase text-fg-2">{UI.mobile.speed}</p>
        <div role="radiogroup" aria-label={UI.live.speed} className="mt-1.5 grid grid-cols-3 rounded-control border border-line-control">
          {SPEEDS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={speed === v}
              onClick={() => setSpeed(v)}
              className={`h-10 font-mono text-body first:rounded-l-control last:rounded-r-control ${
                speed === v ? 'bg-surface-2 font-semibold text-fg' : 'bg-surface-1 text-fg-2'
              }`}
            >
              {v}×
            </button>
          ))}
        </div>
      </div>
      <div onClick={(e) => (e.target as HTMLElement).closest('[role="radio"]') && onClose()}>
        <p className="text-label uppercase text-fg-2">{UI.top.camera}</p>
        <div className="mt-1.5">
          <CameraPresetBar />
        </div>
      </div>
      <ThemeToggle wide />
      <button
        type="button"
        onClick={() => {
          onClose();
          setWeightsOpen(true);
        }}
        className="h-10 w-full rounded-control border border-line-control bg-surface-1 text-body text-fg"
      >
        {UI.top.weights}
      </button>
    </div>
  );
}

export function MobileTopBar() {
  const running = useSim((s) => s.running);
  const toggle = useSim((s) => s.toggle);
  const t = useThrottledSim(selectT, UI_TEXT_MS);
  const touring = useTour((s) => s.active);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <header
      ref={root}
      // Gradasi latar: pill node & bangunan memudar di belakang TopBar, tidak menembus teks.
      className="pointer-events-none relative flex flex-col gap-2 bg-linear-to-b from-canvas via-canvas/90 to-transparent px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 landscape:flex-row landscape:items-center landscape:pb-6"
    >
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 landscape:order-1 landscape:flex-1">
        <div
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-tile bg-linear-to-br from-safe to-normal text-body font-extrabold text-on-status"
        >
          Ni
        </div>
        <h1 className="min-w-0 flex-1 truncate text-heading font-bold tracking-tight">
          {UI.app.title} <span className="font-medium text-accent">{UI.app.titleAccent}</span>
        </h1>
        <button
          type="button"
          aria-pressed={touring}
          onClick={() => (touring ? stopTour() : startTour())}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-control border px-3 text-caption font-semibold ${
            touring ? 'border-fg-3 bg-surface-2 text-fg' : 'border-line-control bg-surface-1 text-fg'
          }`}
        >
          {touring ? (
            UI.mobile.exitTour
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden fill="currentColor">
                <path d="M5 3v10l8-5z" />
              </svg>
              {UI.mobile.tour}
            </>
          )}
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? UI.mobile.closeMenu : UI.mobile.menu}
          onClick={() => setOpen(!open)}
          className={iconBtn}
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="m4 4 8 8M12 4l-8 8" /> : <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />}
          </svg>
        </button>
      </div>

      <div className="pointer-events-auto flex items-center gap-2 landscape:order-2 landscape:w-[24rem] landscape:shrink-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={running ? UI.live.pause : UI.live.play}
          className="flex h-10 shrink-0 items-center gap-2 rounded-control border border-line-control bg-surface-1 px-2.5"
        >
          <svg viewBox="0 0 16 16" className={`size-4 ${running ? 'text-normal-fg' : 'text-fg-2'}`} aria-hidden fill="currentColor">
            {running ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
          </svg>
          <span className="font-mono text-caption text-fg">{formatClock(t)}</span>
        </button>
        <div className="min-w-0 flex-1 [&>[role=radiogroup]]:w-full [&_button]:h-10 [&_button]:flex-1 [&_button]:justify-center [&_button]:px-1">
          <ScenarioSwitch />
        </div>
      </div>

      {open && <Menu id={menuId} onClose={() => setOpen(false)} />}
    </header>
  );
}
