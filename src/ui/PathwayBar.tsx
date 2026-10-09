/** Circular Material Decision Pathway untuk node prioritas #1 — tahap aktif menyala + alasan (§5.4). */
import { UI } from '../config/i18n';
import { selectViewed, type SimStore } from '../store/useSim';
import { UI_TEXT_MS, useThrottledSim } from './hooks';
import { Panel } from './Panel';
import { pathwayView, type PathwayStepView, type PathwayView } from './viewModels';

const selectView = (s: SimStore) => JSON.stringify(pathwayView(selectViewed(s)));

function Step({ step, first }: { step: PathwayStepView; first: boolean }) {
  const lastResort = step.stage === 'disposal';
  const cls =
    step.state === 'active'
      ? lastResort
        ? 'border-warning bg-warning/16 font-semibold text-warning'
        : 'border-normal bg-normal/16 font-semibold text-normal'
      : 'border-line bg-surface-1 text-fg-3';
  return (
    <li
      className="flex items-center gap-1"
      aria-current={step.state === 'active' ? 'step' : undefined}
      aria-label={step.state === 'rejected' ? `${step.label}: ${UI.pathway.notFeasible}` : undefined}
    >
      {!first && (
        <span aria-hidden className="text-fg-3">
          ›
        </span>
      )}
      <span className={`flex h-control items-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-body ${cls}`}>
        {step.state === 'active' && (
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m2 6.5 2.5 2.5L10 3.5" />
          </svg>
        )}
        {step.state === 'rejected' && (
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 3 6 6M9 3 3 9" />
          </svg>
        )}
        {step.label}
      </span>
    </li>
  );
}

export function PathwayBar() {
  const view = JSON.parse(useThrottledSim(selectView, UI_TEXT_MS)) as PathwayView | null;
  if (!view) return null;
  return (
    <Panel title={UI.pathway.title} className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="shrink-0 whitespace-nowrap text-label uppercase text-fg-3">Node {view.nodeId} →</span>
        <ol className="flex flex-wrap items-center gap-1">
          {view.steps.map((step, i) => (
            <Step key={step.stage} step={step} first={i === 0} />
          ))}
        </ol>
      </div>
      <p className="mt-2 text-caption text-fg-2">
        {UI.pathway.reason}: {view.reason}
      </p>
    </Panel>
  );
}
