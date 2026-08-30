import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: {
    correctness: 'error',
    nursery: 'off',
    pedantic: 'off',
    perf: 'warn',
    restriction: 'warn',
    style: 'warn',
    suspicious: 'error'
  },
  ignorePatterns: [
    'src/routeTree.gen.ts',
    'worker-configuration.d.ts',
    'postcss.config.cjs',
    // Empty-module alias target for TanStack virtual modules under Vitest (see vitest.config.ts).
    'vitest/tanstack-entry-stub.ts'
  ],
  plugins: [
    'eslint',
    'unicorn',
    'react',
    'react-perf',
    'oxc',
    'import',
    'jsdoc',
    'jsx-a11y',
    'node',
    'promise'
  ],
  rules: {
    // Suspicious
    'react/react-in-jsx-scope': 'off',

    // Perf
    'react-perf/jsx-no-new-array-as-prop': 'off',
    'react-perf/jsx-no-new-function-as-prop': 'off',

    // Import
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],

    // Restriction
    'react/jsx-filename-extension': 'off',
    'react/jsx-max-depth': 'off',
    'react/jsx-no-literals': 'off',
    'react/only-export-components': 'off',
    // Panda CSS は className によるスタイリングが前提のため無効化
    'react/forbid-component-props': 'off',
    'oxc/no-async-await': 'off',
    'oxc/no-optional-chaining': 'off',
    'oxc/no-rest-spread-properties': 'off',
    'unicorn/no-null': 'off',
    'no-ternary': 'off',
    'no-undefined': 'off',
    'import/exports-last': 'off',
    'import/no-relative-parent-imports': 'off',

    // Style
    // 既定の always は const をカンマ結合する。1変数1宣言のままにする。
    'one-var': 'off',
    'func-style': 'off',
    'id-length': 'off',
    'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
    'no-magic-numbers': 'off',
    'sort-imports': 'off',
    'sort-keys': 'off',
    'import/group-exports': 'off',
    'import/no-named-export': 'off',
    'import/no-namespace': 'off',
    'import/prefer-default-export': 'off'
  },
  overrides: [
    {
      files: ['src/router.tsx'],
      rules: {
        'func-style': 'off'
      }
    },
    {
      files: ['src/test/persistence/global-setup.ts'],
      rules: {
        'import/no-default-export': 'off'
      }
    },
    {
      files: ['src/routes/**/*.tsx'],
      rules: {
        'no-use-before-define': 'off',
        // TanStack Router のファイルルーティング規約上、Route 定義と
        // コンポーネント / errorComponent を同ファイルに置くため許容する
        'react/no-multi-comp': 'off'
      }
    },
    {
      files: ['env.ts'],
      rules: {
        'node/no-process-env': 'off'
      }
    },
    {
      files: [
        'drizzle.config.ts',
        'knip.config.ts',
        'oxfmt.config.ts',
        'oxlint.config.ts',
        'panda.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'vitest.persistence.config.ts'
      ],
      rules: {
        'import/no-default-export': 'off',
        'node/no-process-env': 'off'
      }
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'unicorn/no-process-exit': 'off'
      }
    }
  ]
})
