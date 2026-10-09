/** Menu kamera (disclosure) di TopBar: preset Overview / Fokus Node A / Rute. */
import { useEffect, useId, useRef, useState } from 'react';
import { UI } from '../config/i18n';
import { CameraPresetBar } from './CameraPresetBar';

export function CameraMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1.5 rounded-control border border-line-control bg-surface-1 px-3 text-caption text-fg-2 hover:bg-surface-2 hover:text-fg"
      >
        {UI.top.camera}
        <svg viewBox="0 0 16 16" className={`size-3.5 ${open ? 'rotate-180' : ''}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div
          id={id}
          className="absolute top-10 right-0 z-[var(--z-drawer)] rounded-tile border border-line-strong bg-surface-0 p-2 shadow-panel"
          onClick={(e) => (e.target as HTMLElement).closest('[role="radio"]') && setOpen(false)}
        >
          <CameraPresetBar />
        </div>
      )}
    </div>
  );
}
