/** Ringkasan simulasi what-if (fork 30 menit): MWERI & residu sebelum → sesudah, truk, rekomendasi. */
import { UI } from '../config/i18n';
import { useView } from '../store/useView';
import { formatClock } from './format';
import { StatusShape } from './StatusBadge';
import { STATUS_TONE } from './tone';
import type { WhatIfResult as Result } from './viewModels';

export function WhatIfResult({ result }: { result: Result }) {
  const setWhatIf = useView((s) => s.setWhatIf);
  return (
    <section
      aria-label={UI.whatIf.title(formatClock(result.fromT), formatClock(result.fromT + result.minutes))}
      className="mt-3 rounded-tile border border-line-strong bg-surface-1 p-tile"
    >
      <header className="flex items-center justify-between gap-2">
        <h4 className="font-mono text-caption font-semibold text-fg">
          {UI.whatIf.title(formatClock(result.fromT), formatClock(result.fromT + result.minutes))}
        </h4>
        <button
          type="button"
          onClick={() => setWhatIf(null)}
          aria-label={UI.whatIf.close}
          className="grid size-6 place-items-center rounded-control text-fg-2 hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 3 6 6M9 3 3 9" />
          </svg>
        </button>
      </header>
      <p className="sr-only">{UI.whatIf.note}</p>
      <ul className="mt-1.5 divide-y divide-line/60 text-caption">
        {result.nodes.map((n) => (
          <li key={n.id} className="py-1.5">
            <p className="flex items-center justify-between gap-2">
              <span className="font-semibold text-fg">Node {n.id}</span>
              {n.becameCritical && (
                <span className={`inline-flex items-center gap-1 ${STATUS_TONE.critical.text}`}>
                  <StatusShape status="critical" />
                  {UI.whatIf.critical}
                </span>
              )}
            </p>
            <p className="font-mono text-fg-2">
              MWERI {n.mweriBefore} → <span className="text-fg">{n.mweriAfter}</span> · residu {n.residueBefore}% →{' '}
              <span className="text-fg">{n.residueAfter}%</span>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-caption text-fg-2">
        {UI.whatIf.dispatches(result.dispatches)}
        {result.reroutes > 0 && ` · ${UI.whatIf.reroutes(result.reroutes)}`} · {UI.whatIf.note}
      </p>
      <p className="mt-1.5 text-caption text-fg">
        <span className="text-fg-3">{UI.whatIf.after}: </span>
        {result.recommendationAfter.map((p, i) =>
          p.strong ? (
            <strong key={i} className="font-semibold">
              {p.text}
            </strong>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
    </section>
  );
}
