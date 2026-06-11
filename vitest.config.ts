import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Cobre tanto *.test.ts (unit) quanto *.int.test.ts (integration via app.inject()).
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // O lcov.info precisa de paths RELATIVOS ao repo root para o SonarCloud
      // conseguir casar contra `sonar.sources=src`. Sem `projectRoot: './'` o
      // provider v8 grava caminhos absolutos do runner CI (/home/runner/...)
      // e a cobertura no Sonar cai em 0%.
      reporter: ['text', 'html', 'json-summary', ['lcov', { projectRoot: './' }]],
      include: [
        'src/modules/auth/**/*.ts',
        'src/modules/mercado/**/*.ts',
        'src/modules/equipe/**/*.ts',
        'src/modules/itens/**/*.ts',
        'src/modules/matchmaking/**/*.ts',
        'src/modules/partida/**/*.ts'
      ],
      exclude: ['**/*.test.ts', '**/*.routes.ts'],
      thresholds: { lines: 60, branches: 60, functions: 60 }
    }
  }
});
