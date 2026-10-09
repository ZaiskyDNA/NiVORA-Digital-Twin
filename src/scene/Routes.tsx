/**
 * Rute rekomendasi (§7): terpendek = garis merah putus-putus; safe route = garis cyan tebal
 * menyala (HDR → Bloom) dengan dash bergerak. Re-render React hanya saat rute berganti.
 */
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ComponentRef } from 'react';
import type { SimState } from '../sim/engine';
import type { Vec3 } from '../sim/types';
import { selectViewed, useSim } from '../store/useSim';
import { COLOR } from '../styles/tokens';
import { ROUTE_Y, VERTEX_POS } from './layout';
import { BLOOM, hdr } from './palette';
import { simFrame } from './simFrame';

type LineImpl = ComponentRef<typeof Line>;

const SAFE_HDR = hdr(COLOR.safe, BLOOM.safeRoute);
const DASH_SPEED = 2.4; // unit dunia per detik

/** Kunci rute yang ditampilkan — string stabil agar selector tidak memicu render tiap tick. */
function routeKey(s: SimState): string {
  const rec = s.recommendation;
  return [s.policy, rec?.route?.vertices.join('>') ?? '', rec?.shortest?.vertices.join('>') ?? ''].join('|');
}

const toPoints = (vertices: string): Vec3[] =>
  vertices
    .split('>')
    .filter(Boolean)
    .map((id) => {
      const p = VERTEX_POS[id] ?? [0, 0, 0];
      return [p[0], ROUTE_Y, p[2]] as Vec3;
    });

export function Routes() {
  const key = useSim((s) => routeKey(selectViewed(s)));
  const [policy, chosen = '', shortest = ''] = key.split('|');
  const chosenPts = useMemo(() => toPoints(chosen), [chosen]);
  const shortestPts = useMemo(() => toPoints(shortest), [shortest]);

  // Mode reaktif memakai rute terpendek → tampil merah saja (bukan keputusan NiVORA).
  const showSafe = policy === 'nivora' && chosenPts.length > 1;
  const showShortest = shortestPts.length > 1 && (!showSafe || chosen !== shortest);

  const safeLine = useRef<LineImpl>(null);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useFrame((_, dt) => {
    const m = safeLine.current?.material;
    if (!m || reducedMotion) return;
    // Dash mengalir ke arah tujuan; lebih cepat saat simulasi berjalan.
    m.dashOffset -= Math.min(dt, 0.1) * DASH_SPEED * (simFrame.running ? 1 : 0.4);
  });

  return (
    <group>
      {showShortest && (
        <Line
          points={shortestPts}
          color={COLOR.critical}
          lineWidth={2.5}
          dashed
          dashSize={0.9}
          gapSize={0.7}
          transparent
          opacity={0.95}
          toneMapped={false}
          renderOrder={3}
        />
      )}
      {showSafe && (
        <>
          {/* Lapisan glow lebar di bawah garis utama */}
          <Line
            points={chosenPts}
            color={COLOR.safe}
            lineWidth={11}
            transparent
            opacity={0.16}
            depthWrite={false}
            toneMapped={false}
            renderOrder={3}
          />
          <Line
            ref={safeLine}
            points={chosenPts}
            color={SAFE_HDR}
            lineWidth={4}
            dashed
            dashSize={1.6}
            gapSize={0.55}
            toneMapped={false}
            renderOrder={4}
          />
        </>
      )}
    </group>
  );
}
