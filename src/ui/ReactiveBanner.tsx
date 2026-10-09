/** Penanda jelas saat scene & panel menampilkan baseline reaktif, bukan keputusan NiVORA. */
import { UI } from '../config/i18n';
import { useSim } from '../store/useSim';

export function ReactiveBanner() {
  const reactive = useSim((s) => s.view === 'reactive');
  if (!reactive) return null;
  return (
    <p
      role="note"
      className="pointer-events-auto mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-critical/70 bg-surface-0 px-4 py-1.5 text-caption font-semibold text-critical-fg shadow-panel"
    >
      <span aria-hidden className="size-2 rounded-full bg-critical" />
      {UI.compare.banner}
    </p>
  );
}
