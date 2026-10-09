/** Pemilih preset kamera (sementara di Fase 3; ditata ulang di Fase 5). Radiogroup, bisa keyboard. */
import type { KeyboardEvent } from 'react';
import { CAMERA_PRESET_LABEL } from '../config/i18n';
import { CAMERA_PRESETS, useView } from '../store/useView';

export function CameraPresetBar() {
  const preset = useView((s) => s.preset);
  const setPreset = useView((s) => s.setPreset);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = preset === 'focus' ? 0 : CAMERA_PRESETS.indexOf(preset);
    const next = CAMERA_PRESETS[(i + (e.key === 'ArrowRight' ? 1 : -1) + CAMERA_PRESETS.length) % CAMERA_PRESETS.length];
    if (next) setPreset(next);
  };

  return (
    <div role="radiogroup" aria-label="Preset kamera" className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
      {CAMERA_PRESETS.map((p) => {
        const checked = p === preset;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (preset === 'focus' && p === 'overview') ? 0 : -1}
            onClick={() => setPreset(p)}
            className={`h-control whitespace-nowrap rounded-control border px-3 text-body transition-colors duration-[var(--duration-fast)] ${
              checked
                ? 'border-accent bg-accent/16 font-semibold text-accent'
                : 'border-line-control bg-surface-1 text-fg-2 hover:bg-surface-2 hover:text-fg'
            }`}
          >
            {CAMERA_PRESET_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
