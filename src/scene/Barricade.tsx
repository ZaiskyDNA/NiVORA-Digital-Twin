/** Barikade 3D di tengah edge yang diblokir (skenario Route Disruption, §8). */
import { useMemo } from 'react';
import { ROUTE_GRAPH } from '../config/plant';
import { selectViewed, useSim } from '../store/useSim';
import { VERTEX_POS } from './layout';
import { useScenePalette } from './useScenePalette';

const WIDTH = 3;

export function Barricades() {
  const pal = useScenePalette();
  const ids = useSim((s) =>
    selectViewed(s)
      .graph.edges.filter((e) => e.disabled)
      .map((e) => e.id)
      .join(','),
  );
  const items = useMemo(
    () =>
      ids
        .split(',')
        .filter(Boolean)
        .flatMap((id) => {
          const e = ROUTE_GRAPH.edges.find((x) => x.id === id);
          const a = e && VERTEX_POS[e.from];
          const b = e && VERTEX_POS[e.to];
          if (!a || !b) return [];
          // Barikade melintang (tegak lurus arah jalan).
          const angle = Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2;
          return [{ id, x: (a[0] + b[0]) / 2, z: (a[2] + b[2]) / 2, angle }];
        }),
    [ids],
  );

  return (
    <group>
      {items.map((it) => (
        <group key={it.id} position={[it.x, 0, it.z]} rotation-y={it.angle}>
          {[-WIDTH / 2, WIDTH / 2].map((dx) => (
            <mesh key={dx} position={[dx, 0.6, 0]} castShadow>
              <boxGeometry args={[0.2, 1.2, 0.2]} />
              <meshStandardMaterial color={pal.barricade.post} />
            </mesh>
          ))}
          {/* Palang bergaris merah-putih */}
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[-WIDTH / 2 + (i + 0.5) * (WIDTH / 6), 1, 0]} castShadow>
              <boxGeometry args={[WIDTH / 6, 0.32, 0.14]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? pal.critical : pal.barricade.light}
                emissive={pal.critical}
                emissiveIntensity={i % 2 === 0 ? 0.4 : 0}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
