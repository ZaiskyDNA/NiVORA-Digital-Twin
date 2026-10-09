import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pra-bundle dependensi yang baru dimuat lewat lazy import, agar Vite tidak re-optimize
  // di tengah sesi (yang sempat menghasilkan dua salinan React → "Invalid hook call").
  optimizeDeps: {
    include: ['zustand', 'zustand/react/shallow'],
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
