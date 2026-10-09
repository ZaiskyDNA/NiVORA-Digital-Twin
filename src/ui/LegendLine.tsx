/**
 * Legenda satu baris tanpa panel (declutter): makna garis rute + bentuk status + pekerja.
 * Rute terpendek tidak diberi label di scene — artinya dijelaskan di sini.
 */
import { STATUS_LABEL, UI } from '../config/i18n';
import type { Status } from '../sim/types';
import { StatusShape } from './StatusBadge';
import { STATUS_TONE } from './tone';

const STATUSES: Status[] = ['normal', 'warning', 'critical'];

export function LegendLine() {
  return (
    <ul aria-label={UI.legend.title} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-2">
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-0.5 w-6 rounded-full bg-safe" />
        {UI.legendLine.safe}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="w-6 border-t-2 border-dashed border-critical" />
        {UI.legendLine.shortest}
      </li>
      {STATUSES.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StatusShape status={s} className={STATUS_TONE[s].text} />
          {STATUS_LABEL[s]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-[2px] bg-worker" />
        {UI.legend.worker}
      </li>
    </ul>
  );
}
