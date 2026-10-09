/**
 * Debu partikulat di sekitar node: satu `Points` per node dengan buffer prealokasi (§13.8).
 * Gerak partikel dihitung di vertex shader dari seed per titik; CPU hanya mengatur
 * `drawRange` (jumlah ∝ PM), opacity, dan uniform waktu/zoom.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, type Points } from 'three';
import { createRng, nextFloat } from '../sim/rng';
import type { Vec3 } from '../sim/types';
import { DUST_COLOR } from './palette';
import { lerp, simFrame, tickAlpha } from './simFrame';

/** Partikel maksimum per node (PM = 10) — dikurangi ±40% saat declutter (dulu 260). */
const MAX = 156;

const vertexShader = /* glsl */ `
  attribute vec4 aSeed; // x: sudut, y: jari-jari 0..1, z: fase tinggi, w: kecepatan
  uniform float uTime;
  uniform float uRadius;
  uniform float uHeight;
  uniform float uSize;
  uniform float uPxPerUnit;
  varying float vFade;
  void main() {
    float h = fract(aSeed.z + uTime * aSeed.w);
    float ang = aSeed.x + uTime * 0.25 * aSeed.w + h * 1.6;
    float r = uRadius * (0.3 + 0.7 * aSeed.y) * (0.75 + 0.45 * h);
    vec3 p = vec3(cos(ang) * r, 0.4 + h * uHeight, sin(ang) * r);
    vFade = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.65, 1.0, h));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPxPerUnit * (0.55 + 0.9 * aSeed.y);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vFade * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface Props {
  index: number;
  position: Vec3;
  /** Tinggi kolom debu (mengikuti tinggi menara/tiang). */
  height: number;
  seed: number;
}

export function DustCloud({ index, position, height, seed }: Props) {
  const points = useRef<Points>(null);

  const { geometry, material } = useMemo(() => {
    const rng = createRng(seed);
    const seeds = new Float32Array(MAX * 4);
    for (let i = 0; i < MAX; i++) {
      seeds[i * 4] = nextFloat(rng) * Math.PI * 2;
      seeds[i * 4 + 1] = nextFloat(rng);
      seeds[i * 4 + 2] = nextFloat(rng);
      seeds[i * 4 + 3] = 0.05 + nextFloat(rng) * 0.08;
    }
    const g = new BufferGeometry();
    // Posisi dummy (semua di shader) — diperlukan agar three tahu jumlah vertex.
    g.setAttribute('position', new BufferAttribute(new Float32Array(MAX * 3), 3));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 4));
    g.setDrawRange(0, 0);
    const m = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 4.2 },
        uHeight: { value: height + 3 },
        uSize: { value: 0.9 },
        uPxPerUnit: { value: 10 },
        uColor: { value: new Color(DUST_COLOR) },
        uOpacity: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [seed, height]);

  useFrame(({ camera, gl }, dt) => {
    const prev = simFrame.prev.nodes[index];
    const curr = simFrame.curr.nodes[index];
    if (!curr) return;
    const pm = lerp(prev?.pm ?? curr.pm, curr.pm, tickAlpha(performance.now()));
    const k = Math.min(1, Math.max(0, pm / 10));
    // Kepadatan ∝ PM (kuadratik agar PM rendah benar-benar bersih).
    geometry.setDrawRange(0, Math.round(MAX * k * k));
    const u = material.uniforms;
    (u.uTime as { value: number }).value += Math.min(dt, 0.1) * (simFrame.running ? 1 : 0.3);
    (u.uOpacity as { value: number }).value = 0.12 + 0.38 * k;
    (u.uPxPerUnit as { value: number }).value = camera.zoom * gl.getPixelRatio();
  });

  return (
    <points
      ref={points}
      position={position}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
