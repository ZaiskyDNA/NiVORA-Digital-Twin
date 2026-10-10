/**
 * Halaman debug SEMENTARA (Fase 2): tabel teks state engine per tick. Buka dengan `#debug`.
 * Hanya membaca store — tidak ada logika simulasi di sini.
 */
import { useEffect, type ReactNode } from 'react';
import { FACILITY_LABEL, MWERI_CLASS_LABEL, PATHWAY_LABEL, STATUS_LABEL } from '../config/i18n';
import { SCENARIO_ORDER, SCENARIOS } from '../config/scenarios';
import { compareKpi, summarize } from '../sim/metrics';
import { classifyMweri } from '../sim/mweri';
import type { Status } from '../sim/types';
import { startSimClock } from '../store/clock';
import { selectViewed, SPEEDS, useSim } from '../store/useSim';
import { fmt, formatClock, formatDelta } from '../ui/format';

const STATUS_TEXT: Record<Status, string> = {
  normal: 'text-normal-fg',
  warning: 'text-warning-fg',
  critical: 'text-critical-fg',
};

const th = 'px-2 py-1 text-left text-label uppercase text-fg-3 border-b border-line';
const td = 'px-2 py-1 border-b border-line/60';
const num = `${td} text-right font-mono`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-line-strong bg-surface-0 p-panel shadow-panel">
      <h2 className="mb-stack text-title uppercase text-accent">{title}</h2>
      {children}
    </section>
  );
}

const button =
  'h-control rounded-control border border-line-control bg-surface-1 px-3 text-body text-fg-2 hover:bg-surface-2 hover:text-fg';
const active = 'border-accent bg-accent/16 text-accent font-semibold';

export default function DebugPage() {
  useEffect(() => startSimClock(), []);

  const store = useSim();
  const s = selectViewed(store);
  const kN = summarize(store.nivora.metrics);
  const kR = summarize(store.reactive.metrics);
  const cmp = compareKpi(kN, kR);
  const rec = s.recommendation;

  return (
    <div className="h-full overflow-auto p-gutter">
      <header className="mb-gutter flex flex-wrap items-center gap-3">
        <h1 className="mr-4 text-heading font-bold">
          NiVORA · <span className="text-accent">debug engine</span>
        </h1>
        <span className="font-mono text-metric">t = {formatClock(s.t)}</span>
        <span className="text-caption text-fg-3">tick {s.t} · seed {s.seed}</span>
        <button className={button} onClick={store.toggle}>
          {store.running ? 'Jeda' : 'Jalankan'}
        </button>
        <button className={button} onClick={() => store.tick(1)} disabled={store.running}>
          +1 tick
        </button>
        <button className={button} onClick={() => store.tick(30)} disabled={store.running}>
          +30
        </button>
        <button className={button} onClick={() => store.reset()}>
          Reset
        </button>
        <span className="ml-2 text-label uppercase text-fg-3">Kecepatan</span>
        {SPEEDS.map((v) => (
          <button key={v} className={`${button} ${store.speed === v ? active : ''}`} onClick={() => store.setSpeed(v)}>
            {v}×
          </button>
        ))}
        <span className="ml-2 text-label uppercase text-fg-3">Skenario</span>
        {SCENARIO_ORDER.map((id) => (
          <button
            key={id}
            className={`${button} ${s.scenarioId === id ? active : ''}`}
            onClick={() => store.setScenario(id)}
          >
            {SCENARIOS[id].label}
          </button>
        ))}
        <span className="ml-2 text-label uppercase text-fg-3">Tampilan</span>
        {(['nivora', 'reactive'] as const).map((v) => (
          <button key={v} className={`${button} ${store.view === v ? active : ''}`} onClick={() => store.setView(v)}>
            {v === 'nivora' ? 'NiVORA' : 'Reaktif'}
          </button>
        ))}
      </header>

      <div className="grid gap-gutter xl:grid-cols-2">
        <Section title="Node">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Node', 'Residu %', 'PM', 'Pekerja', 'Paparan', 'MWERI', 'Kelas', 'Status', 'ttc', 'Slope'].map(
                  (h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {s.ranking.map((id, i) => {
                const n = s.nodes.find((x) => x.id === id);
                if (!n) return null;
                return (
                  <tr key={id}>
                    <td className={td}>
                      #{i + 1} {n.id} · {n.name}
                    </td>
                    <td className={num}>{fmt(n.residueLevel)}</td>
                    <td className={num}>{fmt(n.pm)}</td>
                    <td className={num}>
                      {n.workers}/{n.maxWorkersZone}
                    </td>
                    <td className={num}>{n.exposureMin}m</td>
                    <td className={num}>{fmt(n.mweri, 2)}</td>
                    <td className={td}>{MWERI_CLASS_LABEL[classifyMweri(n.mweri)]}</td>
                    <td className={`${td} ${STATUS_TEXT[n.status]}`}>
                      {STATUS_LABEL[n.status]}
                      {n.statusReasons.length > 0 && ` (${n.statusReasons.join(', ')})`}
                    </td>
                    <td className={num}>{n.ttc === null ? '—' : `${fmt(n.ttc, 0)}m`}</td>
                    <td className={num}>{fmt(n.levelSlope, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        <Section title="Rekomendasi & routing">
          {rec ? (
            <div className="space-y-stack">
              <p className="text-body">
                Node <b>{rec.nodeId}</b> · prioritas #{rec.rank} · urgensi <b>{rec.urgency}</b>
                {rec.ttc !== null && ` · ttc ${fmt(rec.ttc, 0)}m`} → {PATHWAY_LABEL[rec.stage]} →{' '}
                <b>{FACILITY_LABEL[rec.destination] ?? rec.destination}</b>
                {rec.taskActive && ' · truk sedang bertugas'}
              </p>
              <p className="font-mono text-caption text-safe">terpilih: {rec.route?.vertices.join(' → ') ?? '—'}</p>
              <p className="font-mono text-caption text-critical-fg">
                terpendek: {rec.shortest?.vertices.join(' → ') ?? '—'}
              </p>
              {rec.candidates.length > 0 && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Rute', 'D', 'R', 'O', 'Cost', ''].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rec.candidates.map((r) => (
                      <tr key={r.id} className={rec.selectedCandidate === r.id ? 'bg-safe/10 text-safe' : ''}>
                        <td className={td}>{r.id}</td>
                        <td className={num}>{fmt(r.totals.D, 1)}</td>
                        <td className={num}>{fmt(r.totals.R, 1)}</td>
                        <td className={num}>{fmt(r.totals.O, 1)}</td>
                        <td className={num}>{fmt(r.cost, 2)}</td>
                        <td className={td}>
                          {r.blocked ? 'terblokir' : rec.selectedCandidate === r.id ? 'terpilih ✓' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p className="text-fg-3">Belum ada rekomendasi.</p>
          )}
        </Section>

        <Section title={`Truk aktif (${s.tasks.length})`}>
          {s.tasks.length === 0 ? (
            <p className="text-fg-3">Tidak ada truk yang bertugas.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Node', 'Tujuan', 'Muat', 'Ruas', 'Rute'].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.tasks.map((t) => (
                  <tr key={t.id}>
                    <td className={num}>{t.id}</td>
                    <td className={td}>{t.nodeId}</td>
                    <td className={td}>{FACILITY_LABEL[t.destination] ?? t.destination}</td>
                    <td className={num}>{t.loadingMin}m</td>
                    <td className={num}>
                      {Math.min(t.leg + 1, t.legs.length)}/{t.legs.length} ({fmt(t.legProgress, 1)})
                    </td>
                    <td className={`${td} font-mono text-caption`}>
                      {[t.legs[0]?.from, ...t.legs.map((l) => l.to)].join(' → ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="KPI 3P · NiVORA vs Reaktif">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['KPI', 'NiVORA', 'Reaktif', 'Δ'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Dosis paparan (pekerja-menit × PM)', kN.people.exposureDose, kR.people.exposureDose, cmp.exposureDose, 0],
                  ['Durasi paparan (pekerja-menit, total)', kN.people.exposureTotal, kR.people.exposureTotal, cmp.exposure, 0],
                  ['Paparan shift ini', kN.people.exposureShift, kR.people.exposureShift, null, 0],
                  ['Rata-rata MWERI', kN.people.avgMweri, kR.people.avgMweri, cmp.avgMweri, 2],
                  [
                    'Recovery rate %',
                    kN.planet.recoveryRate === null ? null : kN.planet.recoveryRate * 100,
                    kR.planet.recoveryRate === null ? null : kR.planet.recoveryRate * 100,
                    cmp.recoveryRate,
                    0,
                  ],
                  ['Trip', kN.productivity.trips, kR.productivity.trips, cmp.trips, 0],
                  ['Trip tak perlu', kN.productivity.unnecessaryTrips, kR.productivity.unnecessaryTrips, cmp.unnecessaryTrips, 0],
                  [
                    'Trip tepat guna %',
                    kN.productivity.usefulTripRate === null ? null : kN.productivity.usefulTripRate * 100,
                    kR.productivity.usefulTripRate === null ? null : kR.productivity.usefulTripRate * 100,
                    null,
                    0,
                  ],
                  ['Jarak (Σ D)', kN.productivity.distance, kR.productivity.distance, cmp.distance, 0],
                ] as const
              ).map(([label, a, b, d, digits]) => (
                <tr key={label}>
                  <td className={td}>{label}</td>
                  <td className={num}>{fmt(a, digits)}</td>
                  <td className={num}>{fmt(b, digits)}</td>
                  <td className={num}>{formatDelta(d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Event (terbaru di atas)">
          <ol className="max-h-72 space-y-0.5 overflow-auto font-mono text-caption">
            {[...s.events].reverse().map((e, i) => (
              <li key={`${e.t}-${i}`} className={e.type === 'reroute' ? 'text-safe' : 'text-fg-2'}>
                {formatClock(e.t)} {e.type}
                {e.nodeId && ` ${e.nodeId}`}
                {e.taskId !== undefined && ` #${e.taskId}`}
                {e.detail && ` · ${e.detail}`}
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <p className="mt-gutter text-caption text-fg-3">
        Halaman debug sementara · seluruh nilai bersifat ilustratif
      </p>
    </div>
  );
}
