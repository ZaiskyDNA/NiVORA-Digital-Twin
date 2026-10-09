/**
 * Target hover tak terlihat per fasilitas. Geometri bangunan digabung jadi satu mesh
 * (staticGeometry), jadi hover per fasilitas memerlukan kotak raycast terpisah. `visible={false}`:
 * tidak digambar (tanpa draw call) tetapi tetap ikut raycast R3F.
 */
import type { ThreeEvent } from '@react-three/fiber';
import { FACILITIES } from '../config/plant';
import { useView } from '../store/useView';

export function FacilityHitAreas() {
  const setHovered = useView((s) => s.setHoveredFacility);
  return (
    <group>
      {FACILITIES.map((f) => {
        const [w, h, d] = f.size;
        const height = f.kind === 'smelter' ? h * 1.75 : Math.max(h, 1);
        return (
          <mesh
            key={f.id}
            visible={false}
            position={[f.position[0], height / 2, f.position[2]]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(f.id);
            }}
            onPointerOut={() => setHovered(null)}
          >
            <boxGeometry args={[w, height, d]} />
          </mesh>
        );
      })}
    </group>
  );
}
