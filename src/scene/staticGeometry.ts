/**
 * Geometri statis pabrik digabung agar draw call minimal (§13.8):
 * - semua kotak fasilitas + conveyor → SATU BufferGeometry dengan warna per-vertex
 *   (muka atas lebih terang), dirender sebagai satu mesh;
 * - semua tepi menyala → satu daftar segmen (dirender sebagai satu LineSegments2).
 * Komposisi bentuk (cerobong smelter, undakan stockpile, lubang disposal, belt bersegmen)
 * sama dengan Fase 3 — hanya cara render yang berubah.
 */
import {
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
  Color,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONVEYORS, FACILITIES, type Facility } from '../config/plant';
import type { Vec3 } from '../sim/types';
import { FACILITY_STYLE, SCENE, type FacilityStyle } from './palette';

export interface BoxSpec {
  size: Vec3;
  position: Vec3;
  quaternion?: Quaternion;
  body: string;
  top: string;
  /** Warna tepi; null = tanpa garis tepi. */
  edge: string | null;
  /** Kecerahan garis tepi samping/bawah relatif terhadap tepi atas (meniru opacity). */
  edgeDim?: number;
}

const box = (size: Vec3, position: Vec3, style: FacilityStyle, edgeDim = 0.5): BoxSpec => ({
  size,
  position,
  body: style.body,
  top: style.top,
  edge: style.edge,
  edgeDim,
});

/** Kotak-kotak penyusun satu fasilitas (koordinat dunia). */
function facilityBoxes(f: Facility): BoxSpec[] {
  const style = FACILITY_STYLE[f.kind];
  const [x, , z] = f.position;
  const [w, h, d] = f.size;
  switch (f.kind) {
    case 'stockpile': {
      const tiers = 4;
      const th = h / tiers;
      return Array.from({ length: tiers }, (_, i) => {
        const k = 1 - i * 0.22;
        return box([w * k, th, d * k], [x, th * (i + 0.5), z], style);
      });
    }
    case 'disposal': {
      const rim = 0.6;
      return [
        box([w, 0.5, rim], [x, 0.25, z - d / 2 + rim / 2], style),
        box([w, 0.5, rim], [x, 0.25, z + d / 2 - rim / 2], style),
        box([rim, 0.5, d - 2 * rim], [x - w / 2 + rim / 2, 0.25, z], style),
        box([rim, 0.5, d - 2 * rim], [x + w / 2 - rim / 2, 0.25, z], style),
        box([w * 0.45, 0.6, d * 0.18], [x - w * 0.12, 0.3, z + d * 0.08], style, 0.35),
        // Dasar lubang: pelat gelap tipis tanpa tepi.
        { size: [w - rim, 0.04, d - rim], position: [x, 0.03, z], body: '#1f1611', top: '#1f1611', edge: null },
      ];
    }
    case 'smelter': {
      const stack: FacilityStyle = { body: '#1d2840', top: '#2a3858', edge: style.edge };
      return [
        box([w, h, d], [x, h / 2, z], style),
        box([1.6, h * 0.75, 1.6], [x - w * 0.3, h + (h * 0.75) / 2, z - d * 0.15], stack),
        box([1.6, h * 0.55, 1.6], [x - w * 0.08, h + (h * 0.55) / 2, z + d * 0.05], stack),
      ];
    }
    case 'crusher':
      return [
        box([w, h * 0.7, d], [x, (h * 0.7) / 2, z], style),
        box([w * 0.6, h * 0.3, d * 0.6], [x, h * 0.7 + (h * 0.3) / 2, z], style),
      ];
    default:
      return [box([w, h, d], [x, h / 2, z], style)];
  }
}

const CONVEYOR_WIDTH = 1.3;
const CONVEYOR_SEGMENT = 1.1;

/** Rangka, pelat belt bersegmen, dan kaki penyangga conveyor (koordinat dunia). */
function conveyorBoxes(): BoxSpec[] {
  const out: BoxSpec[] = [];
  const up = new Vector3(0, 1, 0);
  for (const c of CONVEYORS) {
    const a = new Vector3(...c.from);
    const b = new Vector3(...c.to);
    const dir = b.clone().sub(a);
    const length = dir.length();
    // Basis eksplisit agar belt selalu menghadap ke atas (lihat Fase 3).
    const xAxis = dir.clone().normalize();
    const zAxis = new Vector3().crossVectors(xAxis, up).normalize();
    const yAxis = new Vector3().crossVectors(zAxis, xAxis).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xAxis, yAxis, zAxis));
    const mid = a.clone().add(b).multiplyScalar(0.5);

    out.push({
      size: [length, 0.35, CONVEYOR_WIDTH + 0.25],
      position: [mid.x, mid.y, mid.z],
      quaternion: q,
      body: SCENE.conveyorFrame,
      top: SCENE.conveyorFrame,
      edge: null,
    });
    const segments = Math.max(1, Math.floor(length / CONVEYOR_SEGMENT));
    const seg = length / segments;
    for (let i = 0; i < segments; i++) {
      const p = a.clone().addScaledVector(xAxis, (i + 0.5) * seg).addScaledVector(yAxis, 0.22);
      out.push({
        size: [seg * 0.86, 0.08, CONVEYOR_WIDTH],
        position: [p.x, p.y, p.z],
        quaternion: q,
        body: SCENE.conveyorBelt,
        top: SCENE.conveyorBelt,
        edge: null,
      });
    }
    for (const t of [0.15, 0.5, 0.85]) {
      const p = a.clone().lerp(b, t);
      out.push({
        size: [0.25, p.y, 0.25],
        position: [p.x, p.y / 2, p.z],
        body: SCENE.conveyorFrame,
        top: SCENE.conveyorFrame,
        edge: null,
      });
    }
  }
  return out;
}

export const STATIC_BOXES: readonly BoxSpec[] = [...FACILITIES.flatMap(facilityBoxes), ...conveyorBoxes()];

const matrixOf = (s: BoxSpec): Matrix4 =>
  new Matrix4().compose(new Vector3(...s.position), s.quaternion ?? new Quaternion(), new Vector3(1, 1, 1));

/** Satu geometri berwarna per-vertex untuk semua kotak statis. */
export function buildStaticMesh(specs: readonly BoxSpec[]): BufferGeometry {
  const top = new Color();
  const body = new Color();
  const parts = specs.map((s) => {
    const g = new BoxGeometry(...s.size);
    top.set(s.top);
    body.set(s.body);
    const normals = g.getAttribute('normal');
    const colors = new Float32Array(normals.count * 3);
    for (let i = 0; i < normals.count; i++) {
      const c = normals.getY(i) > 0.5 ? top : body;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    g.applyMatrix4(matrixOf(s));
    return g;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('Gagal menggabungkan geometri statis');
  return merged;
}

/** Segmen garis tepi (pasangan titik) + warna per titik; tepi atas penuh, lainnya diredupkan. */
export function buildEdgeSegments(specs: readonly BoxSpec[]): { points: Vec3[]; colors: [number, number, number][] } {
  const points: Vec3[] = [];
  const colors: [number, number, number][] = [];
  const c = new Color();
  const v = new Vector3();
  for (const s of specs) {
    if (!s.edge) continue;
    const m = matrixOf(s);
    const [hx, hy, hz] = [s.size[0] / 2, s.size[1] / 2, s.size[2] / 2];
    const corner = (sx: number, sy: number, sz: number): Vec3 => {
      v.set(sx * hx, sy * hy, sz * hz).applyMatrix4(m);
      return [v.x, v.y, v.z];
    };
    const ring = (sy: number): Vec3[] => [corner(-1, sy, -1), corner(1, sy, -1), corner(1, sy, 1), corner(-1, sy, 1)];
    const topRing = ring(1);
    const bottomRing = ring(-1);
    const bright = c.set(s.edge).toArray() as [number, number, number];
    const dim = c
      .set(s.edge)
      .multiplyScalar(s.edgeDim ?? 0.5)
      .toArray() as [number, number, number];
    const push = (a: Vec3, b: Vec3, col: [number, number, number]) => {
      points.push(a, b);
      colors.push(col, col);
    };
    for (let i = 0; i < 4; i++) {
      push(topRing[i] as Vec3, topRing[(i + 1) % 4] as Vec3, bright);
      push(bottomRing[i] as Vec3, bottomRing[(i + 1) % 4] as Vec3, dim);
      push(topRing[i] as Vec3, bottomRing[i] as Vec3, dim);
    }
  }
  return { points, colors };
}

/** Jalan angkut: strip per edge + sambungan bulat per vertex → satu geometri. */
export function buildRoadGeometry(
  vertices: readonly { id: string; position: Vec3 }[],
  edges: readonly { from: string; to: string }[],
  width: number,
  y: number,
): BufferGeometry {
  const pos = new Map(vertices.map((v) => [v.id, v.position]));
  const parts: BufferGeometry[] = [];
  for (const e of edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const g = new PlaneGeometry(Math.hypot(dx, dz), width);
    g.rotateX(-Math.PI / 2);
    g.rotateY(-Math.atan2(dz, dx));
    g.translate((a[0] + b[0]) / 2, y, (a[2] + b[2]) / 2);
    parts.push(g);
  }
  for (const v of vertices) {
    const g = new CircleGeometry(width / 2, 16);
    g.rotateX(-Math.PI / 2);
    g.translate(v.position[0], y + 0.001, v.position[2]);
    parts.push(g);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('Gagal menggabungkan geometri jalan');
  return merged;
}
