/** Area lantai transparan zona pekerja; garis tepi putus-putus (§6–7). Figur pekerja di Fase 4. */
import { Line } from '@react-three/drei';
import type { Vec3 } from '../sim/types';
import { COLOR } from '../styles/tokens';

interface Props {
  id: string;
  center: Vec3;
  size: [number, number];
  /** Zona aktivitas tinggi ditonjolkan (merah); zona lain samar. */
  emphasis: boolean;
}

export function WorkerZone({ center, size, emphasis }: Props) {
  const [x, , z] = center;
  const [w, d] = size;
  const hw = w / 2;
  const hd = d / 2;
  const color = emphasis ? COLOR.critical : COLOR.worker;
  const y = 0.04;
  return (
    <group>
      <mesh position={[x, y, z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={color} transparent opacity={emphasis ? 0.16 : 0.07} depthWrite={false} />
      </mesh>
      <Line
        points={[
          [x - hw, y, z - hd],
          [x + hw, y, z - hd],
          [x + hw, y, z + hd],
          [x - hw, y, z + hd],
          [x - hw, y, z - hd],
        ]}
        color={color}
        lineWidth={1.5}
        dashed
        dashSize={0.6}
        gapSize={0.4}
        transparent
        opacity={emphasis ? 0.9 : 0.45}
        toneMapped={false}
      />
    </group>
  );
}
