import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/modules/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.routes.ts'],
      thresholds: { lines: 60, branches: 60, functions: 60 }
    }
  }
});
