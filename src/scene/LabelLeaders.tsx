/** Garis penunjuk label (3D) + proyeksi posisi label DOM setiap frame. */
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { projectLabels } from './labelRegistry';
import type { SceneLabel } from './sceneLabels';

export function LabelLeaders({ labels }: { labels: readonly SceneLabel[] }) {
  useFrame(({ camera, size }) => projectLabels(labels, camera, size.width, size.height));
  return (
    <group>
      {labels.map((l) => (
        <Line
          key={l.id}
          points={[l.anchor, l.at]}
          color={l.color}
          lineWidth={1}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      ))}
    </group>
  );
}
