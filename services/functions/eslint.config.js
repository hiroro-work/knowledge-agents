import pluginJs from '@eslint/js';
import pluginVitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const baseConfig = [
  {
    ignores: ['lib/**', '*.cjs'],
  },
];

/** @type {import('eslint').Linter.Config[]} */
const jsConfig = [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
const tsConfig = [
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
      },
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          alphabetize: { order: 'asc' },
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase-admin/*'],
              message: '@local/admin-shared should be used instead.',
            },
          ],
        },
      ],
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
const testOverridesConfig = [
  {
    files: ['tests/**/*', '**/*.test.ts'],
    plugins: {
      '@vitest': pluginVitest,
    },
    rules: {
      ...pluginVitest.configs['legacy-recommended'].rules,
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
];

export default tseslint.config(...baseConfig, ...jsConfig, ...tsConfig, ...testOverridesConfig, eslintConfigPrettier);
