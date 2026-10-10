/**
 * Truk pengangkut residu yang mengikuti path hasil Dijkstra (task.legs) (§7).
 * Slot truk dialokasikan sekali (= HAULING.fleet); posisi dihitung di useFrame sebagai parameter
 * `u = ruas + progres/D` yang diinterpolasi antar-tick lalu dievaluasi pada polyline — truk
 * berbelok tepat di simpang. Tanpa alokasi per frame.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { HAULING } from '../config/plant';
import type { Task } from '../sim/types';
import { VERTEX_POS } from './layout';
import { hdr } from './palette';
import { lerp, simFrame, tickAlpha } from './simFrame';
import { useScenePalette } from './useScenePalette';

const Y = 0.05;

/** Parameter posisi di sepanjang legs (0 = awal ruas pertama). */
function paramOf(t: Task): number {
  if (t.loadingMin > 0) return 0;
  const leg = t.legs[t.leg];
  if (!leg) return t.legs.length;
  return t.leg + (leg.D > 0 ? t.legProgress / leg.D : 0);
}

/** Dua task punya rencana rute yang sama (aman untuk interpolasi). */
function sameLegs(a: Task, b: Task): boolean {
  if (a.legs.length !== b.legs.length) return false;
  for (let i = 0; i < a.legs.length; i++) if (a.legs[i]?.edgeId !== b.legs[i]?.edgeId) return false;
  return true;
}

function findTask(tasks: readonly Task[], id: number): Task | undefined {
  for (let i = 0; i < tasks.length; i++) if (tasks[i]?.id === id) return tasks[i];
  return undefined;
}

function Truck({ slot }: { slot: number }) {
  const group = useRef<Group>(null);
  const load = useRef<Mesh>(null);
  const pal = useScenePalette();
  // Tema gelap: HDR → Bloom. Tema terang: warna pekat tanpa cahaya.
  const lightColor = useMemo(() => hdr(pal.safe, pal.bloom.truckLight), [pal]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const task = simFrame.curr.tasks[slot];
    if (!task || task.legs.length === 0) {
      g.visible = false;
      return;
    }
    const before = findTask(simFrame.prev.tasks, task.id);
    const uNow = paramOf(task);
    const uPrev = before && sameLegs(before, task) ? paramOf(before) : uNow;
    const u = Math.min(lerp(uPrev, uNow, tickAlpha(performance.now())), task.legs.length - 1e-6);

    const i = Math.floor(u);
    const f = u - i;
    const leg = task.legs[i];
    const a = leg && VERTEX_POS[leg.from];
    const b = leg && VERTEX_POS[leg.to];
    if (!a || !b) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(lerp(a[0], b[0], f), Y, lerp(a[2], b[2], f));
    g.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
    // Bak terisi setelah selesai muat.
    if (load.current) load.current.visible = task.loadingMin <= 0;
  });

  return (
    <group ref={group} visible={false}>
      {/* Bak & sasis (sumbu +Z = arah maju) */}
      <mesh position={[0, 0.75, -0.4]} castShadow>
        <boxGeometry args={[1.7, 1, 2.8]} />
        <meshStandardMaterial color={pal.truck.body} roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh ref={load} position={[0, 1.38, -0.4]}>
        <boxGeometry args={[1.45, 0.35, 2.5]} />
        <meshStandardMaterial color={pal.truck.load} roughness={1} flatShading />
      </mesh>
      {/* Kabin */}
      <mesh position={[0, 1, 1.45]} castShadow>
        <boxGeometry args={[1.6, 1.5, 0.95]} />
        <meshStandardMaterial color={pal.truck.cab} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Lampu depan (HDR → Bloom) */}
      <mesh position={[0, 0.7, 1.95]}>
        <boxGeometry args={[1.3, 0.18, 0.05]} />
        <meshBasicMaterial color={lightColor} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function HaulTrucks() {
  return (
    <group>
      {Array.from({ length: HAULING.fleet }, (_, slot) => (
        <Truck key={slot} slot={slot} />
      ))}
    </group>
  );
}
