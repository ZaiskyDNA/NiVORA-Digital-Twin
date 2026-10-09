const PILLARS = ['Predict', 'Protect', 'Circulate'] as const;

export default function App() {
  return (
    <div className="relative flex h-full flex-col">
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
              className="rounded-full h-control border border-line-control bg-surface-1 px-4 text-body leading-8 font-semibold"
            >
              {p}
            </span>
          ))}
        </nav>
      </header>

      <main className="grid flex-1 place-items-center">
        <p className="font-mono text-caption text-fg-2">Scene 3D menyusul di Fase 3</p>
      </main>

      <footer className="px-8 pb-4 text-right text-label font-normal tracking-normal text-fg-3">
        Visualisasi konsep · seluruh nilai bersifat ilustratif
      </footer>
    </div>
  );
}
