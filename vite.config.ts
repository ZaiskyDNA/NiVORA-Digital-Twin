import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
