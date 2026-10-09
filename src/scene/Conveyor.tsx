/** Conveyor: belt miring bersegmen + rangka + kaki penyangga (§6). Material bergerak di Fase 4. */
import { useMemo } from 'react';
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { Conveyor as ConveyorData } from '../config/plant';
import { SCENE } from './palette';

const WIDTH = 1.3;
const SEGMENT = 1.1;

export function Conveyor({ data }: { data: ConveyorData }) {
  const geo = useMemo(() => {
    const a = new Vector3(...data.from);
    const b = new Vector3(...data.to);
    const dir = b.clone().sub(a);
    const length = dir.length();
    // Basis eksplisit: X = arah belt, Y = "atas" belt (tegak lurus belt, condong ke +Y dunia).
    // setFromUnitVectors bisa memutar 180° pada sumbu sembarang untuk arah −x dan membalik belt.
    const xAxis = dir.clone().normalize();
    const zAxis = new Vector3().crossVectors(xAxis, new Vector3(0, 1, 0)).normalize();
    const yAxis = new Vector3().crossVectors(zAxis, xAxis).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xAxis, yAxis, zAxis));
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const segments = Math.max(1, Math.floor(length / SEGMENT));
    const legs = [0.15, 0.5, 0.85].map((t) => a.clone().lerp(b, t));
    return { length, q, mid, segments, legs };
  }, [data]);

  return (
    <group>
      <group position={geo.mid} quaternion={geo.q}>
        {/* Rangka */}
        <mesh castShadow>
          <boxGeometry args={[geo.length, 0.35, WIDTH + 0.25]} />
          <meshStandardMaterial color={SCENE.conveyorFrame} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Pelat belt bersegmen seperti pada referensi */}
        {Array.from({ length: geo.segments }, (_, i) => (
          <mesh key={i} position={[-geo.length / 2 + (i + 0.5) * (geo.length / geo.segments), 0.22, 0]}>
            <boxGeometry args={[(geo.length / geo.segments) * 0.86, 0.08, WIDTH]} />
            <meshStandardMaterial color={SCENE.conveyorBelt} roughness={0.5} metalness={0.1} />
          </mesh>
        ))}
      </group>
      {geo.legs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]} castShadow>
          <boxGeometry args={[0.25, p.y, 0.25]} />
          <meshStandardMaterial color={SCENE.conveyorFrame} roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
