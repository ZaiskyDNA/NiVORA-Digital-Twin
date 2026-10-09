/**
 * Satu region `role="status"` global (design-system §4.2, §4.5): mengumumkan node yang menjadi
 * critical dan rute yang dialihkan — badge individual tidak menjadi live region.
 */
import { useEffect, useRef, useState } from 'react';
import type { SimEvent } from '../sim/engine';
import { selectViewed, useSim } from '../store/useSim';

function describe(e: SimEvent): string | null {
  if (e.type === 'status' && e.detail?.endsWith('critical')) return `Node ${e.nodeId} berubah menjadi Critical`;
  if (e.type === 'reroute' && e.taskId === undefined) {
    const via = e.detail?.split('⇒')[1]?.trim();
    return via ? `Rute Node ${e.nodeId} dialihkan: ${via.replaceAll('→', ' → ')}` : null;
  }
  return null;
}

export function LiveAnnouncer() {
  const [message, setMessage] = useState('');
  const seen = useRef(0);

  useEffect(
    () =>
      useSim.subscribe((s) => {
        const events = selectViewed(s).events;
        const last = events.at(-1);
        // Event baru = timestamp/jumlah berubah; reset simulasi mengosongkan daftar.
        const stamp = last ? last.t * 1000 + events.length : 0;
        if (stamp === seen.current) return;
        seen.current = stamp;
        for (let i = events.length - 1; i >= 0 && events[i]?.t === last?.t; i--) {
          const text = describe(events[i] as SimEvent);
          if (text) {
            setMessage(text);
            break;
          }
        }
      }),
    [],
  );

  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  );
}
