/**
 * Material bijih yang bergerak di atas conveyor: satu InstancedMesh untuk semua conveyor.
 * Kecepatan ∝ laju produksi skenario; berhenti saat simulasi dijeda.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Object3D, Vector3, type InstancedMesh } from 'three';
import { CONVEYORS } from '../config/plant';
import { SCENARIOS } from '../config/scenarios';
import { simFrame } from './simFrame';
import { useScenePalette } from './useScenePalette';

const PER_CONVEYOR = 9;
const BASE_SPEED = 0.07; // panjang conveyor per detik pada laju 1.0×
const LIFT = 0.42; // di atas pelat belt

export function ConveyorFlow() {
  const pal = useScenePalette();
  const mesh = useRef<InstancedMesh>(null);

  const data = useMemo(() => {
    const ends = CONVEYORS.map((c) => ({ a: new Vector3(...c.from), b: new Vector3(...c.to) }));
    return { ends, n: ends.length * PER_CONVEYOR, phase: { value: 0 }, dummy: new Object3D() };
  }, []);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const { ends, phase, dummy } = data;
    if (simFrame.running) {
      phase.value = (phase.value + Math.min(dt, 0.1) * BASE_SPEED * SCENARIOS[simFrame.curr.scenarioId].productionRate) % 1;
    }
    let i = 0;
    for (const { a, b } of ends) {
      for (let k = 0; k < PER_CONVEYOR; k++) {
        const t = (phase.value + k / PER_CONVEYOR) % 1;
        dummy.position.lerpVectors(a, b, t);
        dummy.position.y += LIFT;
        dummy.rotation.set(t * 9, t * 13, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i++, dummy.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, data.n]} frustumCulled={false}>
      <dodecahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color={pal.ore} roughness={0.9} flatShading />
    </instancedMesh>
  );
}
