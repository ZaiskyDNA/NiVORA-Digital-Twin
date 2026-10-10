/** Jalan angkut mengikuti graf rute — digabung menjadi satu geometri (1 draw call). */
import { useEffect, useMemo } from 'react';
import { ROUTE_GRAPH } from '../config/plant';
import { buildRoadGeometry } from './staticGeometry';
import { useScenePalette } from './useScenePalette';

const WIDTH = 2;
const Y = 0.012;

export function Roads() {
  const pal = useScenePalette();
  const geometry = useMemo(() => buildRoadGeometry(ROUTE_GRAPH.vertices, ROUTE_GRAPH.edges, WIDTH, Y), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={pal.road} roughness={1} />
    </mesh>
  );
}
