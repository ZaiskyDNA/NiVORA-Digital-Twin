/**
 * Panel kanan atas: tabel rute kandidat (D/R/O/Cost, Lampiran 7) + kotak rekomendasi operasional
 * yang selalu menjawab kapan · prioritas · ke mana · lewat mana (design-system §4.5).
 */
import { UI } from '../config/i18n';
import { selectViewed, useSim, type SimStore } from '../store/useSim';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { Panel } from './Panel';
import { recommendationParts, routeFormula, routingRows, type RouteRowView, type TextPart } from './viewModels';

const selectRows = (s: SimStore) => JSON.stringify(routingRows(selectViewed(s)));
const selectFormula = (s: SimStore) => routeFormula(selectViewed(s));
const selectRec = (s: SimStore) => JSON.stringify(recommendationParts(selectViewed(s)));

const KIND_LABEL: Record<RouteRowView['kind'], string> = {
  safe: UI.routing.safe,
  shortest: UI.routing.shortest,
  alternative: UI.routing.alternative,
};

function RouteRow({ row }: { row: RouteRowView }) {
  const safe = row.kind === 'safe';
  const label = row.blocked ? UI.routing.blocked : KIND_LABEL[row.kind];
  const rowClass = row.blocked
    ? 'text-fg-disabled line-through'
    : safe
      ? 'bg-safe/10 text-safe font-semibold'
      : row.selected
        ? 'bg-surface-2 text-fg'
        : row.kind === 'shortest'
          ? 'text-critical-fg'
          : 'text-fg-2';
  const td = 'h-row px-2 text-right font-mono tabular-nums';
  return (
    <tr className={`border-b border-line/60 ${rowClass}`} aria-selected={row.selected}>
      <th scope="row" className={`h-row px-2 text-left font-normal ${safe ? 'border-l-2 border-safe font-semibold' : 'border-l-2 border-transparent'}`}>
        <span className="font-semibold">{row.id}</span> · {label}
        {safe && ' ✓'}
        {row.kind === 'shortest' && !row.selected && !row.blocked && ' ✕'}
      </th>
      <td className={td}>{row.D}</td>
      <td className={td}>{row.R}</td>
      <td className={td}>{row.O}</td>
      <td className={td}>{row.cost}</td>
    </tr>
  );
}

function Recommendation({ parts }: { parts: readonly TextPart[] }) {
  return (
    <div className="mt-4 rounded-tile border border-safe/40 bg-safe/10 p-tile shadow-glow-safe">
      <h3 className="text-title uppercase text-safe">{UI.routing.recommendationTitle}</h3>
      <p className="mt-2 text-body text-fg">
        {parts.map((p, i) =>
          p.strong ? (
            <strong key={i} className="font-semibold">
              {p.text}
            </strong>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export function RoutingPanel() {
  const { rows, scaled } = JSON.parse(useThrottledSim(selectRows, UI_TEXT_MS)) as ReturnType<typeof routingRows>;
  const formula = useSim(selectFormula);
  const parts = JSON.parse(useThrottledSim(selectRec, UI_TEXT_MS)) as TextPart[];

  return (
    <Panel title={UI.routing.title} subtitle={formula} className="w-panel-w">
      {rows.length > 0 ? (
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">{UI.routing.caption}</caption>
          <thead>
            <tr className="border-b border-line text-label uppercase text-fg-3">
              <th scope="col" className="px-2 pb-1.5 text-left">
                {UI.routing.route}
              </th>
              {['D', 'R', 'O', UI.routing.cost].map((h) => (
                <th key={h} scope="col" className="px-2 pb-1.5 text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <RouteRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-caption text-fg-3">{UI.routing.noCandidates}</p>
      )}
      {scaled && <p className="mt-1 text-caption text-fg-3">{UI.routing.scaled}</p>}
      <Recommendation parts={parts} />
    </Panel>
  );
}
