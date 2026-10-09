/** Garis penunjuk semua label (satu LineSegments2) + proyeksi posisi label DOM setiap frame. */
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color } from 'three';
import type { Vec3 } from '../sim/types';
import { projectLabels } from './labelRegistry';
import { useSceneLabels } from './useSceneLabels';

/** Redupkan warna garis (meniru opacity 0.55 di atas latar gelap — satu material untuk semua). */
const DIM = 0.6;

export function LabelLeaders() {
  const labels = useSceneLabels();
  useFrame(({ camera, size }) => projectLabels(labels, camera, size.width, size.height));

  const segments = useMemo(() => {
    const points: Vec3[] = [];
    const colors: [number, number, number][] = [];
    const c = new Color();
    for (const l of labels) {
      const rgb = c.set(l.color).multiplyScalar(DIM).toArray() as [number, number, number];
      points.push(l.anchor, l.at);
      colors.push(rgb, rgb);
    }
    return { points, colors };
  }, [labels]);

  if (segments.points.length === 0) return null;
  return <Line segments points={segments.points} vertexColors={segments.colors} lineWidth={1} toneMapped={false} />;
}
