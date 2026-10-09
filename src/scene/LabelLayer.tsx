/** Lapisan DOM label callout di atas canvas (posisi ditulis oleh LabelProjector). */
import { bindLabel } from './labelRegistry';
import { useSceneLabels } from './useSceneLabels';

export function LabelLayer() {
  const labels = useSceneLabels();
  return (
    <div className="pointer-events-none absolute inset-0 z-[var(--z-scene-overlay)] overflow-hidden" aria-hidden>
      {labels.map((l) => (
        <div
          key={l.id}
          ref={bindLabel(l.id)}
          className="absolute top-0 left-0 whitespace-nowrap rounded-control border bg-surface-0/90 px-2.5 py-1.5 shadow-raised will-change-transform"
          style={{ borderColor: `${l.color}99`, visibility: 'hidden' }}
        >
          <div className="text-caption font-semibold" style={{ color: l.color }}>
            {l.title}
          </div>
          {l.caption && <div className="text-label font-normal tracking-normal text-fg-2">{l.caption}</div>}
        </div>
      ))}
    </div>
  );
}
