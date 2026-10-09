/** Jalan angkut: satu strip datar per edge graf rute + sambungan bulat di setiap vertex. */
import { useMemo } from 'react';
import { ROUTE_GRAPH } from '../config/plant';
import { SCENE } from './palette';

const WIDTH = 2;
const Y = 0.012;

export function Roads() {
  const strips = useMemo(() => {
    const pos = new Map(ROUTE_GRAPH.vertices.map((v) => [v.id, v.position]));
    return ROUTE_GRAPH.edges.flatMap((e) => {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      if (!a || !b) return [];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      return [
        {
          id: e.id,
          center: [(a[0] + b[0]) / 2, Y, (a[2] + b[2]) / 2] as const,
          length: Math.hypot(dx, dz),
          angle: -Math.atan2(dz, dx),
        },
      ];
    });
  }, []);

  return (
    <group>
      {strips.map((s) => (
        <mesh key={s.id} position={s.center} rotation={[-Math.PI / 2, 0, s.angle]} receiveShadow>
          <planeGeometry args={[s.length, WIDTH]} />
          <meshStandardMaterial color={SCENE.road} roughness={1} />
        </mesh>
      ))}
      {ROUTE_GRAPH.vertices.map((v) => (
        <mesh key={v.id} position={[v.position[0], Y + 0.001, v.position[2]]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[WIDTH / 2, 20]} />
          <meshStandardMaterial color={SCENE.road} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
