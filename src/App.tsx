import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react';
import { DISCLAIMER } from './config/i18n';
import { startSimClock } from './store/clock';
import { CameraPresetBar } from './ui/CameraPresetBar';
import { SimControls } from './ui/SimControls';

const DebugPage = lazy(() => import('./debug/DebugPage'));
const PlantScene = lazy(() => import('./scene/PlantScene'));

const PILLARS = ['Predict', 'Protect', 'Circulate'] as const;

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export default function App() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  const isDebug = hash === '#debug';
  // Jam simulasi untuk halaman utama (halaman debug memasang jamnya sendiri).
  useEffect(() => (isDebug ? undefined : startSimClock()), [isDebug]);
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

      {/* Lapisan UI di atas scene: hanya elemen interaktif yang menangkap pointer. */}
      <div className="pointer-events-none absolute inset-0 z-[var(--z-panel)] flex flex-col">
        <header className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-tile bg-linear-to-br from-safe to-normal text-xl font-extrabold text-on-status">
              Ni
            </div>
            <div>
              <h1 className="text-display font-bold tracking-tight">
                NiVORA <span className="font-medium text-accent">Digital Twin</span>
              </h1>
              <p className="text-caption text-fg-2">Predictive Circular Material Management · Smelter Nikel</p>
            </div>
          </div>
          <nav className="flex gap-2">
            {PILLARS.map((p) => (
              <span
                key={p}
                className="h-control rounded-full border border-line-control bg-surface-1 px-4 text-body leading-8 font-semibold"
              >
                {p}
              </span>
            ))}
          </nav>
        </header>

        <div className="flex-1" />

        <footer className="flex items-end justify-between gap-6 px-8 pb-5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3">
            <SimControls />
            <span className="mx-1 h-6 w-px bg-line-strong" aria-hidden />
            <span className="text-label uppercase text-fg-3">Kamera</span>
            <CameraPresetBar />
            <a className="pointer-events-auto ml-3 text-caption text-accent underline" href="#debug">
              debug engine
            </a>
          </div>
          <p className="text-label font-normal tracking-normal text-fg-3">{DISCLAIMER.illustrative}</p>
        </footer>
      </div>
    </div>
  );
}
