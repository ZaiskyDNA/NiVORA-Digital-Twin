/**
 * Tombol tema: ikon matahari (ke terang) / bulan (ke gelap). `aria-pressed` = tema terang aktif.
 * Shortcut T ditangani di App. `wide` = baris berlabel untuk menu ponsel.
 */
import { UI } from '../config/i18n';
import { useTheme } from '../store/useTheme';

export function ThemeToggle({ wide = false }: { wide?: boolean }) {
  const light = useTheme((s) => s.theme === 'light');
  const toggle = useTheme((s) => s.toggle);
  return (
    <button
      type="button"
      aria-label={UI.theme.light}
      aria-pressed={light}
      aria-keyshortcuts="T"
      title={UI.theme.hint}
      onClick={toggle}
      className={`flex items-center justify-center gap-2 rounded-control border border-line-control bg-surface-1 text-fg-2 transition-colors duration-[var(--duration-fast)] hover:bg-surface-2 hover:text-fg ${
        wide ? 'h-10 w-full text-body text-fg' : 'h-8 px-2 text-caption'
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        {light ? (
          <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" strokeLinejoin="round" />
        ) : (
          <>
            <circle cx="8" cy="8" r="2.9" />
            <path d="M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" />
          </>
        )}
      </svg>
      {wide && UI.theme.light}
    </button>
  );
}
