/**
 * TopBar (§3, referensi): identitas, chip Predict/Protect/Circulate (menyala saat pilar aktif),
 * indikator LIVE/JEDA + jam simulasi, tombol jalankan/jeda, dan kecepatan.
 */
import { UI } from '../config/i18n';
import { selectViewed, SPEEDS, useSim, type SimStore } from '../store/useSim';
import { CameraPresetBar } from './CameraPresetBar';
import { formatClock } from './format';
import { UI_TEXT_MS, useThrottledSim } from './hooks';

/** Pilar yang sedang bekerja: prediksi tersedia · prioritas tinggi · material sedang disirkulasi. */
const selectPillars = (s: SimStore) => {
  const v = selectViewed(s);
  const top = v.nodes.find((n) => n.id === v.ranking[0]);
  return {
    Predict: v.nodes.some((n) => n.ttc !== null),
    Protect: (top?.mweri ?? 0) >= 6 || v.recommendation?.urgency === 'now',
    Circulate: v.tasks.length > 0,
  };
};

const selectPillarsKey = (s: SimStore) => JSON.stringify(selectPillars(s));
const selectT = (s: SimStore) => selectViewed(s).t;

export function TopBar() {
  const pillars = JSON.parse(useThrottledSim(selectPillarsKey, UI_TEXT_MS)) as ReturnType<typeof selectPillars>;
  const running = useSim((s) => s.running);
  const speed = useSim((s) => s.speed);
  const t = useThrottledSim(selectT, UI_TEXT_MS);
  const { toggle, setSpeed } = useSim.getState();

  return (
    <header className="pointer-events-none flex flex-wrap items-center justify-between gap-4 px-gutter pt-5">
      <div className="pointer-events-auto flex items-center gap-4">
        <div
          aria-hidden
          className="grid size-12 place-items-center rounded-tile bg-linear-to-br from-safe to-normal text-xl font-extrabold text-on-status"
        >
          Ni
        </div>
        <div>
          <h1 className="text-display font-bold tracking-tight">
            {UI.app.title} <span className="font-medium text-accent">{UI.app.titleAccent}</span>
          </h1>
          <p className="text-caption text-fg-2">{UI.app.subtitle}</p>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <ul className="flex gap-2" aria-label="Paradigma NiVORA">
          {UI.pillars.map((p) => (
            <li
              key={p}
              className={`flex h-control items-center rounded-full border px-4 text-body font-semibold transition-colors duration-[var(--duration-base)] ${
                pillars[p] ? 'border-accent/60 bg-accent/12 text-accent' : 'border-line-control bg-surface-1 text-fg-2'
              }`}
            >
              {p}
            </li>
          ))}
        </ul>

        <span className="mx-1 h-6 w-px bg-line-strong" aria-hidden />
        <CameraPresetBar />
        <span className="mx-1 h-6 w-px bg-line-strong" aria-hidden />

        <div
          className={`flex h-control items-center gap-2 rounded-full border px-3 ${
            running ? 'border-normal/50 bg-normal/10 text-normal' : 'border-line-control bg-surface-1 text-fg-2'
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${running ? 'bg-normal motion-safe:animate-beacon' : 'bg-fg-3'}`}
          />
          <span className="text-label">{running ? UI.live.running : UI.live.paused}</span>
          <span className="font-mono text-body">· t = {formatClock(t)}</span>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={running ? UI.live.pause : UI.live.play}
          className="grid size-8 place-items-center rounded-control border border-line-control bg-surface-1 text-fg transition-colors duration-[var(--duration-fast)] hover:bg-surface-2"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
            {running ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
          </svg>
        </button>
        <div role="radiogroup" aria-label={UI.live.speed} className="flex rounded-control border border-line-control">
          {SPEEDS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={speed === v}
              onClick={() => setSpeed(v)}
              className={`h-8 px-2.5 font-mono text-caption first:rounded-l-control last:rounded-r-control ${
                speed === v ? 'bg-accent/16 font-semibold text-accent' : 'bg-surface-1 text-fg-2 hover:text-fg'
              }`}
            >
              {v}×
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
