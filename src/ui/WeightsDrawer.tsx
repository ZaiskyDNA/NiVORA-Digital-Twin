/**
 * Drawer bobot (Fase 6): slider MWERI (wH, wP, wW, wT) dan rute (α, β, γ). Menggeser satu slider
 * menyeimbangkan yang lain secara proporsional (Σ = 1, `rebalanceWeights`) dan langsung menghitung
 * ulang MWERI, ranking, dan rute di kedua engine. Non-modal: scene & panel tetap terlihat bereaksi.
 */
import { useEffect, useRef } from 'react';
import { DISCLAIMER, UI } from '../config/i18n';
import { DEFAULT_MWERI_WEIGHTS, DEFAULT_ROUTE_WEIGHTS } from '../config/weights';
import { rebalanceWeights } from '../sim/mweri';
import type { MweriWeights, RouteWeights } from '../sim/types';
import { selectViewed, useSim, type SimStore } from '../store/useSim';
import { useView } from '../store/useView';
import { UI_TEXT_MS, useIsMobile, useThrottledSim } from './hooks';
import { mweriFormula, rankingRows, routeFormula } from './viewModels';

type Key<T> = Extract<keyof T, string>;

function Slider<T extends { [K in keyof T]: number }>({
  group,
  k,
  weights,
  onChange,
}: {
  group: string;
  k: Key<T>;
  weights: T;
  onChange: (next: T) => void;
}) {
  const id = `${group}-${k}`;
  const value = weights[k] ?? 0;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <label htmlFor={id} className="text-caption text-fg-2">
        {UI.weights.labels[k as keyof typeof UI.weights.labels]}
      </label>
      <output htmlFor={id} className="font-mono text-caption font-semibold text-fg">
        {value.toFixed(2)}
      </output>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        aria-valuetext={value.toFixed(2)}
        onChange={(e) => onChange(rebalanceWeights(weights, k, Number(e.currentTarget.value)))}
        className="col-span-2 h-2 w-full cursor-pointer accent-[var(--color-accent)]"
      />
    </div>
  );
}

const selectWeights = (s: SimStore) => s.nivora.weights;
const selectPreview = (s: SimStore) => {
  const v = selectViewed(s);
  const ranking = rankingRows(v)
    .map((r) => `${r.id} ${r.mweri.toFixed(1)}`)
    .join(' · ');
  const rec = v.recommendation;
  const route = rec?.route
    ? `${rec.selectedCandidate ? `Rute ${rec.selectedCandidate}` : rec.route.vertices.join('→')} · C=${rec.route.cost.toFixed(1)}`
    : '—';
  return `${ranking}|${route}|${mweriFormula(v)}|${routeFormula(v)}`;
};

export function WeightsDrawer() {
  const open = useView((s) => s.weightsOpen);
  const setOpen = useView((s) => s.setWeightsOpen);
  const weights = useSim(selectWeights);
  // Pratinjau ≤ 5 Hz seperti panel lain; tanpa throttle drawer menurunkan fps di 20× (terukur 49).
  const [ranking, route, mf, rf] = useThrottledSim(selectPreview, UI_TEXT_MS).split('|');
  const setWeights = useSim((s) => s.setWeights);
  const first = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    first.current?.querySelector('input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;
  const sum = (w: MweriWeights | RouteWeights): number => (Object.values(w) as number[]).reduce((a, b) => a + b, 0);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="weights-title"
      className={`pointer-events-auto absolute z-[var(--z-drawer)] flex flex-col overflow-y-auto overscroll-contain rounded-panel border border-line-strong bg-surface-0 p-panel shadow-panel ${
        // Ponsel: lembar bawah selebar layar.
        mobile ? 'inset-x-2 top-24 bottom-2' : 'top-32 right-gutter bottom-24 w-[23rem]'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <h2 id="weights-title" className="text-title uppercase text-accent">
          {UI.weights.title}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={UI.weights.close}
          className="-mt-1 -mr-1 grid size-8 place-items-center rounded-control text-fg-2 hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 3 6 6M9 3 3 9" />
          </svg>
        </button>
      </header>
      <p className="mt-1 text-caption text-fg-3">{UI.weights.hint}</p>

      <div ref={first}>
        <fieldset className="mt-4 space-y-3">
          <legend className="flex w-full items-baseline justify-between text-label uppercase text-fg-2">
            {UI.weights.mweri}
            <span className="font-mono tracking-normal text-fg-3">
              {UI.weights.sum} = {sum(weights.mweri).toFixed(2)}
            </span>
          </legend>
          {(['wH', 'wP', 'wW', 'wT'] as const).map((k) => (
            <Slider<MweriWeights>
              key={k}
              group="mweri"
              k={k}
              weights={weights.mweri}
              onChange={(mweri) => setWeights({ mweri })}
            />
          ))}
        </fieldset>
      </div>

      <fieldset className="mt-5 space-y-3">
        <legend className="flex w-full items-baseline justify-between text-label uppercase text-fg-2">
          {UI.weights.route}
          <span className="font-mono tracking-normal text-fg-3">
            {UI.weights.sum} = {sum(weights.route).toFixed(2)}
          </span>
        </legend>
        {(['alpha', 'beta', 'gamma'] as const).map((k) => (
          <Slider<RouteWeights>
            key={k}
            group="route"
            k={k}
            weights={weights.route}
            onChange={(route) => setWeights({ route })}
          />
        ))}
      </fieldset>

      <section className="mt-5 rounded-tile bg-surface-1 p-tile" aria-live="polite">
        <h3 className="text-label uppercase text-fg-2">{UI.weights.preview}</h3>
        <dl className="mt-1.5 space-y-1 text-caption">
          <div className="flex justify-between gap-3">
            <dt className="text-fg-3">{UI.weights.ranking}</dt>
            <dd className="font-mono text-fg">{ranking}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-fg-3">{UI.weights.route_}</dt>
            <dd className="font-mono text-safe">{route}</dd>
          </div>
        </dl>
        <p className="mt-2 font-mono text-caption text-fg-3">{mf}</p>
        <p className="font-mono text-caption text-fg-3">{rf}</p>
      </section>

      <button
        type="button"
        onClick={() => setWeights({ mweri: DEFAULT_MWERI_WEIGHTS, route: DEFAULT_ROUTE_WEIGHTS })}
        className="mt-4 h-control rounded-control border border-line-control bg-surface-1 text-body text-fg-2 hover:bg-surface-2 hover:text-fg"
      >
        {UI.weights.reset}
      </button>
      <p className="mt-3 text-caption text-fg-3">{DISCLAIMER.mweri}</p>
    </aside>
  );
}
