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
  ignorePatterns: ['src/routeTree.gen.ts', 'worker-configuration.d.ts'],
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

    // Restriction
    'react/jsx-filename-extension': 'off',
    'react/only-export-components': 'off',
    'oxc/no-async-await': 'off',
    'oxc/no-rest-spread-properties': 'off',
    'import/exports-last': 'off',
    'import/no-relative-parent-imports': 'off',

    // Style
    'func-style': ['error', 'declaration'],
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
      files: ['src/routes/**/*.tsx'],
      rules: {
        'no-use-before-define': 'off'
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
        'oxfmt.config.ts',
        'oxlint.config.ts',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      rules: {
        'import/no-default-export': 'off'
      }
    }
  ]
})
