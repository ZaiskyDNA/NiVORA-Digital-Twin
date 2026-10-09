/**
 * Mirror warna token untuk scene 3D (three.js tidak membaca CSS).
 * Sumber kebenaran tetap src/styles/tokens.css — test `tokens.test.ts` menjaga keduanya sinkron.
 */
export const COLOR = {
  canvas: '#070c16',
  canvasGlow: '#13233b',
  floor: '#1b2c45',
  surface0: '#0b1424',
  surface1: '#111e33',
  surface2: '#172a45',
  line: '#1d2e48',
  lineStrong: '#2a4266',
  fg: '#e8f0fc',
  fg2: '#a9bad3',
  normal: '#2bd99f',
  warning: '#ffb020',
  critical: '#ff4d5e',
  high: '#ff7a3d',
  safe: '#22e1ff',
  accent: '#6fb6ff',
  worker: '#f2a33a',
} as const;

export type ColorToken = keyof typeof COLOR;

/** camelCase → nama variabel CSS (surface0 → --color-surface-0). */
export const cssVarOf = (key: ColorToken): string =>
  `--color-${key.replace(/([A-Z])/g, '-$1').replace(/(\d+)/g, '-$1').toLowerCase()}`;
