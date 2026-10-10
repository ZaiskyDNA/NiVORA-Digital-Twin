/** Garis penunjuk semua label (satu LineSegments2) + proyeksi posisi label DOM setiap frame. */
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color } from 'three';
import type { Vec3 } from '../sim/types';
import { projectLabels } from './labelRegistry';
import { useSceneLabels } from './useSceneLabels';
import { useScenePalette } from './useScenePalette';

/** Campur warna garis ke warna kanvas (meniru opacity ±0.6 — satu material untuk semua, di kedua tema). */
const MIX = 0.4;

export function LabelLeaders() {
  const labels = useSceneLabels();
  const pal = useScenePalette();
  useFrame(({ camera, size }) => projectLabels(labels, camera, size.width, size.height));

  const segments = useMemo(() => {
    const points: Vec3[] = [];
    const colors: [number, number, number][] = [];
    const c = new Color();
    const bg = new Color(pal.canvas);
    for (const l of labels) {
      const rgb = c.set(l.color).lerp(bg, MIX).toArray() as [number, number, number];
      points.push(l.anchor, l.at);
      colors.push(rgb, rgb);
    }
    return { points, colors };
  }, [labels, pal]);

  if (segments.points.length === 0) return null;
  return <Line key={pal.theme} segments points={segments.points} vertexColors={segments.colors} lineWidth={1} toneMapped={false} />;
}
