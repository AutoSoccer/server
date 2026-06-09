import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/modules/auth/**/*.ts',
        'src/modules/mercado/**/*.ts',
        'src/modules/equipe/**/*.ts',
        'src/modules/itens/**/*.ts'
      ],
      exclude: ['**/*.test.ts', '**/*.routes.ts'],
      thresholds: { lines: 60, branches: 60, functions: 60 }
    }
  }
});
