import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react';
import { DISCLAIMER, UI } from './config/i18n';
import { stopTour } from './demo/tour';
import { hasWebGL2 } from './scene/webgl';
import { startSimClock } from './store/clock';
import { useTheme } from './store/useTheme';
import { useTour } from './store/useTour';
import { useView } from './store/useView';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Fallback } from './ui/Fallback';
import { KpiStrip } from './ui/KpiStrip';
import { LegendLine } from './ui/LegendLine';
import { LiveAnnouncer } from './ui/LiveAnnouncer';
import { MweriPanel } from './ui/MweriPanel';
import { ReactiveBanner } from './ui/ReactiveBanner';
import { RecommendationCard } from './ui/RecommendationCard';
import { MobileSheet } from './ui/MobileSheet';
import { MobileTopBar } from './ui/MobileTopBar';
import { TopBar } from './ui/TopBar';
import { TourOverlay } from './ui/TourOverlay';
import { WeightsDrawer } from './ui/WeightsDrawer';
import { useIsMobile } from './ui/hooks';

const DebugPage = lazy(() => import('./debug/DebugPage'));
const PlantScene = lazy(() => import('./scene/PlantScene'));

const webgl = typeof document !== 'undefined' && hasWebGL2();

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

/** Tombol pintas tidak aktif saat mengetik di input teks. */
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || (t instanceof HTMLInputElement && t.type !== 'range') || t instanceof HTMLTextAreaElement);

export default function App() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  const isDebug = hash === '#debug';
  const focus = useView((s) => s.focusMode);
  const compare = useView((s) => s.compareMode);
  const mobile = useIsMobile();

  // Jam simulasi untuk halaman utama (halaman debug memasang jamnya sendiri).
  useEffect(() => (isDebug ? undefined : startSimClock()), [isDebug]);
  // Esc menutup detail node (drawer bobot menangani Esc-nya sendiri); H = mode fokus; T = tema.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = useView.getState();
      if (e.key === 'Escape' && useTour.getState().active) {
        stopTour();
        return;
      }
      if (e.key === 'Escape' && !v.weightsOpen) v.selectNode(null);
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === 'h' || e.key === 'H') v.setFocusMode(!v.focusMode);
      if (e.key === 't' || e.key === 'T') useTheme.getState().toggle();
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
        {/* Scene gagal ≠ aplikasi gagal: panel tetap tampil, area scene berisi petunjuk perbaikan. */}
        {webgl ? (
          <ErrorBoundary fallback={(e) => <Fallback title={UI.fallback.sceneTitle} error={e} />}>
            <Suspense fallback={<p className="grid h-full place-items-center text-caption text-fg-3">Memuat scene 3D…</p>}>
              <PlantScene />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Fallback title={UI.fallback.sceneTitle} error={null} />
        )}
      </main>

      {mobile ? (
        // Ponsel (§13.16): TopBar dua baris + scene penuh + bottom sheet; tur di atas sheet.
        <div className="pointer-events-none absolute inset-0 z-[var(--z-panel)] flex flex-col">
          <MobileTopBar />
          <ReactiveBanner />
          <div className="mt-auto flex flex-col gap-2 landscape:w-[24rem] landscape:pl-3">
            <div className="px-3 landscape:px-0">
              <TourOverlay />
            </div>
            <MobileSheet />
          </div>
        </div>
      ) : (
      /*
        Declutter: maksimal tiga blok selalu terlihat — TopBar, panel MWERI, kartu Rekomendasi.
        KPI hanya saat "Bandingkan reaktif"; mode fokus (H) menyisakan kartu Rekomendasi.
      */
      <div className="pointer-events-none absolute inset-0 z-[var(--z-panel)] flex flex-col">
        <TopBar />
        <ReactiveBanner />

        <div className="flex min-h-0 flex-1 items-start justify-between gap-gutter px-gutter pt-4 pb-3">
          <aside className="flex max-h-full min-h-0 flex-col overflow-y-auto">{!focus && <MweriPanel />}</aside>
          <aside className="flex max-h-full min-h-0 flex-col overflow-y-auto">
            <RecommendationCard />
          </aside>
        </div>

        <footer className="flex flex-col gap-3 px-gutter pb-4">
          <TourOverlay />
          {compare && !focus && (
            <div className="flex justify-center">
              <KpiStrip />
            </div>
          )}
          <div className="flex items-end justify-between gap-4">
            <div className="pointer-events-auto">{!focus && <LegendLine />}</div>
            <p className="shrink-0 text-caption text-fg-3">{DISCLAIMER.illustrative}</p>
          </div>
        </footer>
      </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-[var(--z-drawer)]">
        <WeightsDrawer />
      </div>
      <LiveAnnouncer />
    </div>
  );
}
