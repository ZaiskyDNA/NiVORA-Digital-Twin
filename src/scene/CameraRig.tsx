/**
 * Kamera ortografis isometrik + OrbitControls dengan batas polar (tidak bisa masuk ke bawah lantai),
 * dan preset Overview / Fokus Node A / Rute dengan transisi halus (§7).
 */
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type ComponentRef } from 'react';
import { MathUtils, Vector3 } from 'three';
import { useView } from '../store/useView';
import { baseZoom, CAMERA_PRESETS_POSE, cameraPosition, FLOOR_SIZE, focusPose } from './layout';

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

const LIMITS = {
  minPolar: 0.12,
  maxPolar: MathUtils.degToRad(68),
  /** Relatif terhadap zoom dasar. */
  minZoom: 0.7,
  maxZoom: 5,
};

/** Laju damping transisi preset (lebih besar = lebih cepat). */
const LAMBDA = 3.2;

interface Goal {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  // Kamera diambil lewat get()/state saat dipakai — bukan nilai render yang dimutasi.
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const base = baseZoom(width, height);
  const goal = useRef<Goal | null>(null);

  const nonce = useView((s) => s.presetNonce);
  const preset = useView((s) => s.preset);
  const selected = useView((s) => s.selected);

  useEffect(() => {
    const p = preset === 'focus' && selected ? focusPose(selected) : CAMERA_PRESETS_POSE[preset === 'focus' ? 'overview' : preset];
    const next: Goal = {
      position: new Vector3(...cameraPosition(p)),
      target: new Vector3(...p.target),
      zoom: base * p.zoom,
    };
    const { camera } = get();
    const c = controls.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (c && (reduced || nonce === 0)) {
      // Posisi awal & reduced motion: langsung lompat tanpa animasi.
      camera.position.copy(next.position);
      camera.zoom = next.zoom;
      camera.updateProjectionMatrix();
      c.target.copy(next.target);
      c.update();
      goal.current = null;
    } else {
      goal.current = next;
    }
  }, [preset, selected, nonce, get, base]);

  useFrame(({ camera }, dt) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const d = Math.min(dt, 0.1);
    camera.position.set(
      MathUtils.damp(camera.position.x, g.position.x, LAMBDA, d),
      MathUtils.damp(camera.position.y, g.position.y, LAMBDA, d),
      MathUtils.damp(camera.position.z, g.position.z, LAMBDA, d),
    );
    c.target.set(
      MathUtils.damp(c.target.x, g.target.x, LAMBDA, d),
      MathUtils.damp(c.target.y, g.target.y, LAMBDA, d),
      MathUtils.damp(c.target.z, g.target.z, LAMBDA, d),
    );
    camera.zoom = MathUtils.damp(camera.zoom, g.zoom, LAMBDA, d);
    camera.updateProjectionMatrix();
    c.update();
    const done =
      camera.position.distanceTo(g.position) < 0.05 &&
      c.target.distanceTo(g.target) < 0.05 &&
      Math.abs(camera.zoom - g.zoom) < 0.01;
    if (done) goal.current = null;
  });

  const [w, d] = FLOOR_SIZE;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={LIMITS.minPolar}
      maxPolarAngle={LIMITS.maxPolar}
      minZoom={base * LIMITS.minZoom}
      maxZoom={base * LIMITS.maxZoom}
      screenSpacePanning={false}
      // Interaksi pengguna membatalkan transisi preset yang sedang berjalan.
      onStart={() => {
        goal.current = null;
      }}
      onChange={(e) => {
        // Titik orbit tidak boleh keluar dari lantai.
        const t = e?.target.target;
        if (!t) return;
        t.x = MathUtils.clamp(t.x, -w / 2, w / 2);
        t.z = MathUtils.clamp(t.z, -d / 2, d / 2);
        t.y = MathUtils.clamp(t.y, 0, 10);
      }}
    />
  );
}
