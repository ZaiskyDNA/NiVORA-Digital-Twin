/**
 * TopBar satu baris (declutter): identitas · skenario · jalankan/jam/kecepatan · bandingkan reaktif ·
 * kamera · bobot · fokus (H) · presentasi. Pilar Predict/Protect/Circulate jadi teks kecil non-interaktif.
 */
import { useEffect, useRef } from 'react';
import { UI } from '../config/i18n';
import { selectViewed, SPEEDS, useSim, type SimStore } from '../store/useSim';
import { useView } from '../store/useView';
import { CameraMenu } from './CameraMenu';
import { formatClock } from './format';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { ScenarioSwitch } from './ScenarioSwitch';

const selectT = (s: SimStore) => selectViewed(s).t;
const btn =
  'flex h-8 items-center gap-1.5 rounded-control border px-3 text-caption transition-colors duration-[var(--duration-fast)]';
const idle = 'border-line-control bg-surface-1 text-fg-2 hover:bg-surface-2 hover:text-fg';
const on = 'border-fg-3 bg-surface-2 font-semibold text-fg';

export function TopBar() {
  const running = useSim((s) => s.running);
  const speed = useSim((s) => s.speed);
  const t = useThrottledSim(selectT, UI_TEXT_MS);
  const { toggle, setSpeed, setView } = useSim.getState();
  const compare = useView((s) => s.compareMode);
  const focus = useView((s) => s.focusMode);
  const weightsOpen = useView((s) => s.weightsOpen);
  const { setCompareMode, setFocusMode, setWeightsOpen } = useView.getState();
  const weightsButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const presenting = useRef(false);

  // Kembalikan fokus ke tombol pemicu saat drawer bobot ditutup.
  useEffect(() => {
    if (wasOpen.current && !weightsOpen) weightsButton.current?.focus();
    wasOpen.current = weightsOpen;
  }, [weightsOpen]);

  // Keluar layar penuh (Esc bawaan browser) → keluar juga dari mode fokus presentasi.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && presenting.current) {
        presenting.current = false;
        setFocusMode(false);
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [setFocusMode]);

  const togglePresent = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    presenting.current = true;
    setFocusMode(true);
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <header className="pointer-events-none flex items-center justify-between gap-4 px-gutter pt-4">
      <div className="pointer-events-auto flex shrink-0 items-center gap-3">
        <div
          aria-hidden
          className="grid size-10 place-items-center rounded-tile bg-linear-to-br from-safe to-normal text-heading font-extrabold text-on-status"
        >
          Ni
        </div>
        <div>
          <h1 className="text-heading font-bold tracking-tight">
            {UI.app.title} <span className="font-medium text-accent">{UI.app.titleAccent}</span>
          </h1>
          <p className="text-caption text-fg-3">{UI.pillars.join(' · ')}</p>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <ScenarioSwitch />
        <span className="mx-1 h-6 w-px bg-line-strong" aria-hidden />

        <button type="button" onClick={toggle} aria-label={running ? UI.live.pause : UI.live.play} className={`${btn} ${idle} px-2`}>
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
            {running ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
          </svg>
        </button>
        <span className={`flex h-8 items-center gap-2 px-1 text-caption ${running ? 'text-normal' : 'text-fg-2'}`}>
          <span aria-hidden className={`size-2 rounded-full ${running ? 'bg-normal' : 'bg-fg-3'}`} />
          <span className="text-label">{running ? UI.live.running : UI.live.paused}</span>
          <span className="font-mono text-fg">{formatClock(t)}</span>
        </span>
        <div role="radiogroup" aria-label={UI.live.speed} className="flex rounded-control border border-line-control">
          {SPEEDS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={speed === v}
              onClick={() => setSpeed(v)}
              className={`h-8 px-2.5 font-mono text-caption first:rounded-l-control last:rounded-r-control ${
                speed === v ? 'bg-surface-2 font-semibold text-fg' : 'bg-surface-1 text-fg-2 hover:text-fg'
              }`}
            >
              {v}×
            </button>
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-line-strong" aria-hidden />

        <button
          type="button"
          aria-pressed={compare}
          onClick={() => {
            setCompareMode(!compare);
            if (compare) setView('nivora');
          }}
          className={`${btn} ${compare ? on : idle}`}
        >
          {UI.top.compare}
        </button>
        <CameraMenu />
        <button
          ref={weightsButton}
          type="button"
          aria-label={UI.top.weights}
          title={UI.top.weights}
          aria-expanded={weightsOpen}
          onClick={() => setWeightsOpen(!weightsOpen)}
          className={`${btn} ${weightsOpen ? on : idle} px-2`}
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 4h7m3 0h2M2 8h2m3 0h7M2 12h9m3 0h0" />
            <circle cx="10.5" cy="4" r="1.5" />
            <circle cx="5.5" cy="8" r="1.5" />
            <circle cx="12.5" cy="12" r="1.5" />
          </svg>
        </button>
        <button
          type="button"
          aria-pressed={focus}
          aria-keyshortcuts="H"
          title={focus ? UI.top.focusHint : undefined}
          onClick={() => setFocusMode(!focus)}
          className={`${btn} ${focus ? on : idle}`}
        >
          {UI.top.focus}
          <kbd className="rounded-badge border border-line-strong px-1 font-mono text-label text-fg-3">H</kbd>
        </button>
        <button type="button" onClick={togglePresent} className={`${btn} ${idle}`}>
          {UI.top.present}
        </button>
      </div>
    </header>
  );
}
