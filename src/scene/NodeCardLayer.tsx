/** Lapisan DOM NodeCard di atas canvas; posisi ditulis per frame oleh LabelLeaders (registry). */
import { NodeCard } from '../ui/NodeCard';
import { bindLabel } from './labelRegistry';
import { useSceneLabels } from './useSceneLabels';

export function NodeCardLayer() {
  const cards = useSceneLabels().filter((l) => l.kind === 'card');
  return (
    <div className="pointer-events-none absolute inset-0 z-[var(--z-scene-overlay)] overflow-hidden">
      {cards.map((l) => (
        <div
          key={l.id}
          ref={bindLabel(l.id)}
          className="absolute top-0 left-0 will-change-transform"
          style={{ visibility: 'hidden' }}
        >
          <NodeCard nodeId={l.id.replace('node-', '')} />
        </div>
      ))}
    </div>
  );
}
