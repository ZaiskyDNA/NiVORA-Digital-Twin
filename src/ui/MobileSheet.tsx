/**
 * Bottom sheet ponsel (§13.16). Tertutup: ringkasan rekomendasi (kapan · prioritas · ke mana · rute)
 * + tab. Ketuk tab → isi lengkap (Rekomendasi / Prioritas MWERI / Bandingkan reaktif). Node yang
 * dipilih di scene tampil sebagai detail di sini, bukan kartu melayang. Saat tur: hanya ringkasan.
 */
import { useId, useState } from 'react';
import { DISCLAIMER, UI } from '../config/i18n';
import { selectViewed, type SimStore } from '../store/useSim';
import { useTour } from '../store/useTour';
import { useView } from '../store/useView';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { KpiStrip } from './KpiStrip';
import { LegendLine } from './LegendLine';
import { MweriPanel } from './MweriPanel';
import { NodeCard } from './NodeCard';
import { RecommendationCard, Urgency } from './RecommendationCard';
import { MWERI_TONE } from './tone';
import { recommendationView, type RecommendationView } from './viewModels';

type Tab = 'rec' | 'mweri' | 'kpi';
const TABS: Tab[] = ['rec', 'mweri', 'kpi'];
const selectSummary = (s: SimStore) => JSON.stringify(recommendationView(selectViewed(s)));

function Summary({ v }: { v: RecommendationView }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-baseline gap-2 text-heading font-semibold text-fg">
          <span className="truncate">{v.urgency === 'monitor' ? UI.rec.watch(v.nodeId) : UI.rec.handle(v.nodeId)}</span>
          <span className={`font-mono ${MWERI_TONE[v.cls].text}`}>{v.mweri}</span>
        </p>
        <Urgency v={v} />
      </div>
      <p className="mt-0.5 truncate text-caption text-fg-2">
        <span className="text-fg">{v.destination}</span>
        {' · '}
        <span className={v.reactive || v.throughZone ? 'text-fg' : 'font-semibold text-safe'}>
          {UI.rec.route(v.routeId, v.routeCost)}
        </span>
      </p>
    </div>
  );
}

export function MobileSheet() {
  const v = JSON.parse(useThrottledSim(selectSummary, UI_TEXT_MS)) as RecommendationView | null;
  const selected = useView((s) => s.selected);
  const selectNode = useView((s) => s.selectNode);
  const compare = useView((s) => s.compareMode);
  const touring = useTour((s) => s.active);
  const [tab, setTab] = useState<Tab | null>(null);
  const bodyId = useId();

  // Node terpilih di scene lebih diutamakan daripada tab; menutup sheet melepas pilihan node.
  const showNode = !touring && selected !== null;
  const open = !touring && (showNode || tab !== null);
  const close = () => {
    setTab(null);
    if (selected) selectNode(null);
  };

  return (
    <section
      aria-label={UI.mobile.sheet}
      className="pointer-events-auto flex max-h-[62dvh] flex-col rounded-t-panel border-x border-t border-line-strong bg-surface-0 shadow-panel landscape:max-h-[80dvh]"
    >
      {touring ? (
        // Tur: ringkasan saja (tanpa interaksi); langkah terakhir menampilkan KPI perbandingan.
        <div className="shrink-0 px-4 pt-3 pb-2">{compare ? <KpiStrip embedded /> : v && <Summary v={v} />}</div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? UI.mobile.collapse : UI.mobile.expand}
          onClick={() => (open ? close() : setTab('rec'))}
          className="flex w-full shrink-0 flex-col gap-2 px-4 pt-2 pb-3 text-left"
        >
          <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line-control" />
          {v && <Summary v={v} />}
        </button>
      )}

      {!touring && (
        <div role="tablist" aria-label={UI.mobile.sheet} className="flex shrink-0 gap-1 border-t border-line px-3 pt-2">
          {TABS.map((t) => {
            const active = !showNode && tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={bodyId}
                onClick={() => {
                  if (selected) selectNode(null);
                  setTab(active ? null : t);
                }}
                className={`h-10 flex-1 rounded-control text-caption font-semibold ${
                  active ? 'bg-surface-2 text-fg' : 'text-fg-2'
                }`}
              >
                {UI.mobile.tabs[t]}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div id={bodyId} role="tabpanel" className="min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-2">
          {showNode && selected ? (
            <NodeCard nodeId={selected} embedded />
          ) : tab === 'rec' ? (
            <>
              <RecommendationCard embedded />
              <div className="mt-4 border-t border-line pt-3">
                <LegendLine />
              </div>
            </>
          ) : tab === 'mweri' ? (
            <MweriPanel embedded />
          ) : tab === 'kpi' ? (
            <KpiStrip embedded />
          ) : null}
        </div>
      )}

      <p className="shrink-0 px-4 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-label font-normal tracking-normal text-fg-3">
        {open ? DISCLAIMER.illustrative : UI.mobile.illustrative}
      </p>
    </section>
  );
}
