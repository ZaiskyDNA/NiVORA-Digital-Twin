import { describe, expect, it } from 'vitest';
import { NODE_SEEDS } from '../../config/plant';
import { createInitialState } from '../../sim/engine';
import { baseZoom, focusPose, mobileViewShift } from '../layout';
import { buildSceneLabels } from '../sceneLabels';

describe('tata letak ponsel (§13.16)', () => {
  const nodes = createInitialState().nodes;

  it('hanya pill node — tanpa label fasilitas, zona, atau kartu melayang', () => {
    const labels = buildSceneLabels(nodes, { mobile: true, selected: 'A', destination: 'reprocessing', autoCard: 'A' });
    expect(labels.map((l) => l.kind)).toEqual(nodes.map(() => 'pill'));
  });

  it('desktop tidak berubah: node terpilih tetap kartu, label tujuan & zona tetap ada', () => {
    const labels = buildSceneLabels(nodes, { selected: 'A', destination: 'reprocessing' });
    expect(labels.find((l) => l.id === 'node-A')?.kind).toBe('card');
    expect(labels.some((l) => l.id === 'facility-reprocessing')).toBe(true);
    expect(labels.some((l) => l.id === 'zone-wz-high')).toBe(true);
  });

  it('potret: scene lebih besar dari versi desktop pada ukuran layar yang sama', () => {
    expect(baseZoom(390, 844, true)).toBeGreaterThan(baseZoom(390, 844));
  });

  it('geser proyeksi: potret ke atas (lebih jauh saat detail terbuka), lanskap ke kanan', () => {
    expect(mobileViewShift(390, 844, false)).toEqual({ x: 0, y: 0.05 });
    expect(mobileViewShift(390, 844, true).y).toBeGreaterThan(0.05);
    expect(mobileViewShift(844, 390, true).x).toBeLessThan(0);
  });

  it('fokus node di ponsel menargetkan node itu sendiri (detail ada di sheet)', () => {
    const c = NODE_SEEDS.find((n) => n.id === 'C')!.position;
    expect(focusPose('C', true).target).toEqual([c[0], 3, c[2]]);
  });
});
