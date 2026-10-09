/**
 * Ringkasan node default (declutter): "● Node A · 8.4" — bentuk + warna status, angka MWERI
 * berwarna kelasnya. Klik membuka kartu lengkap & memfokuskan kamera.
 */
import { useCallback } from 'react';
import { STATUS_LABEL, UI } from '../config/i18n';
import { selectViewed, type SimStore } from '../store/useSim';
import { useView } from '../store/useView';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { StatusShape } from './StatusBadge';
import { MWERI_TONE, STATUS_TONE } from './tone';
import { nodeCardView, type NodeCardView } from './viewModels';

export function NodePill({ nodeId }: { nodeId: string }) {
  const select = useCallback((s: SimStore) => JSON.stringify(nodeCardView(selectViewed(s), nodeId)), [nodeId]);
  const v = JSON.parse(useThrottledSim(select, UI_TEXT_MS)) as NodeCardView | null;
  const selectNode = useView((s) => s.selectNode);
  if (!v) return null;
  return (
    <button
      type="button"
      onClick={() => selectNode(v.id)}
      aria-label={`${UI.card.open(v.id)} — ${STATUS_LABEL[v.status]}, MWERI ${v.mweri}`}
      className="pointer-events-auto flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong bg-surface-0/95 px-2.5 text-caption shadow-raised transition-colors duration-[var(--duration-fast)] hover:border-line-control hover:bg-surface-1"
    >
      <StatusShape status={v.status} className={STATUS_TONE[v.status].text} />
      <span className="font-semibold text-fg">Node {v.id}</span>
      <span className={`font-mono font-semibold ${MWERI_TONE[v.cls].text}`}>{v.mweri}</span>
    </button>
  );
}
