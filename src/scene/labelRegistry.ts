/**
 * Label DOM diposisikan langsung lewat transform setiap frame (tanpa re-render React, tanpa
 * satu React root per label seperti drei <Html>). Elemen didaftarkan oleh LabelLayer,
 * diproyeksikan oleh LabelProjector di dalam Canvas.
 */
import { Vector3, type Camera } from 'three';
import type { LabelAlign, SceneLabel } from './sceneLabels';

/** Geser elemen agar sisi yang sesuai menempel ke titik proyeksi. */
const ALIGN: Record<LabelAlign, string> = {
  above: 'translate(-50%, -100%)',
  below: 'translate(-50%, 0)',
  right: 'translate(0, -50%)',
  left: 'translate(-100%, -50%)',
};

const elements = new Map<string, HTMLElement>();
const binders = new Map<string, (el: HTMLElement | null) => void>();

/** Ref callback stabil per id. */
export function bindLabel(id: string): (el: HTMLElement | null) => void {
  let fn = binders.get(id);
  if (!fn) {
    fn = (el) => {
      if (el) elements.set(id, el);
      else elements.delete(id);
    };
    binders.set(id, fn);
  }
  return fn;
}

const v = new Vector3();

export function projectLabels(labels: readonly SceneLabel[], camera: Camera, width: number, height: number): void {
  for (const l of labels) {
    const el = elements.get(l.id);
    if (!el) continue;
    v.set(...l.at).project(camera);
    const visible = v.z > -1 && v.z < 1;
    el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) continue;
    const x = ((v.x + 1) / 2) * width;
    const y = ((1 - v.y) / 2) * height;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${ALIGN[l.align ?? 'above']}`;
  }
}
