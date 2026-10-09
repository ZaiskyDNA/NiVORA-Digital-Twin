/**
 * Pemetaan nada → kelas utility token (design-system §2.1). Nama kelas ditulis utuh agar
 * terdeteksi Tailwind. Teks merah selalu `critical-fg`; fill/glow memakai `critical`.
 */
import type { MweriClass, Status } from '../sim/types';

export interface Tone {
  text: string;
  fill: string;
  soft: string;
  border: string;
  glow: string;
}

export const STATUS_TONE: Record<Status, Tone> = {
  normal: {
    text: 'text-normal',
    fill: 'bg-normal',
    soft: 'bg-normal/16',
    border: 'border-normal',
    glow: 'shadow-glow-normal',
  },
  warning: {
    text: 'text-warning',
    fill: 'bg-warning',
    soft: 'bg-warning/16',
    border: 'border-warning',
    glow: 'shadow-glow-warning',
  },
  critical: {
    text: 'text-critical-fg',
    fill: 'bg-critical',
    soft: 'bg-critical/16',
    border: 'border-critical',
    glow: 'shadow-glow-critical',
  },
};

export const MWERI_TONE: Record<MweriClass, Tone> = {
  rendah: STATUS_TONE.normal,
  sedang: STATUS_TONE.warning,
  tinggi: {
    text: 'text-high',
    fill: 'bg-high',
    soft: 'bg-high/16',
    border: 'border-high',
    glow: 'shadow-glow-warning',
  },
  kritis: STATUS_TONE.critical,
};
