/** Kontrol simulasi sementara (Fase 4): jalankan/jeda, kecepatan, skenario. Ditata ulang di Fase 5. */
import { SCENARIO_ORDER, SCENARIOS } from '../config/scenarios';
import { selectViewed, SPEEDS, useSim } from '../store/useSim';
import { formatClock } from './format';

const chip = 'h-control whitespace-nowrap rounded-control border px-3 text-body transition-colors';
const idle = 'border-line-control bg-surface-1 text-fg-2 hover:bg-surface-2 hover:text-fg';
const on = 'border-accent bg-accent/16 font-semibold text-accent';

export function SimControls() {
  const running = useSim((s) => s.running);
  const speed = useSim((s) => s.speed);
  const t = useSim((s) => selectViewed(s).t);
  const scenario = useSim((s) => s.nivora.scenarioId);
  const { toggle, setSpeed, setScenario } = useSim.getState();

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={`${chip} ${running ? on : idle}`} onClick={toggle}>
        {running ? 'Jeda' : 'Jalankan'}
      </button>
      <span className="w-14 text-center font-mono text-body">{formatClock(t)}</span>
      {SPEEDS.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={speed === v}
          className={`${chip} ${speed === v ? on : idle}`}
          onClick={() => setSpeed(v)}
        >
          {v}×
        </button>
      ))}
      <span className="ml-2 text-label uppercase text-fg-3">Skenario</span>
      {SCENARIO_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={scenario === id}
          className={`${chip} ${scenario === id ? on : idle}`}
          onClick={() => setScenario(id)}
        >
          {SCENARIOS[id].label}
        </button>
      ))}
    </div>
  );
}
