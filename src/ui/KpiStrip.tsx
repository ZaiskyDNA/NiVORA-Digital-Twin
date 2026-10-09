/**
 * Strip KPI 3P ringkas — hanya tampil saat mode "Bandingkan reaktif" aktif (declutter). Memuat
 * pemilih engine yang ditampilkan scene dan tiga angka NiVORA vs reaktif. Diperbarui ±2 Hz.
 */
import { UI } from '../config/i18n';
import type { Policy } from '../sim/engine';
import { useSim, type SimStore } from '../store/useSim';
import { UI_CHART_MS, useThrottledSim } from './hooks';
import { kpiTiles, type KpiTileView } from './viewModels';

const selectTiles = (s: SimStore) => JSON.stringify(kpiTiles(s.nivora, s.reactive));
const TREND = { better: 'text-normal', worse: 'text-critical-fg', neutral: 'text-fg' } as const;
const LABEL: Record<KpiTileView['key'], string> = {
  people: UI.kpi.people,
  planet: UI.kpi.planet,
  productivity: UI.kpi.productivity,
};

export function KpiStrip() {
  const tiles = JSON.parse(useThrottledSim(selectTiles, UI_CHART_MS)) as KpiTileView[];
  const view = useSim((s) => s.view);
  const setView = useSim((s) => s.setView);

  return (
    <section
      aria-label={UI.kpi.title}
      className="pointer-events-auto flex flex-wrap items-center gap-x-6 gap-y-3 rounded-panel border border-line-strong bg-surface-0/95 px-panel py-3 shadow-panel"
    >
      <div className="flex items-center gap-2">
        <span className="text-label uppercase text-fg-3">{UI.kpi.scene}</span>
        <div role="radiogroup" aria-label={UI.kpi.scene} className="flex rounded-control border border-line-control">
          {(['nivora', 'reactive'] as Policy[]).map((p) => {
            const on = view === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setView(p)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setView(view === 'nivora' ? 'reactive' : 'nivora');
                }}
                className={`h-8 px-3 text-caption first:rounded-l-control last:rounded-r-control ${
                  on ? 'bg-surface-2 font-semibold text-fg' : 'bg-surface-1 text-fg-2 hover:text-fg'
                }`}
              >
                {p === 'nivora' ? UI.compare.nivora : UI.compare.reactive}
              </button>
            );
          })}
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {tiles.map((t) => (
          <div key={t.key} className="flex items-baseline gap-2">
            <dt className="text-caption text-fg-2">{LABEL[t.key]}</dt>
            <dd className={`font-mono text-heading font-semibold ${TREND[t.trend]}`}>
              {t.value}
              <span className="sr-only"> ({t.sr})</span>
            </dd>
            <dd className="font-mono text-caption text-fg-3">
              {t.nivora} {UI.compare.vs} {t.reactive}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
