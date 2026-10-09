/**
 * Kartu node (design-system §4.3): status sensor (Edge-AI) dan prioritas MWERI ditampilkan
 * TERPISAH (§13.2) — Node C bisa WARNING (volume) tetapi prioritas RENDAH. Isi di-update live,
 * re-render hanya saat nilai tampilan (dibulatkan) berubah.
 */
import { EDGE_AI_REASON_LABEL, PM_LEVEL_LABEL, UI } from '../config/i18n';
import type { EdgeAIReason } from '../sim/types';
import { useCallback } from 'react';
import { selectViewed, type SimStore } from '../store/useSim';
import { NARROW_QUERY, UI_TEXT_MS, useMediaQuery, useThrottledSim } from './hooks';
import { MweriBadge, StatusBadge, StatusShape } from './StatusBadge';
import { MWERI_TONE, STATUS_TONE } from './tone';
import { nodeCardView, type NodeCardView } from './viewModels';

/** Angka → mono `text-metric`; kata (level PM) → sans agar muat di kolom (design-system §1.4). */
function Metric({ label, value, word = false, className = 'text-fg' }: { label: string; value: string; word?: boolean; className?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-label uppercase text-fg-3">{label}</dt>
      <dd
        className={`truncate font-semibold ${word ? 'font-sans text-heading leading-7' : 'font-mono text-metric'} ${className}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function NodeCard({ nodeId }: { nodeId: string }) {
  const select = useCallback((s: SimStore) => JSON.stringify(nodeCardView(selectViewed(s), nodeId)), [nodeId]);
  const v = JSON.parse(useThrottledSim(select, UI_TEXT_MS)) as NodeCardView | null;
  const narrow = useMediaQuery(NARROW_QUERY);
  if (!v) return null;
  // Mode ringkas (design-system §4.3): di layar sempit hanya node critical yang tampil penuh.
  const compact = narrow && v.status !== 'critical';
  const status = STATUS_TONE[v.status];
  const reasons = v.reasons
    .split(',')
    .filter(Boolean)
    .map((r) => EDGE_AI_REASON_LABEL[r as EdgeAIReason])
    .join(' + ');
  const prediction =
    v.ttc === null ? UI.card.stable : v.ttc === 0 ? UI.card.criticalNow : UI.card.criticalIn(v.ttc);

  return (
    <article
      aria-label={`Node ${v.id} · ${v.name}`}
      className={`${compact ? 'w-60' : 'w-card-w'} rounded-card bg-surface-0/95 p-tile ${status.glow}`}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 text-caption font-semibold text-fg">
          <StatusShape status={v.status} className={status.text} />
          <span className="truncate">
            Node {v.id} · {v.name}
          </span>
        </h3>
        <StatusBadge status={v.status} variant={v.status === 'critical' ? 'solid' : 'soft'} />
      </header>

      {compact ? (
        <p className="mt-1.5 flex items-center gap-2">
          <span className={`font-mono text-metric font-semibold ${MWERI_TONE[v.cls].text}`}>{v.mweri}</span>
          <MweriBadge cls={v.cls} />
          <span className="font-mono text-caption text-fg-2">#{v.rank}</span>
        </p>
      ) : (
        <>
          <dl className="mt-2 grid grid-cols-[auto_auto_1fr_auto] gap-x-3">
            <Metric label={UI.card.mweri} value={v.mweri} className={MWERI_TONE[v.cls].text} />
            <Metric label={UI.card.residue} value={v.residue} />
            <Metric label={UI.card.pm} value={PM_LEVEL_LABEL[v.pm]} word />
            <Metric label={UI.card.workers} value={v.workers} />
          </dl>

          <dl className="mt-2 space-y-1 border-t border-line pt-2 text-caption">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-fg-2">{UI.card.sensor}</dt>
              <dd className="flex items-center gap-1.5">
                <StatusBadge status={v.status} />
                {reasons && <span className="text-fg-2">({reasons})</span>}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-fg-2">{UI.card.priority}</dt>
              <dd className="flex items-center gap-1.5">
                <MweriBadge cls={v.cls} />
                <span className="font-mono text-fg-2">#{v.rank}</span>
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-caption text-fg-2">
            {v.noWorkersHighResidue ? UI.card.noWorkers : prediction}
          </p>
        </>
      )}
    </article>
  );
}
