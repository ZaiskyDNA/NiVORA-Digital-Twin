/**
 * Figur pekerja: satu InstancedMesh untuk semua zona (§13.8). Jumlah per zona mengikuti
 * `workers` node (berbasis zona, tanpa identitas); tiap figur berjalan acak di dalam zonanya.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Object3D, type InstancedMesh } from 'three';
import { NODE_SEEDS, WORKER_ZONES } from '../config/plant';
import { createRng, nextFloat } from '../sim/rng';
import { COLOR } from '../styles/tokens';
import { simFrame } from './simFrame';

const HEIGHT = 2; // tinggi figur (unit dunia)
const SPEED = 1.1; // unit/detik nyata
const MARGIN = 0.6;

interface Slot {
  zone: number; // indeks WORKER_ZONES
  rank: number; // urutan di dalam zona — tampil bila rank < workers
  node: number; // indeks node pemilik zona
}

export function Workers() {
  const mesh = useRef<InstancedMesh>(null);

  const sim = useMemo(() => {
    const slots: Slot[] = [];
    WORKER_ZONES.forEach((z, zi) => {
      const node = NODE_SEEDS.findIndex((n) => n.zoneId === z.id);
      const cap = node >= 0 ? (NODE_SEEDS[node]?.maxWorkersZone ?? 0) : 0;
      for (let r = 0; r < cap; r++) slots.push({ zone: zi, rank: r, node });
    });
    const n = slots.length;
    const rng = createRng(4242);
    const pos = new Float32Array(n * 2);
    const target = new Float32Array(n * 2);
    const vis = new Float32Array(n); // 0..1 — animasi muncul/hilang
    const heading = new Float32Array(n); // arah hadap per figur (dummy dipakai bersama)
    const pick = (i: number, out: Float32Array) => {
      const z = WORKER_ZONES[slots[i]?.zone ?? 0];
      if (!z) return;
      out[i * 2] = z.center[0] + (nextFloat(rng) - 0.5) * (z.size[0] - MARGIN * 2);
      out[i * 2 + 1] = z.center[2] + (nextFloat(rng) - 0.5) * (z.size[1] - MARGIN * 2);
    };
    for (let i = 0; i < n; i++) {
      pick(i, pos);
      pick(i, target);
    }
    return { slots, n, pos, target, vis, heading, pick, dummy: new Object3D() };
  }, []);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const d = Math.min(dt, 0.1);
    const move = simFrame.running ? SPEED * d : SPEED * d * 0.25;
    const { slots, n, pos, target, vis, heading, pick, dummy } = sim;
    for (let i = 0; i < n; i++) {
      const s = slots[i] as Slot;
      const workers = simFrame.curr.nodes[s.node]?.workers ?? 0;
      const want = s.rank < workers ? 1 : 0;
      vis[i] = (vis[i] as number) + (want - (vis[i] as number)) * (1 - Math.exp(-8 * d));

      const px = pos[i * 2] as number;
      const pz = pos[i * 2 + 1] as number;
      const dx = (target[i * 2] as number) - px;
      const dz = (target[i * 2 + 1] as number) - pz;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.15) {
        pick(i, target);
      } else {
        const step = Math.min(move, dist);
        pos[i * 2] = px + (dx / dist) * step;
        pos[i * 2 + 1] = pz + (dz / dist) * step;
        heading[i] = Math.atan2(dx, dz);
      }
      dummy.rotation.y = heading[i] as number;
      const v = vis[i] as number;
      dummy.position.set(pos[i * 2] as number, (HEIGHT / 2) * v, pos[i * 2 + 1] as number);
      dummy.scale.set(v, v, v);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, sim.n]} castShadow frustumCulled={false}>
      <capsuleGeometry args={[0.38, HEIGHT - 0.76, 3, 8]} />
      <meshStandardMaterial color={COLOR.worker} emissive={COLOR.worker} emissiveIntensity={0.25} roughness={0.6} />
    </instancedMesh>
  );
}
