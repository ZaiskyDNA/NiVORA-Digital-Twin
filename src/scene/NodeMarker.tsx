/**
 * Penanda node sensor: menara transfer / tiang + beacon emissive (Bloom) + 3 ring pulsa di lantai.
 * Warna & kecepatan pulsa mengikuti status Edge-AI secara live (§7). Semua update lewat ref di
 * useFrame — tanpa re-render React, tanpa alokasi per frame.
 */
import { Edges } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, type ComponentRef } from 'react';
import { Color, DoubleSide, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three';
import { NODE_MARKER } from '../config/plant';
import type { Vec3 } from '../sim/types';
import { COLOR } from '../styles/tokens';
import { beaconHeight, POLE, TOWER } from './layout';
import { BLOOM, PULSE_HZ, STATUS_COLOR } from './palette';
import { useView } from '../store/useView';
import { simFrame } from './simFrame';

const RING_BASE = 1.6;
const RING_SPREAD = 2.8; // skala maksimum ring saat memudar
const RINGS = 2; // declutter: ring ketiga dihapus
const COLOR_LAMBDA = 6;

interface Props {
  nodeId: string;
  /** Indeks node di SimState.nodes (urutan NODE_SEEDS) — hindari find() per frame. */
  index: number;
  position: Vec3;
}

type EdgesImpl = ComponentRef<typeof Edges>;

export function NodeMarker({ nodeId, index, position }: Props) {
  const [x, , z] = position;
  const isTower = NODE_MARKER[nodeId] !== 'pole';
  const top = beaconHeight(nodeId);

  const bodyMat = useRef<MeshStandardMaterial>(null);
  const edges = useRef<EdgesImpl>(null);
  const beacon = useRef<Mesh>(null);
  const beaconMat = useRef<MeshBasicMaterial>(null);
  const haloMat = useRef<MeshBasicMaterial>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const ringMats = useRef<(MeshBasicMaterial | null)[]>([]);

  // Objek kerja dialokasikan sekali per penanda.
  const work = useMemo(() => {
    const status = simFrame.curr.nodes[index]?.status ?? 'normal';
    return { color: new Color(STATUS_COLOR[status]), target: new Color(), phase: 0 };
  }, [index]);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useFrame((_, dt) => {
    const node = simFrame.curr.nodes[index];
    if (!node) return;
    const d = Math.min(dt, 0.1);

    work.target.set(STATUS_COLOR[node.status]);
    work.color.lerp(work.target, 1 - Math.exp(-COLOR_LAMBDA * d));
    const c = work.color;

    if (bodyMat.current) {
      bodyMat.current.color.copy(c);
      bodyMat.current.emissive.copy(c);
    }
    edges.current?.material.color.copy(c);
    beaconMat.current?.color.copy(c).multiplyScalar(BLOOM.beacon);
    haloMat.current?.color.copy(c);

    if (!reducedMotion) work.phase = (work.phase + d * PULSE_HZ[node.status]) % 1;
    const critical = node.status === 'critical';
    beacon.current?.scale.setScalar(critical ? 1 + 0.18 * Math.sin(work.phase * Math.PI * 2) : 1);

    for (let i = 0; i < RINGS; i++) {
      const p = reducedMotion ? i / RINGS : (work.phase + i / RINGS) % 1;
      rings.current[i]?.scale.setScalar(1 + p * (RING_SPREAD - 1));
      const m = ringMats.current[i];
      if (m) {
        m.color.copy(c);
        m.opacity = (1 - p) * (critical ? 0.75 : 0.5);
      }
    }
  });

  const selectNode = useView((s) => s.selectNode);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectNode(nodeId);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    document.body.style.cursor = '';
  };

  const initial = work.color;
  return (
    <group position={[x, 0, z]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {isTower ? (
        <mesh position-y={TOWER.h / 2} castShadow>
          <boxGeometry args={[TOWER.w, TOWER.h, TOWER.w]} />
          <meshStandardMaterial
            ref={bodyMat}
            color={initial}
            emissive={initial}
            emissiveIntensity={0.18}
            roughness={0.6}
            transparent
            opacity={0.88}
            flatShading
          />
          <Edges ref={edges} color={initial} lineWidth={1.2} toneMapped={false} />
        </mesh>
      ) : (
        <mesh position-y={POLE.h / 2} castShadow>
          <cylinderGeometry args={[POLE.r, POLE.r * 1.3, POLE.h, 8]} />
          <meshStandardMaterial
            ref={bodyMat}
            color={initial}
            emissive={initial}
            emissiveIntensity={0.25}
            roughness={0.5}
          />
        </mesh>
      )}

      {/* Beacon HDR → tertangkap Bloom */}
      <mesh ref={beacon} position-y={top}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshBasicMaterial ref={beaconMat} color={initial} toneMapped={false} />
      </mesh>
      <mesh position-y={top} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.75, 0.9, 32]} />
        <meshBasicMaterial color={COLOR.fg} toneMapped={false} side={DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Ring pulsa di lantai */}
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m;
          }}
          position-y={0.03 + i * 0.002}
          rotation-x={-Math.PI / 2}
        >
          <ringGeometry args={[RING_BASE - 0.1, RING_BASE, 48]} />
          <meshBasicMaterial
            ref={(m) => {
              ringMats.current[i] = m;
            }}
            color={initial}
            toneMapped={false}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh position-y={0.025} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[RING_BASE * RING_SPREAD, 48]} />
        <meshBasicMaterial ref={haloMat} color={initial} transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </group>
  );
}
