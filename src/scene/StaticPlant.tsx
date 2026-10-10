/**
 * Seluruh bangunan & conveyor statis: satu mesh berwarna per-vertex + satu LineSegments2 untuk
 * semua tepi menyala (gaya digital twin pada referensi) → 2 draw call (+1 di shadow pass).
 */
import { Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { buildEdgeSegments, buildStaticBoxes, buildStaticMesh } from './staticGeometry';
import { useScenePalette } from './useScenePalette';

export function StaticPlant() {
  const pal = useScenePalette();
  // Warna per-vertex → geometri dibangun ulang saat tema berganti (jarang).
  const boxes = useMemo(() => buildStaticBoxes(pal), [pal]);
  const geometry = useMemo(() => buildStaticMesh(boxes), [boxes]);
  const edges = useMemo(() => buildEdgeSegments(boxes), [boxes]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.75} metalness={0.05} flatShading />
      </mesh>
      <Line key={pal.theme} segments points={edges.points} vertexColors={edges.colors} lineWidth={1.4} toneMapped={false} />
    </group>
  );
}
