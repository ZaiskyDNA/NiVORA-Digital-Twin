/**
 * Panel kiri: ranking prioritas MWERI (live) + grafik prediksi Digital Twin node #1 (±2 Hz)
 * + disclaimer MWERI (wajib, §5.1).
 */
import { useMemo, useState } from 'react';
import { DISCLAIMER, UI } from '../config/i18n';
import { selectViewed, useSim, type SimStore } from '../store/useSim';
import { UI_CHART_MS, UI_TEXT_MS, useThrottledSim } from './hooks';
import { MweriChart } from './MweriChart';
import { Panel } from './Panel';
import { MweriBadge } from './StatusBadge';
import { MWERI_TONE } from './tone';
import { useView } from '../store/useView';
import {
  mweriChart,
  mweriFormula,
  rankingRows,
  volumeRiskInsight,
  whatIf,
  withSimulated,
  type RankRow,
  type VolumeRiskInsight,
} from './viewModels';
import { WhatIfResult } from './WhatIfResult';

/** Baris ranking sebagai string kunci agar tidak re-render bila nilai tampilan sama. */
const selectRows = (s: SimStore) => JSON.stringify(rankingRows(selectViewed(s)).map((r) => ({ ...r, mweri: +r.mweri.toFixed(1) })));
const selectFormula = (s: SimStore) => mweriFormula(selectViewed(s));
const selectInsight = (s: SimStore) => JSON.stringify(volumeRiskInsight(selectViewed(s)));
const selectChart = (s: SimStore) => {
  const v = selectViewed(s);
  const top = v.nodes.find((n) => n.id === v.ranking[0]);
  return top ? { id: top.id, points: mweriChart(top) } : null;
};

function RankItem({ row, selected, onSelect }: { row: RankRow; selected: boolean; onSelect: () => void }) {
  const tone = MWERI_TONE[row.cls];
  const { H, P, W, T } = row.params;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`-mx-2 grid w-[calc(100%+1rem)] grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-tile px-2 py-1.5 text-left transition-colors duration-[var(--duration-fast)] hover:bg-surface-2 ${
          selected ? 'bg-surface-2 ring-1 ring-accent/60' : ''
        }`}
      >
        <span
          className={`grid size-7 place-items-center rounded-control font-mono text-caption font-bold text-on-status ${tone.fill}`}
          aria-label={`Prioritas ${row.rank}`}
        >
          #{row.rank}
        </span>
        <span className="min-w-0">
          <span className="block text-heading font-semibold">Node {row.id}</span>
          <span className="block font-mono text-caption text-fg-3">
            H{H} · P{P} · W{W} · T{T}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className={`font-mono text-metric-lg font-semibold ${tone.text}`}>{row.mweri.toFixed(1)}</span>
          <MweriBadge cls={row.cls} />
        </span>
        <span className="col-span-3 h-1.5 overflow-hidden rounded-full bg-surface-1" aria-hidden>
          <span
            className={`block h-full rounded-full transition-[width] duration-[var(--duration-base)] ${tone.fill}`}
            style={{ width: `${Math.min(100, row.mweri * 10)}%` }}
          />
        </span>
      </button>
    </li>
  );
}

export function MweriPanel({ embedded = false }: { embedded?: boolean }) {
  const rows = JSON.parse(useThrottledSim(selectRows, UI_TEXT_MS)) as RankRow[];
  const formula = useSim(selectFormula);
  const chart = useThrottledSim(selectChart, UI_CHART_MS);
  const insight = JSON.parse(useThrottledSim(selectInsight, UI_TEXT_MS)) as VolumeRiskInsight | null;
  const selected = useView((s) => s.selected);
  const [infoOpen, setInfoOpen] = useState(false);
  const selectNode = useView((s) => s.selectNode);
  const result = useView((s) => s.whatIf);
  const setWhatIf = useView((s) => s.setWhatIf);
  const runWhatIf = () => setWhatIf(whatIf(selectViewed(useSim.getState()), 30));
  // Memo: tanpa ini array baru tiap render (5 Hz) membuat MweriChart (memo) tetap menggambar ulang.
  const points = useMemo(
    () => (chart && result ? withSimulated(chart.points, result.trajectories[chart.id]) : chart?.points),
    [chart, result],
  );

  return (
    <Panel
      title={UI.mweri.title}
      subtitle={formula}
      className="w-panel-w"
      embedded={embedded}
      headerExtra={
        insight && (
          // Progressive disclosure: insight "Volume ≠ risiko" dibuka lewat ikon (i); titik = ada insight.
          <button
            type="button"
            aria-expanded={infoOpen}
            aria-controls="insight-body"
            aria-label={UI.insightToggle}
            title={UI.insightToggle}
            onClick={() => setInfoOpen(!infoOpen)}
            className="relative grid size-8 place-items-center rounded-control text-fg-2 hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.25" />
              <path d="M8 7.2v4M8 4.9v.1" strokeLinecap="round" />
            </svg>
            {!infoOpen && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-warning" />}
          </button>
        )
      }
    >
      <ol className="space-y-4" aria-label="Ranking prioritas node">
        {rows.map((r) => (
          <RankItem
            key={r.id}
            row={r}
            selected={selected === r.id}
            onSelect={() => selectNode(selected === r.id ? null : r.id)}
          />
        ))}
      </ol>

      {insight && infoOpen && (
        <aside id="insight-body" className="mt-4 rounded-tile bg-warning/10 p-tile">
          <h3 className="text-label uppercase text-warning">{UI.insight.title}</h3>
          <p className="mt-1 text-caption text-fg">
            {UI.insight.body(insight.nodeId, insight.residue, insight.mweri, insight.rank, insight.topNodeId)}
          </p>
          <button
            type="button"
            onClick={() => selectNode(insight.nodeId)}
            className="mt-1.5 text-caption font-semibold text-accent underline-offset-2 hover:underline"
          >
            {UI.insight.action(insight.nodeId)}
          </button>
        </aside>
      )}

      {chart && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="text-title uppercase text-accent">{UI.mweri.chartTitle(chart.id)}</h3>
          <MweriChart points={points ?? chart.points} />
          <p className="font-mono text-caption text-fg-3">
            {UI.mweri.chartNote}
            {result && ` · ${UI.whatIf.legend}`}
          </p>
          <button
            type="button"
            onClick={runWhatIf}
            className="mt-2 flex h-control w-full items-center justify-center gap-2 rounded-control border border-line-control bg-surface-1 text-body font-semibold text-fg transition-colors duration-[var(--duration-fast)] hover:bg-surface-2"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7M2.5 2.5v3.7h3.7" />
            </svg>
            {UI.whatIf.run}
          </button>
          {result && <WhatIfResult result={result} />}
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-caption text-fg-3">{DISCLAIMER.mweri}</p>
    </Panel>
  );
}
