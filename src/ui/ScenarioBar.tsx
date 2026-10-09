/** Pemilih skenario (design-system §4.6): radiogroup, panah kiri/kanan, nada sesuai skenario. */
import type { KeyboardEvent } from 'react';
import { UI } from '../config/i18n';
import { SCENARIO_ORDER, SCENARIOS, type ScenarioId } from '../config/scenarios';
import type { Status } from '../sim/types';
import { useSim } from '../store/useSim';
import { Panel } from './Panel';
import { StatusShape } from './StatusBadge';
import { STATUS_TONE } from './tone';

const SCENARIO_TONE: Record<ScenarioId, Status> = { normal: 'normal', surge: 'warning', disruption: 'critical' };

export function ScenarioBar() {
  const current = useSim((s) => s.nivora.scenarioId);
  const setScenario = useSim((s) => s.setScenario);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = SCENARIO_ORDER.indexOf(current);
    const next = SCENARIO_ORDER[(i + (e.key === 'ArrowRight' ? 1 : -1) + SCENARIO_ORDER.length) % SCENARIO_ORDER.length];
    if (next) {
      setScenario(next);
      (e.currentTarget.querySelector(`[data-id="${next}"]`) as HTMLElement | null)?.focus();
    }
  };

  return (
    <Panel title={UI.scenario.title} collapsible={false}>
      <div role="radiogroup" aria-label={UI.scenario.title} className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {SCENARIO_ORDER.map((id) => {
          const checked = id === current;
          const toneKey = SCENARIO_TONE[id];
          const tone = STATUS_TONE[toneKey];
          return (
            <button
              key={id}
              data-id={id}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              title={SCENARIOS[id].description}
              onClick={() => setScenario(id)}
              className={`flex h-control items-center gap-2 whitespace-nowrap rounded-control border px-3 text-body transition-colors duration-[var(--duration-fast)] ${
                checked
                  ? `${tone.border} ${tone.soft} ${tone.text} font-semibold`
                  : 'border-line-control bg-surface-1 text-fg-2 hover:bg-surface-2 hover:text-fg'
              }`}
            >
              {checked && <StatusShape status={toneKey} />}
              {SCENARIOS[id].label}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
