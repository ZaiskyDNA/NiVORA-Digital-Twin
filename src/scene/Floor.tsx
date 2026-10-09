/** Lantai pabrik ±42 × ±30 dengan grid cyan tipis dan tepi menyala (§7). */
import { Grid, Line } from '@react-three/drei';
import { COLOR } from '../styles/tokens';
import { FLOOR_SIZE } from './layout';
import { SCENE } from './palette';

export function Floor() {
  const [w, d] = FLOOR_SIZE;
  const hw = w / 2;
  const hd = d / 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={COLOR.floor} roughness={0.95} metalness={0} />
      </mesh>
      <Grid
        position-y={0.006}
        args={[w, d]}
        cellSize={2}
        cellThickness={0.6}
        cellColor={SCENE.gridCell}
        sectionSize={10}
        sectionThickness={1}
        sectionColor={SCENE.gridSection}
        fadeDistance={400}
        fadeStrength={0}
      />
      <Line
        points={[
          [-hw, 0.02, -hd],
          [hw, 0.02, -hd],
          [hw, 0.02, hd],
          [-hw, 0.02, hd],
          [-hw, 0.02, -hd],
        ]}
        color={SCENE.floorEdge}
        lineWidth={1.5}
        toneMapped={false}
      />
    </group>
  );
}
