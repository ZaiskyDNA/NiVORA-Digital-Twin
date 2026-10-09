/** Lapisan DOM NodeCard di atas canvas; posisi ditulis per frame oleh LabelLeaders (registry). */
import { useView } from '../store/useView';
import { NodeCard } from '../ui/NodeCard';
import { NodePill } from '../ui/NodePill';
import { bindLabel } from './labelRegistry';
import { useSceneLabels } from './useSceneLabels';

export function NodeCardLayer() {
  const cards = useSceneLabels().filter((l) => l.kind === 'card' || l.kind === 'pill');
  const selected = useView((s) => s.selected);
  return (
    <div className="pointer-events-none absolute inset-0 z-[var(--z-scene-overlay)] overflow-hidden">
      {cards.map((l) => (
        <div
          key={l.id}
          ref={bindLabel(l.id)}
          className="absolute top-0 left-0 will-change-transform"
          // Kartu terpilih selalu di atas kartu lain.
          style={{ visibility: 'hidden', zIndex: l.id === `node-${selected}` ? 2 : 1 }}
        >
          {l.kind === 'pill' ? (
            <NodePill nodeId={l.id.replace('node-', '')} />
          ) : (
            <NodeCard nodeId={l.id.replace('node-', '')} />
          )}
        </div>
      ))}
    </div>
  );
}
