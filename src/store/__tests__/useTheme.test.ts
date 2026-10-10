import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from '../useTheme';

describe('tema awal', () => {
  it('default gelap bila tidak ada pilihan & sistem tidak meminta terang', () => {
    expect(resolveInitialTheme(null, false)).toBe('dark');
  });
  it('mengikuti prefers-color-scheme hanya bila belum ada pilihan tersimpan', () => {
    expect(resolveInitialTheme(null, true)).toBe('light');
    expect(resolveInitialTheme('dark', true)).toBe('dark');
    expect(resolveInitialTheme('light', false)).toBe('light');
  });
});
