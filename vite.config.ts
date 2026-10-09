import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pra-bundle dependensi yang baru dimuat lewat lazy import, agar Vite tidak re-optimize
  // di tengah sesi (yang sempat menghasilkan dua salinan React → "Invalid hook call").
  build: {
    // Inti three.js (±740 kB, 188 kB gzip) adalah satu modul yang tidak bisa dipecah lebih jauh;
    // batas dinaikkan agar peringatan hanya muncul untuk regresi nyata.
    chunkSizeWarningLimit: 800,
    // Vendor besar dipisah agar bisa di-cache terpisah dari kode aplikasi (Rolldown codeSplitting).
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            {
              name: 'r3f',
              test: /node_modules[\\/](@react-three|postprocessing|three-stdlib|troika-|camera-controls|maath|meshline|@monogrid)/,
            },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory-vendor|es-toolkit|decimal\.js)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|zustand|use-sync-external-store)[\\/]/ },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['zustand', 'zustand/react/shallow'],
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    // Vitest mengosongkan CSS secara default; tokens.css perlu dibaca utuh oleh tokens.test.ts.
    css: { include: [/tokens\.css/] },
  },
});
