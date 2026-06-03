import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: {
    correctness: 'error',
    nursery: 'warn',
    pedantic: 'error',
    perf: 'error',
    restriction: 'warn',
    style: 'error',
    suspicious: 'error'
  },
  globals: {
    Env: 'readonly',
    ExecutionContext: 'readonly',
    URL: 'readonly'
  },
  ignorePatterns: ['src/routeTree.gen.ts', 'worker-configuration.d.ts'],
  options: {
    typeAware: true,
    typeCheck: true
  },
  overrides: [
    {
      files: ['oxfmt.config.ts', 'oxlint.config.ts', 'vite.config.ts', 'src/server.ts'],
      rules: {
        'import/no-default-export': 'off'
      }
    },
    {
      files: ['src/router.tsx', 'src/routes/**/*.tsx'],
      rules: {
        'eslint/func-style': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-return': 'off'
      }
    },
    {
      files: ['src/server.ts'],
      rules: {
        'oxc/no-async-await': 'off',
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    },
    {
      files: ['src/api/index.ts'],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    },
    {
      files: ['src/routes/__root.tsx'],
      rules: {
        'react/no-multi-comp': 'off',
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    }
  ],
  plugins: [
    'eslint',
    'typescript',
    'unicorn',
    'react',
    'react-perf',
    'import',
    'jsdoc',
    'jsx-a11y',
    'node',
    'promise',
    'oxc'
  ],
  rules: {
    'eslint/func-style': ['error', 'expression', { allowArrowFunctions: false }],
    'eslint/sort-imports': 'off',
    'import/exports-last': 'off',
    'import/no-named-export': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-filename-extension': 'off',
    'react/only-export-components': 'off',
    'react/react-in-jsx-scope': 'off'
  }
})
