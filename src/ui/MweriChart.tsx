/** Grafik MWERI node prioritas: riwayat (garis accent) + proyeksi regresi (putus-putus) + ambang 8. */
import { memo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { UI } from '../config/i18n';
import { DIGITAL_TWIN } from '../config/thresholds';
import { COLOR } from '../styles/tokens';
import type { ChartPoint } from './viewModels';

const AXIS = { fill: COLOR.fg2, fontSize: 12, fontFamily: 'var(--font-mono)' };

/**
 * Di-memo: induknya (MweriPanel) re-render tiap tick untuk ranking, sedangkan data grafik hanya
 * berubah ±2 Hz. Tanpa memo, recharts menggambar ulang SVG 20×/detik pada kecepatan 20×.
 */
export const MweriChart = memo(function MweriChart({ points }: { points: readonly ChartPoint[] }) {
  return (
    <div className="h-36" role="img" aria-label="Grafik MWERI terhadap waktu dengan proyeksi Digital Twin">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points as ChartPoint[]} margin={{ top: 14, right: 6, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={COLOR.line} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: COLOR.lineStrong }}
            tickFormatter={(v: number) => `${Math.round(v)}m`}
            tickCount={4}
          />
          <YAxis domain={[0, 10]} ticks={[0, 4, 8]} tick={AXIS} tickLine={false} axisLine={false} />
          <ReferenceLine
            y={DIGITAL_TWIN.mweriCritical}
            stroke={COLOR.critical}
            strokeOpacity={0.6}
            strokeDasharray="4 4"
            label={{ value: UI.mweri.threshold, position: 'insideTopLeft', fill: COLOR.critical, fontSize: 12, dy: -12 }}
          />
          <Line
            dataKey="mweri"
            stroke={COLOR.accent}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="proj"
            stroke={COLOR.critical}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
