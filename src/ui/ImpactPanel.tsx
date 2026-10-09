/** KPI 3P (People / Planet / Productivity) NiVORA vs baseline reaktif — diperbarui ±2 Hz (§9). */
import { UI } from '../config/i18n';
import type { SimStore } from '../store/useSim';
import { UI_CHART_MS, useThrottledSim } from './hooks';
import { Panel } from './Panel';
import { kpiTiles, type KpiTileView } from './viewModels';

const selectTiles = (s: SimStore) => JSON.stringify(kpiTiles(s.nivora, s.reactive));

const TITLE: Record<KpiTileView['key'], string> = {
  people: UI.impact.people,
  planet: UI.impact.planet,
  productivity: UI.impact.productivity,
};
const CAPTION: Record<KpiTileView['key'], string> = {
  people: UI.impact.exposure,
  planet: UI.impact.recovery,
  productivity: UI.impact.unnecessary,
};
const TREND_TEXT = { better: 'text-normal', worse: 'text-critical-fg', neutral: 'text-fg' } as const;

function KpiTile({ tile }: { tile: KpiTileView }) {
  const empty = tile.value === '—';
  return (
    <div className="min-w-0 rounded-tile bg-surface-1 px-2.5 py-tile shadow-raised">
      <p className="truncate text-label uppercase tracking-normal text-fg-2">{TITLE[tile.key]}</p>
      <p className={`mt-1 flex items-center gap-1 font-mono text-metric font-semibold ${TREND_TEXT[tile.trend]}`}>
        {tile.direction === 'down' && (
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="currentColor">
            <path d="M6 11 1 4h10z" />
          </svg>
        )}
        {tile.direction === 'up' && (
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="currentColor">
            <path d="M6 1 11 8H1z" />
          </svg>
        )}
        {tile.value}
        <span className="sr-only">{tile.sr}</span>
      </p>
      <p className="text-caption text-fg-3">{empty ? UI.impact.waiting : CAPTION[tile.key]}</p>
      {/* Nilai kedua mode berdampingan (design-system §4.4, mode Compare). */}
      <dl className="mt-2 space-y-0.5 border-t border-line pt-1.5 font-mono text-caption">
        <div className="flex justify-between gap-1">
          <dt className="text-safe">{UI.compare.nivora}</dt>
          <dd className="text-fg">{tile.nivora}</dd>
        </div>
        <div className="flex justify-between gap-1">
          <dt className="text-critical-fg">{UI.compare.reactive.slice(0, 4)}.</dt>
          <dd className="text-fg-2">{tile.reactive}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ImpactPanel() {
  const tiles = JSON.parse(useThrottledSim(selectTiles, UI_CHART_MS)) as KpiTileView[];
  return (
    <Panel title={UI.impact.title} className="w-panel-w">
      {/* Kolom ketiga sedikit lebih lebar: "PRODUCTIVITY" adalah label terpanjang. */}
      <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
        {tiles.map((t) => (
          <KpiTile key={t.key} tile={t} />
        ))}
      </div>
    </Panel>
  );
}
