/**
 * Kartu Rekomendasi — pusat perhatian (declutter). Menjawab kapan · prioritas · ke mana · lewat
 * mana, memuat langkah pathway aktif, dan menyimpan tabel D/R/O/Cost di balik "Lihat detail routing".
 * Cyan hanya di sini dan pada safe route (keputusan NiVORA); mode reaktif bernada merah.
 */
import { useId, useState } from 'react';
import { UI } from '../config/i18n';
import { PATHWAY_STAGES } from '../sim/pathway';
import { selectViewed, type SimStore } from '../store/useSim';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { RouteTable } from './RouteTable';
import { StatusShape } from './StatusBadge';
import { MWERI_TONE, STATUS_TONE } from './tone';
import { recommendationView, routeFormula, routingRows, type RecommendationView } from './viewModels';

const selectView = (s: SimStore) => JSON.stringify(recommendationView(selectViewed(s)));
const selectRoutes = (s: SimStore) =>
  JSON.stringify({ ...routingRows(selectViewed(s)), formula: routeFormula(selectViewed(s)) });

function Urgency({ v }: { v: RecommendationView }) {
  const [label, cls] =
    v.urgency === 'now'
      ? [UI.rec.now, `${STATUS_TONE.critical.soft} ${STATUS_TONE.critical.text}`]
      : v.urgency === 'soon' && v.ttc !== null
        ? [UI.rec.soon(v.ttc), `${STATUS_TONE.warning.soft} ${STATUS_TONE.warning.text}`]
        : [UI.rec.monitor, 'bg-surface-2 text-fg-2'];
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-badge px-2 text-label uppercase ${cls}`}>
      {v.urgency !== 'monitor' && <StatusShape status={v.urgency === 'now' ? 'critical' : 'warning'} />}
      {label}
    </span>
  );
}

/** Lima tahap pathway sebagai titik; tahap aktif terisi & diberi nama. */
function PathwaySteps({ index }: { index: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={UI.rec.stepOf(index + 1, PATHWAY_STAGES.length)}>
      {PATHWAY_STAGES.map((stage, i) => (
        <span
          key={stage}
          aria-hidden
          className={`size-1.5 rounded-full ${i === index ? 'bg-normal' : i < index ? 'bg-fg-3' : 'bg-surface-2 ring-1 ring-line-strong'}`}
        />
      ))}
    </span>
  );
}

export function RecommendationCard() {
  const v = JSON.parse(useThrottledSim(selectView, UI_TEXT_MS)) as RecommendationView | null;
  const routes = JSON.parse(useThrottledSim(selectRoutes, UI_TEXT_MS)) as ReturnType<typeof routingRows> & {
    formula: string;
  };
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  if (!v) return null;

  const tone = v.reactive ? 'border-critical/50' : 'border-safe/50';
  const titleTone = v.reactive ? 'text-critical-fg' : 'text-safe';
  const routeText = v.reactive ? UI.rec.shortestReactive : v.throughZone ? UI.rec.crosses : UI.rec.avoids;

  return (
    <section
      aria-labelledby={`${detailsId}-title`}
      className={`pointer-events-auto w-panel-w rounded-panel border bg-surface-0/95 p-panel shadow-panel ${tone}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id={`${detailsId}-title`} className={`text-title uppercase ${titleTone}`}>
          {v.reactive ? UI.rec.titleReactive : UI.rec.title}
        </h2>
        <Urgency v={v} />
      </header>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-heading font-semibold text-fg">
        {v.urgency === 'monitor' ? UI.rec.watch(v.nodeId) : UI.rec.handle(v.nodeId)}
        <span className={`font-mono ${MWERI_TONE[v.cls].text}`}>{v.mweri}</span>
        <span className="text-caption font-normal text-fg-2">{UI.rec.priority(v.rank)}</span>
      </p>

      <dl className="mt-3 space-y-2.5 text-body">
        <div className="grid grid-cols-[4.5rem_1fr] gap-x-3">
          <dt className="text-fg-3">{UI.rec.where}</dt>
          <dd>
            <span className="font-semibold text-fg">{v.destination}</span>
            <span className="mt-1 flex items-center gap-2 text-caption text-fg-2">
              <PathwaySteps index={v.stageIndex} />
              {v.stageLabel}
            </span>
            <span className="mt-0.5 block text-caption text-fg-3">{v.stageReason}</span>
          </dd>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr] gap-x-3">
          <dt className="text-fg-3">{UI.rec.via}</dt>
          <dd>
            <span className={`font-semibold ${v.reactive || v.throughZone ? 'text-fg' : 'text-safe'}`}>
              {UI.rec.route(v.routeId, v.routeCost)}
            </span>
            <span className={`block text-caption ${v.throughZone ? 'text-warning' : 'text-fg-2'}`}>{routeText}</span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen(!open)}
        className="mt-3 flex items-center gap-1.5 rounded-control text-caption font-semibold text-accent hover:text-fg"
      >
        <svg
          viewBox="0 0 16 16"
          className={`size-3.5 transition-transform duration-[var(--duration-base)] ${open ? 'rotate-90' : ''}`}
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m6 4 4 4-4 4" />
        </svg>
        {open ? UI.rec.hideDetails : UI.rec.details}
      </button>
      <div id={detailsId} hidden={!open} className="mt-2">
        {open && <RouteTable rows={routes.rows} scaled={routes.scaled} formula={routes.formula} />}
      </div>
    </section>
  );
}

