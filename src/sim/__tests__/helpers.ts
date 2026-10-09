import { expect } from 'vitest';

/** Toleransi wajib §10 Fase 1. */
export const TOL = 1e-9;

export function expectNear(actual: number | null | undefined, expected: number, tol = TOL): void {
  expect(actual).not.toBeNull();
  expect(actual).not.toBeUndefined();
  expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(tol);
}
