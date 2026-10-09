/** Legenda status: bentuk + warna + teks (status tidak pernah hanya lewat warna). */
import { STATUS_LABEL, UI } from '../config/i18n';
import type { Status } from '../sim/types';
import { StatusShape } from './StatusBadge';
import { STATUS_TONE } from './tone';

const STATUSES: Status[] = ['normal', 'warning', 'critical'];

export function Legend() {
  return (
    <section
      aria-label={UI.legend.title}
      className="pointer-events-auto rounded-panel border border-line-strong bg-surface-0/92 px-panel py-3 shadow-panel"
    >
      <ul className="flex items-center gap-4 text-body text-fg">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <StatusShape status={s} className={`size-2.5 ${STATUS_TONE[s].text}`} />
            {STATUS_LABEL[s]}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-worker" />
          {UI.legend.worker}
        </li>
      </ul>
    </section>
  );
}
