/**
 * Toggle "Reaktif vs NiVORA" (§8): memilih engine yang ditampilkan scene & panel. Kedua engine
 * selalu berjalan bersamaan (§13.5), jadi KPI dapat dibandingkan berdampingan kapan saja.
 */
import type { KeyboardEvent } from 'react';
import { UI } from '../config/i18n';
import type { Policy } from '../sim/engine';
import { useSim } from '../store/useSim';

const OPTIONS: Policy[] = ['nivora', 'reactive'];

export function CompareToggle() {
  const view = useSim((s) => s.view);
  const setView = useSim((s) => s.setView);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = view === 'nivora' ? 'reactive' : 'nivora';
    setView(next);
    (e.currentTarget.querySelector(`[data-id="${next}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-label uppercase text-fg-3">{UI.compare.label}</span>
      <div
        role="radiogroup"
        aria-label={UI.compare.label}
        onKeyDown={onKeyDown}
        className="flex rounded-control border border-line-control"
      >
        {OPTIONS.map((p) => {
          const on = view === p;
          const tone =
            p === 'nivora' ? 'bg-safe/16 text-safe' : 'bg-critical/16 text-critical-fg';
          return (
            <button
              key={p}
              data-id={p}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => setView(p)}
              className={`h-8 px-3 text-caption first:rounded-l-control last:rounded-r-control ${
                on ? `${tone} font-semibold` : 'bg-surface-1 text-fg-2 hover:text-fg'
              }`}
            >
              {p === 'nivora' ? UI.compare.nivora : UI.compare.reactive}
            </button>
          );
        })}
      </div>
    </div>
  );
}
