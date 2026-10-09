/** Tabel rute kandidat D/R/O/Cost (Lampiran 7) — ditampilkan di balik "Lihat detail routing". */
import { UI } from '../config/i18n';
import type { RouteRowView } from './viewModels';

const KIND_LABEL: Record<RouteRowView['kind'], string> = {
  safe: UI.routing.safe,
  shortest: UI.routing.shortest,
  alternative: UI.routing.alternative,
};

function RouteRow({ row }: { row: RouteRowView }) {
  const safe = row.kind === 'safe';
  const label = row.blocked
    ? UI.routing.blocked
    : safe && row.throughZone
      ? UI.routing.chosenInZone
      : KIND_LABEL[row.kind];
  const rowClass = row.blocked
    ? 'text-fg-disabled line-through'
    : safe
      ? 'bg-safe/10 font-semibold text-safe'
      : row.selected
        ? 'bg-surface-2 text-fg'
        : row.kind === 'shortest'
          ? 'text-critical-fg'
          : 'text-fg-2';
  const td = 'h-row px-2 text-right font-mono';
  return (
    <tr className={`border-b border-line/60 ${rowClass}`} aria-selected={row.selected}>
      <th scope="row" className="h-row px-2 text-left font-normal">
        <span className="font-semibold">{row.id}</span> · {label}
      </th>
      <td className={td}>{row.D}</td>
      <td className={td}>{row.R}</td>
      <td className={td}>{row.O}</td>
      <td className={td}>{row.cost}</td>
    </tr>
  );
}

export function RouteTable({ rows, scaled, formula }: { rows: readonly RouteRowView[]; scaled: boolean; formula: string }) {
  if (rows.length === 0) return <p className="text-caption text-fg-3">{UI.routing.noCandidates}</p>;
  return (
    <div>
      <p className="font-mono text-caption text-fg-3">{formula}</p>
      <table className="mt-1.5 w-full border-collapse text-body">
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
      {scaled && <p className="mt-1 text-caption text-fg-3">{UI.routing.scaled}</p>}
    </div>
  );
}
