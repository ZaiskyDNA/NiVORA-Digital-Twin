/** Pemilih skenario ringkas di TopBar (segmented radiogroup, panah kiri/kanan). */
import type { KeyboardEvent } from 'react';
import { UI } from '../config/i18n';
import { SCENARIO_ORDER, SCENARIOS, type ScenarioId } from '../config/scenarios';
import type { Status } from '../sim/types';
import { useSim } from '../store/useSim';
import { StatusShape } from './StatusBadge';
import { STATUS_TONE } from './tone';

const TONE: Record<ScenarioId, Status> = { normal: 'normal', surge: 'warning', disruption: 'critical' };

export function ScenarioSwitch() {
  const current = useSim((s) => s.nivora.scenarioId);
  const setScenario = useSim((s) => s.setScenario);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = SCENARIO_ORDER.indexOf(current);
    const next = SCENARIO_ORDER[(i + (e.key === 'ArrowRight' ? 1 : -1) + SCENARIO_ORDER.length) % SCENARIO_ORDER.length];
    if (!next) return;
    setScenario(next);
    (e.currentTarget.querySelector(`[data-id="${next}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={UI.top.scenario}
      onKeyDown={onKeyDown}
      className="flex rounded-control border border-line-control"
    >
      {SCENARIO_ORDER.map((id) => {
        const on = id === current;
        const tone = STATUS_TONE[TONE[id]];
        return (
          <button
            key={id}
            data-id={id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            title={SCENARIOS[id].description}
            onClick={() => setScenario(id)}
            className={`flex h-8 items-center gap-1.5 px-3 text-caption first:rounded-l-control last:rounded-r-control ${
              on ? `${tone.soft} ${tone.text} font-semibold` : 'bg-surface-1 text-fg-2 hover:text-fg'
            }`}
          >
            {on && <StatusShape status={TONE[id]} />}
            {UI.top.scenarioShort[id]}
          </button>
        );
      })}
    </div>
  );
}
