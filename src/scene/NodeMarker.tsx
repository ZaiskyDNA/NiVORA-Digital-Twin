/**
 * Penanda node sensor: menara transfer / tiang + beacon menyala + 3 ring di lantai (§7).
 * Fase 3: statis (warna dari status saat ini). Pulsa & warna live menyusul di Fase 4.
 */
import { Edges } from '@react-three/drei';
import { DoubleSide } from 'three';
import { NODE_MARKER } from '../config/plant';
import type { NodeState } from '../sim/types';
import { COLOR } from '../styles/tokens';
import { beaconHeight, POLE, TOWER } from './layout';
import { STATUS_COLOR } from './palette';

const RINGS = [2.2, 3.2, 4.2];

export function NodeMarker({ node }: { node: NodeState }) {
  const color = STATUS_COLOR[node.status];
  const [x, , z] = node.position;
  const isTower = NODE_MARKER[node.id] !== 'pole';
  const top = beaconHeight(node.id);

  return (
    <group position={[x, 0, z]}>
      {isTower ? (
        <mesh position-y={TOWER.h / 2} castShadow>
          <boxGeometry args={[TOWER.w, TOWER.h, TOWER.w]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.18}
            roughness={0.6}
            transparent
            opacity={0.88}
            flatShading
          />
          <Edges color={color} lineWidth={1.2} toneMapped={false} />
        </mesh>
      ) : (
        <mesh position-y={POLE.h / 2} castShadow>
          <cylinderGeometry args={[POLE.r, POLE.r * 1.3, POLE.h, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.5} />
        </mesh>
      )}

      {/* Beacon */}
      <mesh position-y={top}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position-y={top} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial color={COLOR.fg} toneMapped={false} side={DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Ring di lantai (pulsa di Fase 4) */}
      {RINGS.map((r, i) => (
        <mesh key={r} position-y={0.03 + i * 0.001} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r - 0.12, r, 48]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.55 - i * 0.15} />
        </mesh>
      ))}
      <mesh position-y={0.025} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[RINGS[RINGS.length - 1] as number, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
