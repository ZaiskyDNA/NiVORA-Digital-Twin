/**
 * Seluruh bangunan & conveyor statis: satu mesh berwarna per-vertex + satu LineSegments2 untuk
 * semua tepi menyala (gaya digital twin pada referensi) → 2 draw call (+1 di shadow pass).
 */
import { Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { buildEdgeSegments, buildStaticMesh, STATIC_BOXES } from './staticGeometry';

export function StaticPlant() {
  const geometry = useMemo(() => buildStaticMesh(STATIC_BOXES), []);
  const edges = useMemo(() => buildEdgeSegments(STATIC_BOXES), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.75} metalness={0.05} flatShading />
      </mesh>
      <Line segments points={edges.points} vertexColors={edges.colors} lineWidth={1.4} toneMapped={false} />
    </group>
  );
}
