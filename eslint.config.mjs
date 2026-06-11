import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Globals padrao do runtime Node usados ao longo do projeto. Centralizar
// aqui evita repetir `console/process/__dirname/...` em cada bloco.
const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  fetch: 'readonly'
};

// `_` como prefixo sinaliza parametro/variavel propositalmente nao usada
// (callbacks do Fastify, handlers de erro). Ajustar a regra evita ter que
// renomear ou adicionar `// eslint-disable-next-line` em cada caso.
const noUnusedVarsAllowUnderscore = [
  'error',
  {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_'
  }
];

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: nodeGlobals
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': noUnusedVarsAllowUnderscore
    }
  },
  {
    files: ['**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': noUnusedVarsAllowUnderscore
    }
  },
  {
    // Testes podem usar `any` quando precisam mockar shapes complexos do
    // Sequelize/Fastify. Manter a regra como `warn` evita romper o CI sem
    // perder a sinalizacao no editor.
    files: ['**/*.test.ts', 'src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
