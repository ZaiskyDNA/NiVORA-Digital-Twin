/**
 * Pengukur performa (hanya mode dev): draw calls & segitiga per frame (total semua pass, termasuk
 * EffectComposer) dan fps rata-rata per detik → `window.__nivoraPerf`.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export interface PerfSample {
  fps: number;
  /** Jumlah useFrame (frame R3F) sejak awal — pembanding untuk `renders`. */
  frames: number;
  /** Jumlah pemanggilan scene render (RenderPass) sejak awal. */
  renders: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
}

declare global {
  interface Window {
    __nivoraPerf?: PerfSample;
  }
}

export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ frames: 0, since: 0 });

  const scene = useThree((s) => s.scene);

  useEffect(() => {
    // Info dikumpulkan lintas semua render dalam satu frame, lalu di-reset manual.
    gl.info.autoReset = false;
    // Hitung render scene (bukan pass layar penuh) untuk mendeteksi frame yang dirender ganda.
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = (...args) => {
      const sample = window.__nivoraPerf;
      if (sample) sample.renders += 1;
      prev.apply(scene, args);
    };
    return () => {
      gl.info.autoReset = true;
      scene.onBeforeRender = prev;
    };
  }, [gl, scene]);

  useFrame(() => {
    const r = gl.info.render;
    const sample = (window.__nivoraPerf ??= { fps: 0, frames: 0, renders: 0, calls: 0, triangles: 0, points: 0, lines: 0 });
    sample.frames += 1;
    sample.calls = r.calls;
    sample.triangles = r.triangles;
    sample.points = r.points;
    sample.lines = r.lines;
    gl.info.reset();

    const a = acc.current;
    const now = performance.now();
    if (a.since === 0) a.since = now;
    a.frames += 1;
    if (now - a.since >= 1000) {
      sample.fps = Math.round((a.frames * 1000) / (now - a.since));
      a.frames = 0;
      a.since = now;
    }
  });
  return null;
}
