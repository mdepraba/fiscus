import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/fiscus-web',
  server: {
    port: 4200,
    host: 'localhost',
    // Production serves the app and the API from one origin; the proxy keeps
    // that true in development, so nothing needs CORS or a second base URL.
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/health': 'http://127.0.0.1:3000',
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    // NFR-22: the first load stays at or under 200 KB gzipped.
    reportCompressedSize: true,
  },
  test: {
    name: '@app/fiscus-web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
