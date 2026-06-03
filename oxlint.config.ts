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
      files: ['src/api/**/*.ts'],
      rules: {
        'eslint/complexity': 'off',
        'eslint/func-style': 'off',
        'eslint/id-length': 'off',
        'eslint/init-declarations': 'off',
        'eslint/max-lines': 'off',
        'eslint/max-lines-per-function': 'off',
        'eslint/max-params': 'off',
        'eslint/max-statements': 'off',
        'eslint/no-await-in-loop': 'off',
        'eslint/no-bitwise': 'off',
        'eslint/no-continue': 'off',
        'eslint/no-magic-numbers': 'off',
        'eslint/no-ternary': 'off',
        'eslint/prefer-const': 'off',
        'eslint/prefer-destructuring': 'off',
        'eslint/sort-keys': 'off',
        'import/group-exports': 'off',
        'import/no-relative-parent-imports': 'off',
        'node/callback-return': 'off',
        'oxc/branches-sharing-code': 'off',
        'oxc/no-async-await': 'off',
        'oxc/no-optional-chaining': 'off',
        'oxc/no-rest-spread-properties': 'off',
        'typescript/consistent-return': 'off',
        'typescript/consistent-type-definitions': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-member-accessibility': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-confusing-void-expression': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/parameter-properties': 'off',
        'typescript/prefer-nullish-coalescing': 'off',
        'typescript/prefer-readonly-parameter-types': 'off',
        'typescript/strict-boolean-expressions': 'off',
        'unicorn/custom-error-definition': 'off',
        'unicorn/explicit-length-check': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-at': 'off',
        'unicorn/prefer-math-trunc': 'off',
        'unicorn/throw-new-error': 'off'
      }
    },
    {
      files: ['src/db/**/*.ts'],
      rules: {
        'eslint/func-style': 'off',
        'eslint/id-length': 'off',
        'eslint/no-bitwise': 'off',
        'eslint/no-magic-numbers': 'off',
        'import/group-exports': 'off',
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    },
    {
      files: ['src/lib/api.ts'],
      rules: {
        'eslint/curly': 'off',
        'eslint/func-style': 'off',
        'eslint/id-length': 'off',
        'eslint/max-statements': 'off',
        'eslint/no-continue': 'off',
        'eslint/no-magic-numbers': 'off',
        'eslint/require-await': 'off',
        'eslint/sort-keys': 'off',
        'import/group-exports': 'off',
        'oxc/no-async-await': 'off',
        'oxc/no-optional-chaining': 'off',
        'typescript/consistent-type-definitions': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-member-accessibility': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-invalid-void-type': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/parameter-properties': 'off',
        'typescript/prefer-readonly-parameter-types': 'off',
        'typescript/strict-boolean-expressions': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-global-this': 'off'
      }
    },
    {
      files: ['src/router.tsx', 'src/routes/**/*.tsx'],
      rules: {
        'eslint/func-style': 'off',
        'eslint/require-await': 'off',
        'import/consistent-type-specifier-style': 'off',
        'import/no-relative-parent-imports': 'off',
        'oxc/no-async-await': 'off',
        'oxc/no-optional-chaining': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/prefer-readonly-parameter-types': 'off',
        'typescript/strict-boolean-expressions': 'off',
        'unicorn/filename-case': 'off'
      }
    },
    {
      files: ['src/routes/__root.tsx'],
      rules: {
        'react/no-multi-comp': 'off',
        'typescript/consistent-type-imports': 'off',
        'typescript/prefer-readonly-parameter-types': 'off'
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
      files: ['src/routeTree.gen.ts'],
      rules: {
        'unicorn/filename-case': 'off'
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
