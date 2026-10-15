import { defineConfig } from 'vitest/config';

// The database tests read DATABASE_URL, which in development comes from the
// repo's .env. A variable already set wins over the file.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // No .env: the database tests are skipped, or fail in CI (@core/db/testing).
}

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/api',
  test: {
    name: '@core/api',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    // Booting Nest inside a test takes several seconds while Nx runs every
    // project's tasks in parallel, past Vitest's 5-second default.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
