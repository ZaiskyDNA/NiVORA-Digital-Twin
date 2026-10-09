import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react';
import { DISCLAIMER } from './config/i18n';
import { startSimClock } from './store/clock';
import { ImpactPanel } from './ui/ImpactPanel';
import { Legend } from './ui/Legend';
import { LiveAnnouncer } from './ui/LiveAnnouncer';
import { MweriPanel } from './ui/MweriPanel';
import { PathwayBar } from './ui/PathwayBar';
import { ReactiveBanner } from './ui/ReactiveBanner';
import { RoutingPanel } from './ui/RoutingPanel';
import { ScenarioBar } from './ui/ScenarioBar';
import { TopBar } from './ui/TopBar';
import { WeightsDrawer } from './ui/WeightsDrawer';
import { useView } from './store/useView';

const DebugPage = lazy(() => import('./debug/DebugPage'));
const PlantScene = lazy(() => import('./scene/PlantScene'));

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export default function App() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  const isDebug = hash === '#debug';
  // Jam simulasi untuk halaman utama (halaman debug memasang jamnya sendiri).
  useEffect(() => (isDebug ? undefined : startSimClock()), [isDebug]);
  // Esc menutup detail node (drawer bobot menangani Esc-nya sendiri).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = useView.getState();
      if (e.key === 'Escape' && !v.weightsOpen) v.selectNode(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (isDebug) {
    return (
      <Suspense fallback={null}>
        <DebugPage />
      </Suspense>
    );
  }

  return (
    <div className="relative h-full">
      <main className="absolute inset-0 z-[var(--z-scene)]">
        <Suspense fallback={<p className="grid h-full place-items-center text-caption text-fg-3">Memuat scene 3D…</p>}>
          <PlantScene />
        </Suspense>
      </main>

      {/* Lapisan UI di atas scene: hanya panel yang menangkap pointer. */}
      <div className="pointer-events-none absolute inset-0 z-[var(--z-panel)] flex flex-col">
        <TopBar />
        <ReactiveBanner />

        <div className="flex min-h-0 flex-1 items-start justify-between gap-gutter px-gutter pt-5 pb-4">
          <aside className="flex max-h-full min-h-0 flex-col overflow-y-auto">
            <MweriPanel />
          </aside>
          <aside className="flex max-h-full min-h-0 flex-col gap-stack overflow-y-auto">
            <RoutingPanel />
            <ImpactPanel />
          </aside>
        </div>

        <footer className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-stack px-gutter pb-5 max-[1279px]:grid-cols-[minmax(0,1fr)_auto]">
          <PathwayBar />
          <ScenarioBar />
          <div className="flex flex-col items-end gap-2 max-[1279px]:col-span-2 max-[1279px]:flex-row max-[1279px]:items-center max-[1279px]:justify-between">
            <p className="text-caption text-fg-3">{DISCLAIMER.illustrative}</p>
            <Legend />
          </div>
        </footer>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[var(--z-drawer)]">
        <WeightsDrawer />
      </div>
      <LiveAnnouncer />
    </div>
  );
}
