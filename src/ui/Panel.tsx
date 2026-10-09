/**
 * Wadah panel overlay (design-system §4.1): judul uppercase accent + subjudul mono opsional,
 * tombol lipat. Di bawah 1280px panel default terlipat (§13.7); pilihan pengguna dihormati.
 */
import { useId, useState, type ReactNode } from 'react';
import { UI } from '../config/i18n';
import { NARROW_QUERY, useMediaQuery } from './hooks';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Panel bawah yang lebar tidak perlu dilipat. */
  collapsible?: boolean;
  /** Kontrol tambahan di baris judul (mis. tombol info). */
  headerExtra?: ReactNode;
}

export function Panel({ title, subtitle, children, className = '', collapsible = true, headerExtra }: Props) {
  const id = useId();
  const narrow = useMediaQuery(NARROW_QUERY);
  const [override, setOverride] = useState<boolean | null>(null);
  const open = !collapsible || (override ?? !narrow);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`pointer-events-auto rounded-panel border border-line-strong bg-surface-0/92 p-panel shadow-panel ${className}`}
    >
      <header className="flex items-start justify-between gap-3">
        <h2 id={`${id}-title`} className="min-w-0 pt-0.5 text-title uppercase text-accent">
          {title}
        </h2>
        {headerExtra && <div className="ml-auto flex items-center">{headerExtra}</div>}
        {collapsible && (
          <button
            type="button"
            className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-control text-fg-2 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2 hover:text-fg"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            aria-label={open ? UI.panel.collapse : UI.panel.expand}
            onClick={() => setOverride(!open)}
          >
            <svg
              viewBox="0 0 16 16"
              className={`size-4 transition-transform duration-[var(--duration-base)] ${open ? '' : '-rotate-90'}`}
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
        )}
      </header>
      {subtitle && open && <p className="mt-0.5 font-mono text-caption text-fg-3">{subtitle}</p>}
      {/* Isi tidak di-render saat terlipat: hemat kerja & grafik tidak diukur pada ukuran 0. */}
      <div id={`${id}-body`} hidden={!open} className="mt-stack">
        {open && children}
      </div>
    </section>
  );
}
