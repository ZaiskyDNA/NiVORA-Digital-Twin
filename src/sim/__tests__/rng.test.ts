import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed, nextFloat, nextInt, nextNormal } from '../rng';

const take = (seed: number, k: number) => {
  const r = createRng(seed);
  return Array.from({ length: k }, () => nextFloat(r));
};

describe('mulberry32', () => {
  it('reproducible untuk seed yang sama, berbeda untuk seed lain', () => {
    expect(take(42, 5)).toEqual(take(42, 5));
    expect(take(42, 5)).not.toEqual(take(43, 5));
  });

  it('nilai di [0, 1) dengan rata-rata ≈ 0.5', () => {
    const xs = take(1, 10_000);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.02);
  });

  it('nextInt inklusif di kedua ujung', () => {
    const r = createRng(3);
    const seen = new Set(Array.from({ length: 500 }, () => nextInt(r, 1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('nextNormal ≈ N(0, 1)', () => {
    const r = createRng(9);
    const xs = Array.from({ length: 10_000 }, () => nextNormal(r));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.abs(variance - 1)).toBeLessThan(0.08);
  });

  it('stream turunan saling berbeda', () => {
    expect(deriveSeed(1, 1)).not.toBe(deriveSeed(1, 2));
    expect(take(deriveSeed(1, 1), 3)).not.toEqual(take(deriveSeed(1, 2), 3));
  });
});
