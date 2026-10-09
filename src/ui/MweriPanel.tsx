/**
 * Panel kiri: ranking prioritas MWERI (live) + grafik prediksi Digital Twin node #1 (±2 Hz)
 * + disclaimer MWERI (wajib, §5.1).
 */
import { DISCLAIMER, UI } from '../config/i18n';
import { selectViewed, useSim, type SimStore } from '../store/useSim';
import { UI_CHART_MS, UI_TEXT_MS, useThrottledSim } from './hooks';
import { MweriChart } from './MweriChart';
import { Panel } from './Panel';
import { MweriBadge } from './StatusBadge';
import { MWERI_TONE } from './tone';
import { mweriChart, mweriFormula, rankingRows, type RankRow } from './viewModels';

/** Baris ranking sebagai string kunci agar tidak re-render bila nilai tampilan sama. */
const selectRows = (s: SimStore) => JSON.stringify(rankingRows(selectViewed(s)).map((r) => ({ ...r, mweri: +r.mweri.toFixed(1) })));
const selectFormula = (s: SimStore) => mweriFormula(selectViewed(s));
const selectChart = (s: SimStore) => {
  const v = selectViewed(s);
  const top = v.nodes.find((n) => n.id === v.ranking[0]);
  return top ? { id: top.id, points: mweriChart(top) } : null;
};

function RankItem({ row }: { row: RankRow }) {
  const tone = MWERI_TONE[row.cls];
  const { H, P, W, T } = row.params;
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
      <span
        className={`grid size-7 place-items-center rounded-control font-mono text-caption font-bold text-on-status ${tone.fill}`}
        aria-label={`Prioritas ${row.rank}`}
      >
        #{row.rank}
      </span>
      <div className="min-w-0">
        <p className="text-heading font-semibold">Node {row.id}</p>
        <p className="font-mono text-caption text-fg-3">
          H{H} · P{P} · W{W} · T{T}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`font-mono text-metric-lg font-semibold ${tone.text}`}>{row.mweri.toFixed(1)}</span>
        <MweriBadge cls={row.cls} />
      </div>
      <div className="col-span-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-[var(--duration-base)] ${tone.fill}`}
          style={{ width: `${Math.min(100, row.mweri * 10)}%` }}
        />
      </div>
    </li>
  );
}

export function MweriPanel() {
  const rows = JSON.parse(useThrottledSim(selectRows, UI_TEXT_MS)) as RankRow[];
  const formula = useSim(selectFormula);
  const chart = useThrottledSim(selectChart, UI_CHART_MS);

  return (
    <Panel title={UI.mweri.title} subtitle={formula} className="w-panel-w">
      <ol className="space-y-4" aria-label="Ranking prioritas node">
        {rows.map((r) => (
          <RankItem key={r.id} row={r} />
        ))}
      </ol>

      {chart && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="text-title uppercase text-accent">{UI.mweri.chartTitle(chart.id)}</h3>
          <MweriChart points={chart.points} />
          <p className="font-mono text-caption text-fg-3">{UI.mweri.chartNote}</p>
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-caption text-fg-3">{DISCLAIMER.mweri}</p>
    </Panel>
  );
}
