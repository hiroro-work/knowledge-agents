import pluginJs from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginVitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const baseConfig = [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', 'packages/**', 'services/**', 'playwright-report/**'],
  },
];

/** @type {import('eslint').Linter.Config[]} */
const jsConfig = [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
const tsConfig = [
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*'],
              message: 'utils/firebase should be used instead.',
            },
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
const reactConfig = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'jsx-a11y': pluginJsxA11y,
      '@next/next': pluginNext,
      import: pluginImport,
    },
    rules: {
      ...pluginJsxA11y.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          alphabetize: { order: 'asc' },
        },
      ],
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
const tailwindcssConfig = [
  {
    ...pluginBetterTailwindcss.configs.recommended,
    files: ['src/**/*'],
    plugins: {
      'better-tailwindcss': pluginBetterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/globals.css',
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
const testOverridesConfig = [
  {
    files: ['tests/**/*'],
    plugins: {
      '@vitest': pluginVitest,
    },
    rules: {
      ...pluginVitest.configs['legacy-recommended'].rules,
      '@vitest/expect-expect': 'off',
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

export default tseslint.config(
  ...baseConfig,
  ...jsConfig,
  ...tsConfig,
  ...reactConfig,
  ...tailwindcssConfig,
  ...testOverridesConfig,
  eslintConfigPrettier,
);
