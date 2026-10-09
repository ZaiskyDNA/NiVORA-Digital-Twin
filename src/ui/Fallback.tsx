/**
 * Pesan kegagalan yang dapat ditindaklanjuti: penyebab, langkah perbaikan (alamat pengaturan
 * yang bisa disalin), dan detail teknis. Tanpa WebGL, latar diisi tangkapan diam scene.
 */
import { useState } from 'react';
import { UI } from '../config/i18n';

function CopyUrl({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <code className="rounded-control bg-surface-2 px-1.5 py-0.5 font-mono text-caption text-fg select-all">{url}</code>
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(url).then(() => setDone(true))}
        className="rounded-control border border-line-control px-2 text-caption text-fg-2 hover:bg-surface-2 hover:text-fg"
      >
        {done ? UI.fallback.copied : UI.fallback.copy}
      </button>
    </span>
  );
}

export function Fallback({ title, error }: { title: string; error: Error | null }) {
  const noWebgl = error === null || /webgl|context/i.test(error.message);
  const F = UI.fallback;
  return (
    <div role="alert" className="relative grid h-full place-items-center p-gutter">
      {noWebgl && (
        <img src="/scene-fallback.jpg" alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-45" />
      )}
      <div className="pointer-events-auto relative max-w-xl rounded-panel border border-line-strong bg-surface-0 p-panel shadow-panel">
        <h1 className="text-heading font-semibold text-fg">{title}</h1>
        {noWebgl && <p className="mt-2 text-body text-fg-2">{F.noWebgl}</p>}
        <p className="mt-2 text-body text-fg-2">{F.hint}</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-body text-fg-2">
          {F.steps.map((s) => (
            <li key={s.url}>
              <CopyUrl url={s.url} /> <span className="block text-caption text-fg-3">{s.what}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-caption text-fg-3">{F.alt}</p>
        {error && (
          <details className="mt-3 text-caption text-fg-3">
            <summary className="cursor-pointer">{F.detail}</summary>
            <pre className="mt-1 font-mono break-words whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 h-control rounded-control border border-line-control bg-surface-1 px-4 text-body text-fg hover:bg-surface-2"
        >
          {F.reload}
        </button>
      </div>
    </div>
  );
}
