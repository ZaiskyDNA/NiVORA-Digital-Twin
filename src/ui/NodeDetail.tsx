/**
 * Bagian detail kartu node terpilih: komposisi MWERI per suku (w × skor) — membuat pesan Node C
 * terbaca langsung (suku W = 0) — plus paparan, tren residu, dan jalur material.
 */
import { useCallback } from 'react';
import { UI } from '../config/i18n';
import { selectViewed, type SimStore } from '../store/useSim';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { nodeDetailView, type NodeDetailView } from './viewModels';

export function NodeDetail({ nodeId }: { nodeId: string }) {
  const select = useCallback((s: SimStore) => JSON.stringify(nodeDetailView(selectViewed(s), nodeId)), [nodeId]);
  const d = JSON.parse(useThrottledSim(select, UI_TEXT_MS)) as NodeDetailView | null;
  if (!d) return null;
  const zeroW = d.terms.find((t) => t.key === 'W')?.score === 0;

  return (
    <section className="mt-2 border-t border-line pt-2">
      <h4 className="text-label uppercase text-fg-3">{UI.card.composition}</h4>
      <dl className="mt-1.5 space-y-1.5">
        {d.terms.map((t) => (
          <div key={t.key} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-caption">
            <dt className="truncate text-fg-2">
              <span className="font-mono font-semibold text-fg">{t.key}</span> {UI.card.term[t.key]}
            </dt>
            <dd className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <span
                className={`block h-full rounded-full ${t.contribution === 0 ? '' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, t.contribution * 25)}%` }}
              />
            </dd>
            <dd className="font-mono text-fg-2">
              {t.weight.toFixed(1)}×{t.score.toFixed(0)} = <span className="text-fg">{t.contribution.toFixed(1)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {zeroW && (
        <p className="mt-2 rounded-control border-l-2 border-warning bg-warning/10 px-2 py-1.5 text-caption text-fg">
          {UI.card.zeroWorkers}
        </p>
      )}
      <ul className="mt-2 space-y-0.5 text-caption text-fg-2">
        <li>{UI.card.exposure(d.exposureMin, d.exposureWindowMin)}</li>
        {d.levelSlope !== null && <li>{UI.card.slope(d.levelSlope)}</li>}
        <li>{UI.card.pathway(d.stage, d.destination)}</li>
      </ul>
    </section>
  );
}
