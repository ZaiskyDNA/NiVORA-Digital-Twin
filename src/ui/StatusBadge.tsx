/** StatusBadge (status sensor Edge-AI) & MweriBadge (kelas prioritas) — design-system §4.2. */
import { MWERI_CLASS_LABEL, STATUS_LABEL } from '../config/i18n';
import type { MweriClass, Status } from '../sim/types';
import { MWERI_TONE, STATUS_TONE } from './tone';

/** Bentuk status — status tidak pernah hanya lewat warna (●▲◆). */
export function StatusShape({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={`size-2 shrink-0 ${className}`} aria-hidden fill="currentColor">
      {status === 'normal' && <circle cx="4" cy="4" r="3.5" />}
      {status === 'warning' && <path d="M4 0.5 7.6 7.5H0.4Z" />}
      {status === 'critical' && <path d="M4 0 8 4 4 8 0 4Z" />}
    </svg>
  );
}

export function StatusBadge({ status, variant = 'soft' }: { status: Status; variant?: 'soft' | 'solid' }) {
  const tone = STATUS_TONE[status];
  const colors = variant === 'solid' ? `${tone.fill} text-on-status` : `${tone.soft} ${tone.text}`;
  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-badge px-2 text-label uppercase ${colors}`}
    >
      <StatusShape
        status={status}
        className={status === 'critical' ? 'motion-safe:animate-beacon-fast' : ''}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function MweriBadge({ cls }: { cls: MweriClass }) {
  const tone = MWERI_TONE[cls];
  return (
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-badge px-2 text-label uppercase ${tone.soft} ${tone.text}`}
    >
      {MWERI_CLASS_LABEL[cls]}
    </span>
  );
}
