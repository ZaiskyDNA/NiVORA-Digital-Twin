/**
 * Kartu node (design-system §4.3): status sensor (Edge-AI) dan prioritas MWERI ditampilkan
 * TERPISAH (§13.2) — Node C bisa WARNING (volume) tetapi prioritas rendah.
 * Mode: ringkas (layar sempit / node lain dipilih), penuh, detail (node terpilih, Fase 6).
 * Judul kartu adalah tombol: klik → kamera fokus + detail.
 */
import { useCallback } from 'react';
import { EDGE_AI_REASON_LABEL, PM_LEVEL_LABEL, UI } from '../config/i18n';
import type { EdgeAIReason } from '../sim/types';
import { selectViewed, type SimStore } from '../store/useSim';
import { useView } from '../store/useView';
import { NARROW_QUERY, UI_TEXT_MS, useMediaQuery, useThrottledSim } from './hooks';
import { NodeDetail } from './NodeDetail';
import { MweriBadge, StatusBadge, StatusShape } from './StatusBadge';
import { MWERI_TONE, STATUS_TONE } from './tone';
import { nodeCardView, type NodeCardView } from './viewModels';

/** Angka → mono `text-metric`; kata (level PM) → sans agar muat di kolom (design-system §1.4). */
function Metric({
  label,
  value,
  word = false,
  className = 'text-fg',
}: {
  label: string;
  value: string;
  word?: boolean;
  className?: string;
}) {
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

/** `embedded`: detail node di bottom sheet ponsel (lebar penuh). */
export function NodeCard({ nodeId, embedded = false }: { nodeId: string; embedded?: boolean }) {
  const select = useCallback((s: SimStore) => JSON.stringify(nodeCardView(selectViewed(s), nodeId)), [nodeId]);
  const v = JSON.parse(useThrottledSim(select, UI_TEXT_MS)) as NodeCardView | null;
  const narrow = useMediaQuery(NARROW_QUERY);
  const selected = useView((s) => s.selected);
  const selectNode = useView((s) => s.selectNode);
  if (!v) return null;

  const isSelected = selected === v.id;
  // Ringkas: layar sempit atau ada node lain yang sedang dibuka — kecuali node critical.
  const compact = !isSelected && v.status !== 'critical' && (narrow || selected !== null);
  const status = STATUS_TONE[v.status];
  const reasons = v.reasons
    .split(',')
    .filter(Boolean)
    .map((r) => EDGE_AI_REASON_LABEL[r as EdgeAIReason])
    .join(' + ');
  const prediction =
    v.ttc === null ? UI.card.stable : v.ttc === 0 ? UI.card.criticalNow : UI.card.criticalIn(v.ttc);
  const width = embedded ? 'w-full' : isSelected ? 'w-[22rem]' : compact ? 'w-60' : 'w-card-w';

  return (
    <article
      aria-label={`Node ${v.id} · ${v.name}`}
      className={`pointer-events-auto ${width} rounded-card bg-surface-0/95 p-tile ${status.glow} ${
        isSelected ? 'ring-2 ring-accent/70' : ''
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => selectNode(isSelected ? null : v.id)}
          aria-pressed={isSelected}
          aria-label={isSelected ? UI.card.close : UI.card.open(v.id)}
          className="-m-1 flex min-w-0 items-center gap-2 rounded-control p-1 text-left text-caption font-semibold text-fg hover:bg-surface-2"
        >
          <StatusShape status={v.status} className={status.text} />
          <span className="truncate">
            Node {v.id} · {v.name}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={v.status} variant={v.status === 'critical' ? 'solid' : 'soft'} />
          {isSelected && (
            <button
              type="button"
              onClick={() => selectNode(null)}
              aria-label={UI.card.close}
              className="grid size-6 place-items-center rounded-control text-fg-2 hover:bg-surface-2 hover:text-fg"
            >
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m3 3 6 6M9 3 3 9" />
              </svg>
            </button>
          )}
        </div>
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
            <Metric
              label={UI.card.residue}
              value={v.residue}
              className={v.noWorkersHighResidue ? 'text-warning-fg' : 'text-fg'}
            />
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

          {v.noWorkersHighResidue ? (
            <p className="mt-2 flex items-start gap-1.5 text-caption font-medium text-fg">
              <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
              {UI.card.noWorkers}
            </p>
          ) : (
            <p className="mt-2 text-caption text-fg-2">{prediction}</p>
          )}

          {isSelected && <NodeDetail nodeId={v.id} />}
        </>
      )}
    </article>
  );
}
